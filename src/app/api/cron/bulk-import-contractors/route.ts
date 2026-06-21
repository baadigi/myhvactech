import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Token-authed bulk importer for the Serper-Maps commercial sweep.
// POST { rows: [{company_name, city, state, phone, website, street_address,
//   google_place_id, avg_rating, review_count}] } — dedups vs existing
// contractors (place_id -> phone -> slug) and inserts commercial_verified=true.
// Auth: vercel-cron UA or Bearer CRON_SECRET (same as the other crons).
export const maxDuration = 300
export const dynamic = 'force-dynamic'

function validateCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth === `Bearer ${secret}`) return true
  if (request.headers.get('x-vercel-cron')) return true
  if ((request.headers.get('user-agent') || '').toLowerCase().includes('vercel-cron')) return true
  return false
}

function slugify(company: string, city: string): string {
  return `${company}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const norm = (p: string | null | undefined) => (p || '').replace(/\D/g, '').slice(-10)

interface InRow {
  company_name?: string
  city?: string
  state?: string
  phone?: string | null
  website?: string | null
  street_address?: string | null
  google_place_id?: string | null
  avg_rating?: number | null
  review_count?: number | null
}

export async function POST(request: NextRequest) {
  if (!validateCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const rows: InRow[] = body?.rows
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Body must contain a non-empty "rows" array' }, { status: 400 })
  }

  const db = createAdminClient()

  // Build candidate records (drop rows missing required fields)
  const records = rows
    .filter((r) => r.company_name?.trim() && r.city?.trim() && r.state?.trim())
    .map((r) => ({
      company_name: r.company_name!.trim(),
      city: r.city!.trim(),
      state: r.state!.trim(),
      slug: slugify(r.company_name!.trim(), r.city!.trim()),
      phone: r.phone || null,
      website: r.website || null,
      street_address: r.street_address || null,
      google_place_id: r.google_place_id || null,
      avg_rating: typeof r.avg_rating === 'number' ? r.avg_rating : 0,
      review_count: typeof r.review_count === 'number' ? r.review_count : 0,
      ph: norm(r.phone),
    }))

  // Existing keys for dedup
  const placeIds = [...new Set(records.map((r) => r.google_place_id).filter(Boolean) as string[])]
  const existingPlaceIds = new Set<string>()
  for (let i = 0; i < placeIds.length; i += 200) {
    const { data } = await db.from('contractors').select('google_place_id').in('google_place_id', placeIds.slice(i, i + 200))
    data?.forEach((d: { google_place_id: string | null }) => d.google_place_id && existingPlaceIds.add(d.google_place_id))
  }

  const slugs = [...new Set(records.map((r) => r.slug))]
  const existingSlugs = new Set<string>()
  for (let i = 0; i < slugs.length; i += 200) {
    const { data } = await db.from('contractors').select('slug').in('slug', slugs.slice(i, i + 200))
    data?.forEach((d: { slug: string }) => existingSlugs.add(d.slug))
  }

  // Phone dedup needs all existing phones (can't .in() on a derived value)
  const existingPhones = new Set<string>()
  {
    const { data } = await db.from('contractors').select('phone').not('phone', 'is', null)
    data?.forEach((d: { phone: string | null }) => { const n = norm(d.phone); if (n.length === 10) existingPhones.add(n) })
  }

  const seenPid = new Set<string>()
  const seenPhone = new Set<string>()
  const seenSlug = new Set<string>()
  const fresh: typeof records = []
  let skipped = 0

  for (const r of records) {
    const pid = r.google_place_id
    if (pid && (existingPlaceIds.has(pid) || seenPid.has(pid))) { skipped++; continue }
    if (r.ph.length === 10 && (existingPhones.has(r.ph) || seenPhone.has(r.ph))) { skipped++; continue }
    if (existingSlugs.has(r.slug) || seenSlug.has(r.slug)) { skipped++; continue }
    if (pid) seenPid.add(pid)
    if (r.ph.length === 10) seenPhone.add(r.ph)
    seenSlug.add(r.slug)
    fresh.push(r)
  }

  let imported = 0
  for (let i = 0; i < fresh.length; i += 100) {
    const batch = fresh.slice(i, i + 100).map(({ ph, ...rec }) => ({
      ...rec,
      commercial_verified: true,
      is_verified: false,
      country: 'US',
      subscription_tier: 'free',
      profile_views: 0,
    }))
    const { data, error } = await db.from('contractors').insert(batch).select('id')
    if (error) return NextResponse.json({ imported, skipped, error: error.message }, { status: 500 })
    imported += data?.length ?? 0
  }

  return NextResponse.json({ received: rows.length, imported, skipped })
}
