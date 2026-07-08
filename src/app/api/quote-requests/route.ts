import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { withTrade, TRADE_KEY } from '@/lib/trade-scope'
import { sendNotification } from '@/lib/email'
import { pushLeadToGHL } from '@/lib/ghl'

const titleCase = (t: string) => t.replace(/\b\w/g, (c) => c.toUpperCase())

// Contractor-facing emails interpolate buyer-typed text — escape it.
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

// Scope Agent leads carry the AI-intake session in `scope_agent`; they reuse
// this pipeline and additionally persist a scope_requests row + notify the
// shortlisted contractors that have an email on file.
interface ScopeAgentPayload {
  scope_summary: string | null
  transcript: { role: string; content: string }[]
  shortlist: { id: string; company_name: string }[]
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteRequestPayload {
  building_type: string | null
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
  scope_agent?: ScopeAgentPayload
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
  const isScopeAgent = body.source === 'scope_agent'

  // Scope Agent chats may end without a building type — optional there.
  if (!isScopeAgent) {
    if (!body.building_type || typeof body.building_type !== 'string') {
      validationErrors.push('building_type is required')
    } else if (!(VALID_BUILDING_TYPES as readonly string[]).includes(body.building_type)) {
      validationErrors.push(`building_type must be one of: ${VALID_BUILDING_TYPES.join(', ')}`)
    }
  } else if (body.building_type && !(VALID_BUILDING_TYPES as readonly string[]).includes(body.building_type)) {
    body.building_type = null // agent guessed outside the taxonomy — drop, don't reject the lead
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
    building_type: body.building_type ?? null,
    property_sqft: body.property_sqft ?? null,
    num_buildings: body.num_buildings ?? 1,
    num_units_rtus: body.num_units_rtus ?? null,
    system_types: Array.isArray(body.system_types) ? body.system_types : [],
    current_issues: body.current_issues ?? (isScopeAgent ? body.scope_agent?.scope_summary ?? null : null),
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

  // Service role: anon has INSERT but no SELECT on quote_requests, so
  // .insert().select() was rejected by RLS and the whole insert rolled back.
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: inserted, error: dbError } = await admin
    .from('quote_requests')
    .insert(withTrade(record))
    .select('id')
    .single()

  if (dbError) {
    console.error('Quote request insert error:', dbError)
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

  await sendNotification({
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
  })

  await pushLeadToGHL({
    name: record.requestor_name,
    email: record.requestor_email,
    phone: record.requestor_phone,
    companyName: record.company_name,
    city: record.property_city,
    state: record.property_state,
    source: `myhvac.tech quote request (${record.service_type})`,
    tags: ['directory-lead'],
    note: [
      `🧾 Quote request`,
      `Service: ${record.service_type}`,
      `Building: ${record.building_type}`,
      record.property_sqft ? `Sq ft: ${record.property_sqft}` : null,
      record.num_buildings ? `Buildings: ${record.num_buildings}` : null,
      record.num_units_rtus ? `Units/RTUs: ${record.num_units_rtus}` : null,
      record.system_types?.length ? `Systems: ${record.system_types.join(', ')}` : null,
      record.timing ? `Timing: ${record.timing}` : null,
      record.budget_band ? `Budget: ${record.budget_band}` : null,
      (record.property_city || record.property_state) ? `Location: ${record.property_city || ''} ${record.property_state || ''} ${record.property_zip || ''}`.trim() : null,
      record.current_issues ? `\nIssues: ${record.current_issues}` : null,
    ].filter(Boolean).join('\n'),
  })

  if (isScopeAgent) {
    await handleScopeAgentExtras(supabase, body, record, inserted?.id ?? null)
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

// ─── Scope Agent extras ───────────────────────────────────────────────────────

async function handleScopeAgentExtras(
  supabase: Awaited<ReturnType<typeof createClient>>,
  body: QuoteRequestPayload,
  record: { requestor_name: string; requestor_email: string; requestor_phone: string | null; service_type: string; property_city: string | null; property_state: string | null },
  quoteRequestId: string | null
) {
  const sa = body.scope_agent
  const shortlistIds = (sa?.shortlist ?? []).map((c) => c.id).filter(Boolean).slice(0, 10)

  // 1) Persist the full intake session (fire-and-forget — never fail the lead)
  const { error } = await supabase.from('scope_requests').insert(
    withTrade({
      transcript: Array.isArray(sa?.transcript) ? sa!.transcript.slice(0, 60) : [],
      scope_summary: sa?.scope_summary ?? null,
      shortlist: sa?.shortlist ?? [],
      service_type: record.service_type,
      city: record.property_city,
      state: record.property_state,
      contact_name: record.requestor_name,
      contact_email: record.requestor_email,
      contact_phone: record.requestor_phone,
      quote_request_id: quoteRequestId,
      status: 'new',
    })
  )
  if (error) console.error('scope_requests insert error:', error)

  if (!shortlistIds.length || !sa?.scope_summary) return

  // 2) Notify shortlisted contractors — only those with an email on file.
  //    Emails looked up server-side, trade-scoped — never trusted from client.
  const { data: contractors } = await supabase
    .from('contractors')
    .select('id, company_name, email')
    .in('id', shortlistIds)
    .eq('trade', TRADE_KEY)

  const withEmail = (contractors ?? []).filter((c) => c.email)
  for (const c of withEmail) {
    await sendNotification({
      to: c.email as string,
      subject: `[My HVAC Tech] New job lead: ${titleCase(record.service_type)} in ${record.property_city || record.property_state || 'your area'}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #171717; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">You've been matched with a new job</h1>
            <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">My HVAC Tech</p>
          </div>
          <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 14px; color: #404040;">Hi ${c.company_name},</p>
            <p style="font-size: 14px; color: #404040;">A property contact just described this job on My HVAC Tech and you made their shortlist:</p>
            <p style="font-size: 14px; color: #171717; background: #f5f5f5; padding: 12px 16px; border-radius: 8px; line-height: 1.6;">${esc(sa.scope_summary)}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 6px 0; color: #737373; width: 110px;">Service</td><td style="padding: 6px 0; font-weight: 600;">${titleCase(record.service_type)}</td></tr>
              <tr><td style="padding: 6px 0; color: #737373;">Location</td><td style="padding: 6px 0;">${esc([record.property_city, record.property_state].filter(Boolean).join(', ')) || 'Not provided'}</td></tr>
              <tr><td style="padding: 6px 0; color: #737373;">Contact</td><td style="padding: 6px 0;">${esc(record.requestor_name)} &middot; <a href="mailto:${esc(record.requestor_email)}" style="color: #0284c7;">${esc(record.requestor_email)}</a>${record.requestor_phone ? ` &middot; ${esc(record.requestor_phone)}` : ''}</td></tr>
            </table>
          </div>
        </div>
      `,
    })
  }
}
