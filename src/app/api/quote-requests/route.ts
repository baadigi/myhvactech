import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NOTIFY_EMAIL = 'ryan@baadigi.com'

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

  const now = new Date().toISOString()

  const record = {
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
    status: 'new',
    source: body.source ?? 'website',
  }

  // ── Persist to Supabase ─────────────────────────────────────────────────

  const supabase = await createClient()
  const { data: inserted, error: dbError } = await supabase
    .from('quote_requests')
    .insert(record)
    .select('id')
    .single()

  if (dbError) {
    console.error('Quote request insert error:', dbError)
    // Don't fail — still send notification
  }

  const quoteId = inserted?.id || `qr_${Date.now()}`

  // ── Send notification email ─────────────────────────────────────────────

  const timingLabels: Record<string, string> = {
    emergency_now: '🚨 Emergency — Right Now',
    this_week: '⚡ This Week',
    this_month: '📅 This Month',
    this_quarter: '📋 This Quarter',
    planning_ahead: '🔮 Planning Ahead',
  }

  console.log(`[QUOTE REQUEST] New quote from ${record.requestor_name} <${record.requestor_email}>`)
  console.log(`  Building: ${record.building_type} | Service: ${record.service_type} | Location: ${record.property_city}, ${record.property_state}`)

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          to: NOTIFY_EMAIL,
          subject: `[My HVAC Tech] New Quote Request: ${record.building_type} ${record.service_type} in ${record.property_city || 'Unknown'}, ${record.property_state || ''}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #171717; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 700;">New Quote Request</h1>
                <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">My HVAC Tech &middot; ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 8px 0; color: #737373; width: 130px;">Contact</td><td style="padding: 8px 0; font-weight: 600;">${record.requestor_name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #737373;">Email</td><td style="padding: 8px 0;"><a href="mailto:${record.requestor_email}" style="color: #0284c7;">${record.requestor_email}</a></td></tr>
                  ${record.requestor_phone ? `<tr><td style="padding: 8px 0; color: #737373;">Phone</td><td style="padding: 8px 0;">${record.requestor_phone}</td></tr>` : ''}
                  ${record.company_name ? `<tr><td style="padding: 8px 0; color: #737373;">Company</td><td style="padding: 8px 0;">${record.company_name}</td></tr>` : ''}
                  ${record.requestor_title ? `<tr><td style="padding: 8px 0; color: #737373;">Title</td><td style="padding: 8px 0;">${record.requestor_title}</td></tr>` : ''}
                </table>
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
                <h3 style="font-size: 14px; font-weight: 700; color: #171717; margin: 0 0 12px;">Project Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 8px 0; color: #737373; width: 130px;">Building Type</td><td style="padding: 8px 0; font-weight: 600;">${record.building_type}</td></tr>
                  <tr><td style="padding: 8px 0; color: #737373;">Service Type</td><td style="padding: 8px 0;">${record.service_type}</td></tr>
                  <tr><td style="padding: 8px 0; color: #737373;">Systems</td><td style="padding: 8px 0;">${record.system_types.join(', ') || 'Not specified'}</td></tr>
                  ${record.property_sqft ? `<tr><td style="padding: 8px 0; color: #737373;">Sq Ft</td><td style="padding: 8px 0;">${Number(record.property_sqft).toLocaleString()}</td></tr>` : ''}
                  ${record.num_units_rtus ? `<tr><td style="padding: 8px 0; color: #737373;">Units/RTUs</td><td style="padding: 8px 0;">${record.num_units_rtus}</td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #737373;">Location</td><td style="padding: 8px 0;">${[record.property_city, record.property_state, record.property_zip].filter(Boolean).join(', ') || 'Not provided'}</td></tr>
                  ${record.budget_band ? `<tr><td style="padding: 8px 0; color: #737373;">Budget</td><td style="padding: 8px 0;">${record.budget_band}</td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #737373;">Timing</td><td style="padding: 8px 0;">${timingLabels[record.timing || ''] || record.timing || 'Not specified'}</td></tr>
                </table>
                ${record.current_issues ? `<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" /><p style="font-size: 13px; color: #737373; margin-bottom: 4px;">Issues Described:</p><p style="font-size: 14px; color: #404040; line-height: 1.6; white-space: pre-wrap;">${record.current_issues}</p>` : ''}
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
                <a href="https://myhvac.tech/admin/leads" style="display: inline-block; background: #171717; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">View in Admin Panel</a>
              </div>
            </div>
          `,
        }),
      }).catch(() => {})
    }
  } catch {
    // Silently fail
  }

  return NextResponse.json(
    {
      success: true,
      quote_request_id: quoteId,
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
