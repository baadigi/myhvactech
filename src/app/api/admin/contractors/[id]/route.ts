import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function validateAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.email !== ADMIN_EMAIL) return null
  return user
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await validateAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const db = createAdminClient()
    const { data: contractor, error } = await db
      .from('contractors')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    return NextResponse.json({ contractor })
  } catch (err) {
    console.error('Admin GET contractor error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await validateAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

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
      'years_commercial_experience', 'google_place_id', 'owner_id',
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
    console.error('Admin PATCH contractor error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
