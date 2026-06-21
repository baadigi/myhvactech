import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRADE_KEY } from '@/lib/trade-scope'
import { syncContractorGoogle } from '@/lib/google-places'

// Syncs a batch of never-synced contractors per run, so a big import (5k+)
// fills in its Google ratings/reviews/photos over a few hours, hands-off.
// Also auto-catches any FUTURE import (any place_id holder never synced).
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Vercel cron sends no Authorization header unless CRON_SECRET is set, so also
// accept its x-vercel-cron header / vercel-cron user-agent (same as scan-news).
function validateCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  if (request.headers.get('x-vercel-cron')) return true
  if ((request.headers.get('user-agent') || '').toLowerCase().includes('vercel-cron')) return true
  return false
}

// ~300 * 0.6s ≈ 180s, comfortably under the 300s function limit.
const BATCH = 300

export async function GET(request: NextRequest) {
  if (!validateCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  const db = createAdminClient()

  const { data: contractors, error } = await db
    .from('contractors')
    .select('id, google_place_id')
    .eq('trade', TRADE_KEY)
    .not('google_place_id', 'is', null)
    .is('google_last_synced_at', null)
    .limit(BATCH)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!contractors || contractors.length === 0) {
    return NextResponse.json({ success: true, synced: 0, remaining: 0, message: 'All caught up' })
  }

  let synced = 0
  for (const c of contractors) {
    try {
      await syncContractorGoogle(c.google_place_id!, c.id, apiKey, db)
      synced++
      await new Promise((r) => setTimeout(r, 100))
    } catch {
      // Stamp last_synced even on failure so a permanently-bad place_id doesn't
      // re-clog the queue every run. The manual sync (null-OR-stale) can retry it later.
      await db.from('contractors').update({ google_last_synced_at: new Date().toISOString() }).eq('id', c.id)
    }
  }

  const { count: remaining } = await db
    .from('contractors')
    .select('id', { count: 'exact', head: true })
    .eq('trade', TRADE_KEY)
    .not('google_place_id', 'is', null)
    .is('google_last_synced_at', null)

  return NextResponse.json({ success: true, synced, remaining: remaining ?? 0 })
}
