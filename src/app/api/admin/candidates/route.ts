import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRADE_KEY, withTrade } from '@/lib/trade-scope'
import { externalUrl } from '@/lib/utils'

const ADMIN_EMAIL = 'ryan@baadigi.com'

const STATE_NAMES: Record<string, string> = {
  CA: 'California', WA: 'Washington', NV: 'Nevada', AZ: 'Arizona', OR: 'Oregon',
  TX: 'Texas', NY: 'New York', FL: 'Florida', GA: 'Georgia', AL: 'Alabama',
  NC: 'North Carolina', OH: 'Ohio', IL: 'Illinois',
}

function fullState(abbr: string | null): string {
  if (!abbr) return 'California'
  return STATE_NAMES[abbr.toUpperCase()] || abbr
}

function generateSlug(companyName: string, city: string): string {
  return `${companyName}-${city}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function deduplicateSlug(
  client: ReturnType<typeof createAdminClient>,
  baseSlug: string
): Promise<string> {
  const { data } = await client
    .from('contractors')
    .select('slug')
    .eq('trade', TRADE_KEY)
    .ilike('slug', `${baseSlug}%`)
  const existing = new Set((data || []).map((r: { slug: string }) => r.slug))
  if (!existing.has(baseSlug)) return baseSlug
  for (let i = 2; i <= 100; i++) {
    if (!existing.has(`${baseSlug}-${i}`)) return `${baseSlug}-${i}`
  }
  return `${baseSlug}-${Date.now()}`
}

export async function POST(request: NextRequest) {
  // Admin auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, action } = await request.json()
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const db = createAdminClient()

  const { data: cand, error: candErr } = await db
    .from('contractor_candidates')
    .select('*')
    .eq('id', id)
    .single()
  if (candErr || !cand) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }
  if (cand.status !== 'pending') {
    return NextResponse.json({ error: `Already ${cand.status}` }, { status: 409 })
  }

  if (action === 'reject') {
    await db.from('contractor_candidates')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', id)
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // approve → promote into contractors
  const city = (cand.city || '').trim()
  if (!city) {
    return NextResponse.json({ error: 'Candidate has no city — edit before approving' }, { status: 422 })
  }
  const slug = await deduplicateSlug(db, generateSlug(cand.name, city))

  const { data: created, error: insErr } = await db
    .from('contractors')
    .insert(withTrade({
      company_name: cand.name,
      slug,
      city,
      state: fullState(cand.state),
      street_address: cand.street || null,
      zip_code: cand.zip || null,
      country: 'USA',
      phone: cand.phone || null,
      email: cand.email || null,
      website: externalUrl(cand.website),
      is_verified: false,
      is_claimed: false,
    }))
    .select('id')
    .single()

  if (insErr || !created) {
    return NextResponse.json({ error: `Promote failed: ${insErr?.message}` }, { status: 500 })
  }

  await db.from('contractor_candidates')
    .update({ status: 'approved', reviewed_at: new Date().toISOString(), promoted_contractor_id: created.id })
    .eq('id', id)

  return NextResponse.json({ ok: true, status: 'approved', contractor_id: created.id, slug })
}
