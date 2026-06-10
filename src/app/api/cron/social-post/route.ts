import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/constants'

// Auto-posts to social (FB / Instagram / Pinterest / Threads) via GHL Social
// Planner. Stream 1: share any newly-published blog. Stream 2 (fallback): on
// days with no new blog, recycle an older published post with a fresh caption
// so the feed stays active. Posts to ALL connected GHL accounts (fetched at
// runtime), so any platform you add later is included automatically.
export const maxDuration = 120
export const dynamic = 'force-dynamic'

const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_VERSION = '2021-07-28'

function validateCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth === `Bearer ${secret}`) return true
  if (request.headers.get('x-vercel-cron')) return true
  if ((request.headers.get('user-agent') || '').toLowerCase().includes('vercel-cron')) return true
  return false
}

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_VERSION,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

interface GhlAccount { id: string; platform: string }

async function getAccounts(token: string, locationId: string): Promise<GhlAccount[]> {
  const res = await fetch(`${GHL_BASE}/social-media-posting/${locationId}/accounts`, {
    headers: ghlHeaders(token),
  })
  if (!res.ok) throw new Error(`GHL accounts ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  // GHL has nested the accounts array under different keys across versions —
  // dig for the first array we can find; surface the raw shape if we can't.
  const arr =
    (Array.isArray(data) && data) ||
    (Array.isArray(data.accounts) && data.accounts) ||
    (Array.isArray(data.results) && data.results) ||
    (Array.isArray(data?.results?.accounts) && data.results.accounts) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data?.data?.accounts) && data.data.accounts) ||
    null
  if (!arr) throw new Error(`GHL accounts shape: ${JSON.stringify(data).slice(0, 400)}`)
  return arr
    .map((a: { id?: string; _id?: string; accountId?: string; platform?: string; type?: string }) => ({
      id: (a.id || a._id || a.accountId) as string,
      platform: (a.platform || a.type || '').toLowerCase(),
    }))
    .filter((a: GhlAccount) => a.id)
}

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string
  cover_image_url: string | null
  social_share_count: number | null
}

async function writeCaption(post: Post, apiKey: string, recycle: boolean): Promise<string> {
  const url = `${SITE_URL}/blog/${post.slug}`
  const sys = `You write punchy social captions for MyHVAC.Tech — a commercial HVAC directory for property managers and facility managers (NOT homeowners). Voice: helpful, professional, a little punchy. No emojis-spam (1-2 max). Return ONLY the caption text.`
  const user = `${recycle ? 'Recycle this older article with a fresh angle' : 'Announce this new article'}:
Title: ${post.title}
Category: ${post.category}
Excerpt: ${post.excerpt || ''}
Link to include at the end: ${url}

Write one caption (~50-90 words) for Facebook / Instagram / Pinterest / Threads aimed at facility & property managers. Lead with a hook or a useful takeaway, then the link, then 3-5 relevant hashtags (commercial HVAC focused). Plain text only.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: sys,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`Claude ${res.status}`)
  const data = await res.json()
  const text = data.content?.[0]?.text?.trim()
  if (!text) throw new Error('empty caption')
  return text.includes(url) ? text : `${text}\n\n${url}`
}

function mimeFromUrl(url: string): string {
  const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return 'image/jpeg'
}

// Our blog heroes are WebP, but GHL/Instagram only accept JPEG/PNG and reject
// the whole multi-account post otherwise. Proxy WebP through weserv (free image
// CDN) to deliver a JPEG every platform accepts. Non-WebP URLs pass through.
function socialImageUrl(url: string): string {
  if (!/\.webp(\?|$)/i.test(url)) return url
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg&q=85`
}

// GHL requires the user that "owns" the post. Prefer an env override, else
// pull the first user on the location (needs users.readonly on the token).
async function getUserId(token: string, locationId: string): Promise<string> {
  if (process.env.GHL_USER_ID) return process.env.GHL_USER_ID
  const res = await fetch(`${GHL_BASE}/users/?locationId=${locationId}`, { headers: ghlHeaders(token) })
  if (!res.ok) throw new Error(`GHL users ${res.status} — set GHL_USER_ID env var. ${(await res.text()).slice(0, 120)}`)
  const data = await res.json()
  const users = data.users || data.results || (Array.isArray(data) ? data : [])
  const id = users[0]?.id || users[0]?._id
  if (!id) throw new Error('No GHL user found — set GHL_USER_ID env var')
  return id
}

async function createPost(token: string, locationId: string, userId: string, accountIds: string[], summary: string, imageUrl: string) {
  const mediaUrl = socialImageUrl(imageUrl)
  const res = await fetch(`${GHL_BASE}/social-media-posting/${locationId}/posts`, {
    method: 'POST',
    headers: ghlHeaders(token),
    body: JSON.stringify({
      accountIds,
      summary,
      media: [{ url: mediaUrl, type: mimeFromUrl(mediaUrl) }],
      status: 'published',
      type: 'post',
      userId,
    }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`GHL post ${res.status}: ${body.slice(0, 300)}`)
  return body
}

export async function GET(request: NextRequest) {
  if (!validateCron(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = process.env.GHL_API_TOKEN
  const locationId = process.env.GHL_LOCATION_ID
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!token || !locationId) return NextResponse.json({ error: 'GHL_API_TOKEN / GHL_LOCATION_ID not set' }, { status: 500 })
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  const db = createAdminClient()
  const { searchParams } = new URL(request.url)
  const debug = searchParams.get('debug')
  const only = (searchParams.get('only') || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)

  let accounts: GhlAccount[]
  try {
    accounts = await getAccounts(token, locationId)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'accounts fetch failed' }, { status: 502 })
  }

  // ?debug=1 — just show what's connected, post nothing
  if (debug === '1') {
    return NextResponse.json({ debug: true, connected: accounts })
  }

  // ?only=facebook,instagram — restrict to given platforms (default: all)
  const selected = only.length ? accounts.filter((a) => only.includes(a.platform)) : accounts
  const accountIds = selected.map((a) => a.id)
  if (accountIds.length === 0) {
    return NextResponse.json({ error: 'No matching GHL social accounts', connected: accounts }, { status: 422 })
  }

  // Stream 1: newest published blog never shared (must have an image for IG/Pinterest)
  const { data: fresh } = await db
    .from('blog_posts')
    .select('id, title, slug, excerpt, category, cover_image_url, social_share_count')
    .eq('status', 'published')
    .is('social_posted_at', null)
    .not('cover_image_url', 'is', null)
    .order('published_at', { ascending: false })
    .limit(1)

  let target = (fresh && fresh[0]) as Post | undefined
  let recycle = false

  // Stream 2: nothing new → recycle the least-recently-shared older post
  if (!target) {
    const { data: old } = await db
      .from('blog_posts')
      .select('id, title, slug, excerpt, category, cover_image_url, social_share_count')
      .eq('status', 'published')
      .not('cover_image_url', 'is', null)
      .order('social_share_count', { ascending: true })
      .order('published_at', { ascending: true })
      .limit(1)
    target = (old && old[0]) as Post | undefined
    recycle = true
  }

  if (!target) return NextResponse.json({ posted: false, reason: 'no eligible posts' })

  try {
    const userId = await getUserId(token, locationId)
    const caption = await writeCaption(target, apiKey, recycle)
    await createPost(token, locationId, userId, accountIds, caption, target.cover_image_url as string)

    const upd: Record<string, unknown> = { social_share_count: (target.social_share_count || 0) + 1 }
    if (!recycle) upd.social_posted_at = new Date().toISOString()
    await db.from('blog_posts').update(upd).eq('id', target.id)

    return NextResponse.json({
      posted: true,
      mode: recycle ? 'recycle' : 'new',
      post: target.slug,
      accounts: accountIds.length,
    })
  } catch (e) {
    return NextResponse.json({ posted: false, error: e instanceof Error ? e.message : 'post failed', post: target.slug }, { status: 502 })
  }
}
