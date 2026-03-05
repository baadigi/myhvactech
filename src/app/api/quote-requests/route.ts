import { NextRequest, NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteRequestPayload {
  building_type: string
  property_sqft: number | null
  num_buildings: number
  num_units_rtus: number | null
  system_types: string[]
  service_type: string
  current_issues: string | null
  budget_band: string | null
  timing: string | null
  requestor_name: string
  requestor_email: string
  requestor_phone: string | null
  requestor_title: string | null
  company_name: string | null
  property_city: string | null
  property_state: string | null
  property_zip: string | null
  source?: string
}

// ─── Valid enum values (mirrors types.ts) ────────────────────────────────────

const VALID_SERVICE_TYPES = [
  'repair',
  'replacement',
  'new_install',
  'maintenance_agreement',
  'emergency',
  'energy_audit',
  'other',
] as const

const VALID_BUILDING_TYPES = [
  'office',
  'retail',
  'industrial',
  'healthcare',
  'education',
  'hospitality',
  'data_center',
  'multifamily',
  'government',
  'restaurant',
  'mixed_use',
] as const

// ─── POST /api/quote-requests ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: QuoteRequestPayload

  // Parse JSON body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // ── Validate required fields ──────────────────────────────────────────────

  const validationErrors: string[] = []

  if (!body.building_type || typeof body.building_type !== 'string') {
    validationErrors.push('building_type is required')
  } else if (!(VALID_BUILDING_TYPES as readonly string[]).includes(body.building_type)) {
    validationErrors.push(`building_type must be one of: ${VALID_BUILDING_TYPES.join(', ')}`)
  }

  if (!body.service_type || typeof body.service_type !== 'string') {
    validationErrors.push('service_type is required')
  } else if (!(VALID_SERVICE_TYPES as readonly string[]).includes(body.service_type)) {
    validationErrors.push(`service_type must be one of: ${VALID_SERVICE_TYPES.join(', ')}`)
  }

  if (!body.requestor_name || typeof body.requestor_name !== 'string' || !body.requestor_name.trim()) {
    validationErrors.push('requestor_name is required')
  }

  if (!body.requestor_email || typeof body.requestor_email !== 'string' || !body.requestor_email.trim()) {
    validationErrors.push('requestor_email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.requestor_email)) {
    validationErrors.push('requestor_email must be a valid email address')
  }

  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationErrors },
      { status: 422 }
    )
  }

  // ── Build the record ──────────────────────────────────────────────────────

  const quoteRequestId = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const now = new Date().toISOString()

  const record = {
    id: quoteRequestId,
    created_at: now,
    requestor_name: body.requestor_name.trim(),
    requestor_email: body.requestor_email.trim().toLowerCase(),
    requestor_phone: body.requestor_phone ?? null,
    requestor_title: body.requestor_title ?? null,
    company_name: body.company_name ?? null,
    building_type: body.building_type,
    property_sqft: body.property_sqft ?? null,
    num_buildings: body.num_buildings ?? 1,
    num_units_rtus: body.num_units_rtus ?? null,
    system_types: Array.isArray(body.system_types) ? body.system_types : [],
    current_issues: body.current_issues ?? null,
    service_type: body.service_type,
    budget_band: body.budget_band ?? null,
    timing: body.timing ?? null,
    property_city: body.property_city ?? null,
    property_state: body.property_state ?? null,
    property_zip: body.property_zip ?? null,
    metro_area: null,
    assigned_contractor_ids: [],
    max_contractors: 3,
    status: 'new',
    routed_at: null,
    expires_at: null,
    source: body.source ?? 'api',
    estimated_deal_value: null,
  }

  // ── Persist (Supabase integration point) ─────────────────────────────────

  // TODO: Replace the console.log below with a real Supabase insert:
  //
  //   import { createClient } from '@supabase/supabase-js'
  //   const supabase = createClient(
  //     process.env.SUPABASE_URL!,
  //     process.env.SUPABASE_SERVICE_ROLE_KEY!
  //   )
  //   const { data, error } = await supabase
  //     .from('quote_requests')
  //     .insert(record)
  //     .select('id')
  //     .single()
  //   if (error) throw error

  console.log('[quote-requests] New quote request received:', {
    id: record.id,
    building_type: record.building_type,
    service_type: record.service_type,
    property_city: record.property_city,
    property_state: record.property_state,
    requestor_email: record.requestor_email,
    created_at: record.created_at,
  })

  // ── TODO: Lead routing logic ───────────────────────────────────────────────
  //
  // After insert, trigger the lead router:
  //   1. Query contractors WHERE:
  //      - building_types_served @> [record.building_type]
  //      - service areas overlap property_city/property_state
  //      - subscription_tier IN ('silver', 'gold') for preferred routing
  //      - commercial_verified = true (if timing is emergency_now)
  //   2. Score & rank by: slot_tier, avg_rating, avg_quote_turnaround_hours
  //   3. Assign top N=3 contractor IDs to record.assigned_contractor_ids
  //   4. Update record status to 'routing', then 'sent'

  // ── TODO: Nurture sequence trigger ────────────────────────────────────────
  //
  // After successful insert, enqueue a nurture email to the requestor:
  //   await emailQueue.add('quote-request-confirmation', {
  //     to: record.requestor_email,
  //     name: record.requestor_name,
  //     quote_request_id: record.id,
  //     service_type: record.service_type,
  //     city: record.property_city,
  //   })
  //
  // Follow-up sequence (via Resend / SendGrid / Loops):
  //   - T+0: Confirmation email with what to expect
  //   - T+4h: "X contractors have viewed your request" update
  //   - T+24h: If no quotes, widen search radius and re-route

  // ── TODO: Contractor notification ─────────────────────────────────────────
  //
  // For each assigned contractor, send a real-time notification:
  //   for (const contractorId of record.assigned_contractor_ids) {
  //     await notifyContractor(contractorId, {
  //       type: 'new_quote_request',
  //       quote_request_id: record.id,
  //       building_type: record.building_type,
  //       service_type: record.service_type,
  //       property_city: record.property_city,
  //       estimated_deal_value: record.estimated_deal_value,
  //     })
  //   }
  //
  // Notification channels by subscription tier:
  //   - free/bronze: email only
  //   - silver: email + SMS
  //   - gold: email + SMS + CRM webhook (dispatch_crm)

  return NextResponse.json(
    {
      success: true,
      quote_request_id: quoteRequestId,
      message: 'Quote request received. We are matching you with vetted contractors.',
    },
    { status: 201 }
  )
}

// ─── GET /api/quote-requests — health check / stub ────────────────────────────

export async function GET() {
  return NextResponse.json(
    { message: 'Quote requests endpoint. Use POST to submit a quote request.' },
    { status: 200 }
  )
}
