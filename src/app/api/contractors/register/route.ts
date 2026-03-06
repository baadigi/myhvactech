import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HVAC_SERVICES } from '@/lib/constants'

// ─── Slug generation ──────────────────────────────────────────────────────────

function generateSlug(companyName: string, city: string): string {
  const combined = `${companyName}-${city}`
  return combined
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanumeric (keep spaces + hyphens)
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '')           // trim leading/trailing hyphens
}

async function deduplicateSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string
): Promise<string> {
  // Check if the base slug is already taken
  const { data } = await supabase
    .from('contractors')
    .select('slug')
    .ilike('slug', `${baseSlug}%`)
    .order('slug', { ascending: true })

  if (!data || data.length === 0) return baseSlug

  const existingSlugs = new Set(data.map((r: { slug: string }) => r.slug))
  if (!existingSlugs.has(baseSlug)) return baseSlug

  // Try appending a number
  for (let i = 2; i <= 100; i++) {
    const candidate = `${baseSlug}-${i}`
    if (!existingSlugs.has(candidate)) return candidate
  }

  // Fallback: append timestamp
  return `${baseSlug}-${Date.now()}`
}

// ─── Request body type ────────────────────────────────────────────────────────

interface RegisterBody {
  // Step 1
  company_name: string
  phone?: string
  email?: string
  website?: string
  street_address?: string
  city: string
  state: string
  zip_code?: string
  year_established?: string
  license_number?: string

  // Step 2
  system_types?: string[]
  building_types_served?: string[]
  brands_serviced?: string[]
  tonnage_range_min?: string
  tonnage_range_max?: string
  services_offered?: string[] // HVAC_SERVICES slugs

  // Step 3
  num_technicians?: string
  num_nate_certified?: string
  emergency_response_minutes?: string
  offers_24_7?: boolean
  multi_site_coverage?: boolean
  max_sites_supported?: string
  offers_service_agreements?: boolean
  service_agreement_types?: string[]
  dispatch_crm?: string
  uses_gps_tracking?: boolean
  avg_quote_turnaround_hours?: string
  sla_summary?: string

  // Step 4
  description?: string
  short_description?: string
}

// ─── POST /api/contractors/register ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Validate authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    let body: RegisterBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Validate required fields
    if (!body.company_name?.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 422 })
    }
    if (!body.city?.trim()) {
      return NextResponse.json({ error: 'City is required' }, { status: 422 })
    }
    if (!body.state?.trim()) {
      return NextResponse.json({ error: 'State is required' }, { status: 422 })
    }
    if (!body.email?.trim()) {
      return NextResponse.json({ error: 'Business email is required' }, { status: 422 })
    }
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 422 })
    }

    // Check if this user already has a contractor profile
    const { data: existing } = await supabase
      .from('contractors')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a contractor profile' },
        { status: 409 }
      )
    }

    // Generate deduplicated slug
    const baseSlug = generateSlug(body.company_name.trim(), body.city.trim())
    const slug = await deduplicateSlug(supabase, baseSlug)

    // Parse numeric fields safely
    const toInt = (v?: string): number | null => {
      if (!v || v.trim() === '') return null
      const n = parseInt(v, 10)
      return isNaN(n) ? null : n
    }

    // Build contractor insert payload
    const contractorPayload = {
      owner_id: user.id,
      company_name: body.company_name.trim(),
      slug,
      is_claimed: true,
      subscription_tier: 'free' as const,

      // Contact & location
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      website: body.website?.trim() || null,
      street_address: body.street_address?.trim() || null,
      city: body.city.trim(),
      state: body.state.trim(),
      zip_code: body.zip_code?.trim() || null,
      country: 'US',

      // Company info
      year_established: toInt(body.year_established),
      license_number: body.license_number?.trim() || null,

      // Commercial capabilities
      system_types: body.system_types ?? [],
      building_types_served: body.building_types_served ?? [],
      brands_serviced: body.brands_serviced ?? [],
      tonnage_range_min: toInt(body.tonnage_range_min),
      tonnage_range_max: toInt(body.tonnage_range_max),

      // Operations
      num_technicians: toInt(body.num_technicians),
      num_nate_certified: toInt(body.num_nate_certified),
      emergency_response_minutes: toInt(body.emergency_response_minutes),
      offers_24_7: body.offers_24_7 ?? false,
      multi_site_coverage: body.multi_site_coverage ?? false,
      max_sites_supported: body.multi_site_coverage ? toInt(body.max_sites_supported) : null,
      offers_service_agreements: body.offers_service_agreements ?? false,
      service_agreement_types: body.offers_service_agreements
        ? (body.service_agreement_types ?? [])
        : [],
      dispatch_crm: body.dispatch_crm?.trim() || null,
      uses_gps_tracking: body.uses_gps_tracking ?? false,
      avg_quote_turnaround_hours: toInt(body.avg_quote_turnaround_hours),
      sla_summary: body.sla_summary?.trim() || null,

      // Descriptions
      description: body.description?.trim() || null,
      short_description: body.short_description?.trim()?.slice(0, 160) || null,

      // Defaults
      is_verified: false,
      is_featured: false,
      commercial_verified: false,
      insurance_verified: false,
      service_radius_miles: 50,
      avg_rating: 0,
      review_count: 0,
      profile_views: 0,
      subscription_status: 'active',
    }

    // Insert contractor
    const { data: contractor, error: insertError } = await supabase
      .from('contractors')
      .insert(contractorPayload)
      .select()
      .single()

    if (insertError || !contractor) {
      console.error('Contractor insert error:', insertError)
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create contractor profile' },
        { status: 500 }
      )
    }

    // Insert contractor_services junction records
    const serviceSlugs = body.services_offered ?? []
    if (serviceSlugs.length > 0) {
      // Look up service IDs by slug from the services table
      const { data: servicesData, error: svcLookupError } = await supabase
        .from('services')
        .select('id, slug')
        .in('slug', serviceSlugs)

      if (!svcLookupError && servicesData && servicesData.length > 0) {
        const junctionRows = servicesData.map((svc: { id: string; slug: string }) => ({
          contractor_id: contractor.id,
          service_id: svc.id,
        }))

        const { error: junctionError } = await supabase
          .from('contractor_services')
          .insert(junctionRows)

        if (junctionError) {
          // Non-fatal: contractor was created, just log the error
          console.error('contractor_services insert error:', junctionError)
        }
      } else {
        // Fallback: if services table lookup fails, try matching by name
        const serviceNameMap = new Map<string, string>(
          HVAC_SERVICES.map((s) => [s.slug as string, s.name])
        )
        const unmatchedSlugs = serviceSlugs.filter(
          (slug) => !servicesData?.find((s: { slug: string }) => s.slug === slug)
        )
        if (unmatchedSlugs.length > 0) {
          const unmatchedNames = unmatchedSlugs.map((slug) => serviceNameMap.get(slug)).filter(Boolean)
          console.warn('Some services not found in DB:', unmatchedNames)
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        contractor: {
          id: contractor.id,
          slug: contractor.slug,
          company_name: contractor.company_name,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Registration route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
