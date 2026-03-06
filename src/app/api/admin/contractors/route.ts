import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

// ─── Slug generation ──────────────────────────────────────────────────────────

function generateSlug(companyName: string, city: string): string {
  const combined = `${companyName}-${city}`
  return combined
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
    .ilike('slug', `${baseSlug}%`)
    .order('slug', { ascending: true })

  if (!data || data.length === 0) return baseSlug

  const existingSlugs = new Set(data.map((r: { slug: string }) => r.slug))
  if (!existingSlugs.has(baseSlug)) return baseSlug

  for (let i = 2; i <= 100; i++) {
    const candidate = `${baseSlug}-${i}`
    if (!existingSlugs.has(candidate)) return candidate
  }

  return `${baseSlug}-${Date.now()}`
}

// ─── Admin auth check ─────────────────────────────────────────────────────────

async function validateAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.email !== ADMIN_EMAIL) {
    return null
  }
  return user
}

// ─── GET /api/admin/contractors ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await validateAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = createAdminClient()

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const tier = url.searchParams.get('tier') || 'all'
    const verified = url.searchParams.get('verified') || 'all'
    const sort = url.searchParams.get('sort') || 'created_at'
    const order = url.searchParams.get('order') || 'desc'
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

    let query = db
      .from('contractors')
      .select(`
        id,
        company_name,
        slug,
        city,
        state,
        subscription_tier,
        is_verified,
        is_featured,
        commercial_verified,
        is_claimed,
        avg_rating,
        review_count,
        profile_views,
        created_at,
        email,
        phone,
        slot_tier,
        metro_area,
        owner_id,
        google_place_id,
        google_rating,
        google_review_count,
        google_last_synced_at
      `, { count: 'exact' })

    // Filters
    if (search) {
      query = query.ilike('company_name', `%${search}%`)
    }
    if (tier !== 'all') {
      query = query.eq('subscription_tier', tier)
    }
    if (verified === 'yes') {
      query = query.eq('is_verified', true)
    }

    if (verified === 'no') {
      query = query.eq('is_verified', false)
    }

    const missingDesc = url.searchParams.get('missing_descriptions')
    if (missingDesc === 'true') {
      query = query.or('description.is.null,description.eq.')
    }

    // Sort
    const validSortFields = ['company_name', 'avg_rating', 'review_count', 'created_at', 'profile_views']
    const sortField = validSortFields.includes(sort) ? sort : 'created_at'
    query = query.order(sortField, { ascending: order === 'asc' })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: contractors, error, count } = await query

    if (error) {
      console.error('Admin contractors fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch lead counts for each contractor
    let leadsMap: Record<string, number> = {}
    if (contractors && contractors.length > 0) {
      const ids = contractors.map((c: { id: string }) => c.id)
      const { data: leadsData } = await db
        .from('leads')
        .select('contractor_id')
        .in('contractor_id', ids)

      if (leadsData) {
        leadsMap = leadsData.reduce((acc: Record<string, number>, row: { contractor_id: string }) => {
          acc[row.contractor_id] = (acc[row.contractor_id] || 0) + 1
          return acc
        }, {})
      }
    }

    const enriched = (contractors || []).map((c: Record<string, unknown>) => ({
      ...c,
      leads_count: leadsMap[c.id as string] || 0,
    }))

    return NextResponse.json({
      contractors: enriched,
      total: count ?? 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('Admin contractors route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/contractors ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await validateAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const companyName = (body.company_name as string)?.trim()
    const city = (body.city as string)?.trim()
    const state = (body.state as string)?.trim()

    if (!companyName) return NextResponse.json({ error: 'Company name is required' }, { status: 422 })
    if (!city) return NextResponse.json({ error: 'City is required' }, { status: 422 })
    if (!state) return NextResponse.json({ error: 'State is required' }, { status: 422 })

    const toInt = (v: unknown): number | null => {
      if (v === undefined || v === null || v === '') return null
      const n = parseInt(String(v), 10)
      return isNaN(n) ? null : n
    }

    const toFloat = (v: unknown): number | null => {
      if (v === undefined || v === null || v === '') return null
      const n = parseFloat(String(v))
      return isNaN(n) ? null : n
    }

    const db = createAdminClient()

    const baseSlug = generateSlug(companyName, city)
    const slug = await deduplicateSlug(db, baseSlug)

    const payload = {
      owner_id: (body.owner_id as string) || null,
      company_name: companyName,
      slug,
      city,
      state,
      country: 'US',
      phone: (body.phone as string)?.trim() || null,
      email: (body.email as string)?.trim() || null,
      website: (body.website as string)?.trim() || null,
      street_address: (body.street_address as string)?.trim() || null,
      zip_code: (body.zip_code as string)?.trim() || null,
      description: (body.description as string)?.trim() || null,
      short_description: (body.short_description as string)?.trim()?.slice(0, 160) || null,
      license_number: (body.license_number as string)?.trim() || null,
      year_established: toInt(body.year_established),

      // Admin-controlled flags
      is_verified: Boolean(body.is_verified),
      is_featured: Boolean(body.is_featured),
      is_claimed: Boolean(body.is_claimed),
      commercial_verified: Boolean(body.commercial_verified),
      insurance_verified: Boolean(body.insurance_verified),
      subscription_tier: (body.subscription_tier as string) || 'free',
      subscription_status: 'active',
      slot_tier: (body.slot_tier as string) || null,
      metro_area: (body.metro_area as string)?.trim() || null,

      // Commercial
      system_types: (body.system_types as string[]) || [],
      building_types_served: (body.building_types_served as string[]) || [],
      brands_serviced: (body.brands_serviced as string[]) || [],
      tonnage_range_min: toInt(body.tonnage_range_min),
      tonnage_range_max: toInt(body.tonnage_range_max),
      service_radius_miles: toInt(body.service_radius_miles) || 50,
      years_commercial_experience: toInt(body.years_commercial_experience),

      // Operations
      num_technicians: toInt(body.num_technicians),
      num_nate_certified: toInt(body.num_nate_certified),
      emergency_response_minutes: toInt(body.emergency_response_minutes),
      offers_24_7: Boolean(body.offers_24_7),
      multi_site_coverage: Boolean(body.multi_site_coverage),
      max_sites_supported: toInt(body.max_sites_supported),
      offers_service_agreements: Boolean(body.offers_service_agreements),
      service_agreement_types: (body.service_agreement_types as string[]) || [],
      dispatch_crm: (body.dispatch_crm as string)?.trim() || null,
      uses_gps_tracking: Boolean(body.uses_gps_tracking),
      avg_quote_turnaround_hours: toFloat(body.avg_quote_turnaround_hours),
      sla_summary: (body.sla_summary as string)?.trim() || null,

      // Google Business Profile — only include if value is present
      ...(body.google_place_id ? { google_place_id: (body.google_place_id as string)?.trim() } : {}),

      // Defaults
      avg_rating: 0,
      review_count: 0,
      profile_views: 0,
    }

    // First attempt with all fields
    let { data: contractor, error: insertError } = await db
      .from('contractors')
      .insert(payload)
      .select()
      .single()

    // If it fails with a column error, try with minimal fields
    if (insertError) {
      console.error('Admin contractor insert error (attempt 1):', insertError.message)

      // Strip optional google/extended fields that might not exist yet
      const safePayload: Record<string, unknown> = {}
      const coreFields = [
        'owner_id', 'company_name', 'slug', 'city', 'state', 'country',
        'phone', 'email', 'website', 'street_address', 'zip_code',
        'description', 'short_description', 'license_number', 'year_established',
        'is_verified', 'is_featured', 'is_claimed', 'commercial_verified',
        'insurance_verified', 'subscription_tier', 'subscription_status',
        'slot_tier', 'metro_area',
        'system_types', 'building_types_served', 'brands_serviced',
        'tonnage_range_min', 'tonnage_range_max', 'service_radius_miles',
        'years_commercial_experience',
        'num_technicians', 'num_nate_certified', 'emergency_response_minutes',
        'offers_24_7', 'multi_site_coverage', 'max_sites_supported',
        'offers_service_agreements', 'service_agreement_types', 'dispatch_crm',
        'uses_gps_tracking', 'avg_quote_turnaround_hours', 'sla_summary',
        'avg_rating', 'review_count', 'profile_views',
      ]
      for (const key of coreFields) {
        if (key in payload) safePayload[key] = (payload as Record<string, unknown>)[key]
      }

      const retry = await db
        .from('contractors')
        .insert(safePayload)
        .select()
        .single()

      contractor = retry.data
      insertError = retry.error

      if (insertError) {
        console.error('Admin contractor insert error (attempt 2):', insertError.message)
      }
    }

    if (insertError || !contractor) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create contractor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, contractor }, { status: 201 })
  } catch (err) {
    console.error('Admin POST contractors error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/contractors ────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await validateAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const id = body.id as string
    if (!id) {
      return NextResponse.json({ error: 'Contractor ID is required' }, { status: 422 })
    }

    // Build update payload — only allow updating specific fields
    const allowedFields = [
      'company_name', 'phone', 'email', 'website', 'street_address', 'city', 'state', 'zip_code',
      'description', 'short_description', 'license_number', 'year_established',
      'is_verified', 'is_featured', 'is_claimed', 'commercial_verified', 'insurance_verified',
      'subscription_tier', 'slot_tier', 'metro_area',
      'system_types', 'building_types_served', 'brands_serviced',
      'tonnage_range_min', 'tonnage_range_max', 'service_radius_miles',
      'num_technicians', 'num_nate_certified', 'emergency_response_minutes',
      'offers_24_7', 'multi_site_coverage', 'max_sites_supported',
      'offers_service_agreements', 'service_agreement_types', 'dispatch_crm',
      'uses_gps_tracking', 'avg_quote_turnaround_hours', 'sla_summary',
      'years_commercial_experience',
      'google_place_id',
      'owner_id',
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 422 })
    }

    const db = createAdminClient()

    const { data: contractor, error: updateError } = await db
      .from('contractors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !contractor) {
      console.error('Admin contractor update error:', updateError)
      return NextResponse.json(
        { error: updateError?.message || 'Failed to update contractor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, contractor })
  } catch (err) {
    console.error('Admin PATCH contractors error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/admin/contractors ────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await validateAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Contractor ID is required' }, { status: 422 })
    }

    const db = createAdminClient()

    // Delete related records first (cascade manually for safety)
    await db.from('leads').delete().eq('contractor_id', id)
    await db.from('reviews').delete().eq('contractor_id', id)
    await db.from('contractor_photos').delete().eq('contractor_id', id)
    await db.from('sample_projects').delete().eq('contractor_id', id)
    await db.from('contractor_services').delete().eq('contractor_id', id)
    await db.from('contractor_service_areas').delete().eq('contractor_id', id)
    await db.from('claim_requests').delete().eq('contractor_id', id)

    // Delete the contractor
    const { error: deleteError } = await db
      .from('contractors')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Admin contractor delete error:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete contractor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, deleted: id })
  } catch (err) {
    console.error('Admin DELETE contractors error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
