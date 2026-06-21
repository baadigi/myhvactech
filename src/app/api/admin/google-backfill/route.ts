import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRADE_KEY } from '@/lib/trade-scope'
import { findPlaceId, syncContractorGoogle } from '@/lib/google-places'
import { US_STATES } from '@/lib/constants'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

function stateNameFor(abbrOrName: string): string {
  const s = US_STATES.find(
    (x) => x.abbr.toLowerCase() === abbrOrName.toLowerCase() ||
           x.name.toLowerCase() === abbrOrName.toLowerCase()
  )
  return s?.name ?? abbrOrName
}

function stateAbbrFor(abbrOrName: string): string {
  const s = US_STATES.find(
    (x) => x.abbr.toLowerCase() === abbrOrName.toLowerCase() ||
           x.name.toLowerCase() === abbrOrName.toLowerCase()
  )
  return s?.abbr ?? abbrOrName
}

export const maxDuration = 300

// POST — Discover a Google Place ID (via Find Place from Text) for contractors
// that don't have one yet, then sync full details. Processes up to `limit` per
// call (default 75) to stay under the serverless timeout; re-run until remaining = 0.
// Body (optional): { limit?: number }
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_PLACES_API_KEY not configured. Add it in Vercel env vars.' },
      { status: 500 }
    )
  }

  let limit = 75
  try {
    const body = await request.json().catch(() => ({}))
    if (typeof body.limit === 'number' && body.limit > 0) limit = Math.min(body.limit, 200)
  } catch { /* no body — use default */ }

  const db = createAdminClient()

  const { data: contractors, error } = await db
    .from('contractors')
    .select('id, company_name, city, state')
    .eq('trade', TRADE_KEY)
    .is('google_place_id', null)
    .neq('subscription_status', 'cancelled')
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!contractors || contractors.length === 0) {
    return NextResponse.json({ message: 'No contractors missing a Place ID', found: 0, not_found: 0, remaining: 0 })
  }

  const results: { id: string; company_name: string; status: 'synced' | 'not_found' | string; rating?: number; reviews?: number }[] = []

  for (const c of contractors) {
    try {
      const stateName = stateNameFor(c.state)
      const stateAbbr = stateAbbrFor(c.state)
      const placeId = await findPlaceId(c.company_name, c.city, stateAbbr, stateName, apiKey)

      if (!placeId) {
        results.push({ id: c.id, company_name: c.company_name, status: 'not_found' })
        await new Promise((r) => setTimeout(r, 150))
        continue
      }

      const data = await syncContractorGoogle(placeId, c.id, apiKey, db)
      results.push({
        id: c.id,
        company_name: c.company_name,
        status: 'synced',
        rating: data.rating,
        reviews: data.review_count,
      })
      await new Promise((r) => setTimeout(r, 250))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'failed'
      results.push({ id: c.id, company_name: c.company_name, status: `error: ${message}` })
    }
  }

  // How many still have no place_id after this batch?
  const { count: remaining } = await db
    .from('contractors')
    .select('id', { count: 'exact', head: true })
    .eq('trade', TRADE_KEY)
    .is('google_place_id', null)
    .neq('subscription_status', 'cancelled')

  const found = results.filter((r) => r.status === 'synced').length
  const notFound = results.filter((r) => r.status === 'not_found').length

  return NextResponse.json({
    success: true,
    processed: contractors.length,
    found,
    not_found: notFound,
    remaining: remaining ?? null,
    results,
  })
}
