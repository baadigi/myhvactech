import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRADE_KEY } from '@/lib/trade-scope'
import { pickSubject, imagePrompt, generateAndStoreImage } from '@/lib/blog-images'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

export const maxDuration = 300

// POST — Regenerate the cover image for existing posts with a fresh, per-post
// subject (fixes older posts that all share the same identical hero image).
// Body (optional): { limit?: number, onlyAuto?: boolean }
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  // gpt-image-1 takes ~15-30s per image, so process a SMALL batch per call and
  // let the client loop until `remaining` is 0 (avoids the function timeout).
  let limit = 4
  let onlyAuto = false
  try {
    const body = await request.json().catch(() => ({}))
    if (typeof body.limit === 'number' && body.limit > 0) limit = Math.min(body.limit, 8)
    if (body.onlyAuto === true) onlyAuto = true
  } catch { /* no body — defaults */ }

  const db = createAdminClient()

  // Skip posts already regenerated (cover already on the -cover-v2 path) so each
  // call advances to the next batch and re-runs are resumable.
  let q = db
    .from('blog_posts')
    .select('id, slug, title')
    .eq('trade', TRADE_KEY)
    .eq('status', 'published')
    .not('cover_image_url', 'ilike', '%-cover-v2%')
    .order('published_at', { ascending: true })
    .limit(limit)
  if (onlyAuto) q = q.eq('is_auto_generated', true)

  const { data: posts, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts?.length) return NextResponse.json({ success: true, regenerated: 0, remaining: 0, results: [] })

  const results: { slug: string; status: 'updated' | string }[] = []

  for (const post of posts) {
    try {
      // Cache-bust the path so the CDN serves the new image, not the old upload.
      const url = await generateAndStoreImage(
        db,
        imagePrompt(pickSubject(post.slug, 0), post.title),
        `auto/${post.slug}-cover-v2.png`
      )
      if (!url) {
        results.push({ slug: post.slug, status: 'image_failed' })
        continue
      }
      const { error: upErr } = await db
        .from('blog_posts')
        .update({ cover_image_url: url })
        .eq('id', post.id)
      results.push({ slug: post.slug, status: upErr ? `error: ${upErr.message}` : 'updated' })
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      results.push({ slug: post.slug, status: `error: ${err instanceof Error ? err.message : 'failed'}` })
    }
  }

  const regenerated = results.filter((r) => r.status === 'updated').length

  // How many published posts still have an old (non-v2) cover?
  let remQ = db
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('trade', TRADE_KEY)
    .eq('status', 'published')
    .not('cover_image_url', 'ilike', '%-cover-v2%')
  if (onlyAuto) remQ = remQ.eq('is_auto_generated', true)
  const { count: remaining } = await remQ

  return NextResponse.json({ success: true, regenerated, batch: posts.length, remaining: remaining ?? 0, results })
}
