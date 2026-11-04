import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRADE_KEY } from '@/lib/trade-scope'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function validateAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.email !== ADMIN_EMAIL) return null
  return user
}

// ─── GET /api/admin/listing-review — self-registered listings by review state ─

export async function GET(request: NextRequest) {
  try {
    if (!(await validateAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = new URL(request.url).searchParams.get('status') || 'pending'
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const db = createAdminClient()
    const { data: listings, error } = await db
      .from('contractors')
      .select(`
        id, created_at, updated_at, company_name, slug, city, state,
        website, email, phone, license_number, short_description, description,
        listing_status, listing_review
      `)
      .eq('trade', TRADE_KEY)
      .eq('listing_status', status)
      .not('owner_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('Listing review fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ listings: listings ?? [] })
  } catch (err) {
    console.error('Admin GET listing-review error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/listing-review — approve or reject a listing ───────────

export async function PATCH(request: NextRequest) {
  try {
    const admin = await validateAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const id = (body.id as string)?.trim()
    const action = body.action as string
    const note = (body.note as string)?.trim() || null

    if (!id) return NextResponse.json({ error: 'Listing ID is required' }, { status: 422 })
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 422 })
    }

    const db = createAdminClient()

    const { data: existing, error: fetchError } = await db
      .from('contractors')
      .select('id, listing_review')
      .eq('trade', TRADE_KEY)
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // The contractors_listing_guard trigger does the rest: an approved listing goes
    // live, anything else stays hidden from every public page and the sitemap.
    const { data: listing, error: updateError } = await db
      .from('contractors')
      .update({
        listing_status: action === 'approve' ? 'approved' : 'rejected',
        listing_review: {
          ...((existing.listing_review as Record<string, unknown> | null) ?? {}),
          decision: action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: admin.email,
          reviewed_at: new Date().toISOString(),
          note,
        },
      })
      .eq('trade', TRADE_KEY)
      .eq('id', id)
      .select('id, slug, listing_status')
      .single()

    if (updateError || !listing) {
      console.error('Listing review update error:', updateError)
      return NextResponse.json(
        { error: updateError?.message || 'Failed to update listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, listing })
  } catch (err) {
    console.error('Admin PATCH listing-review error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
