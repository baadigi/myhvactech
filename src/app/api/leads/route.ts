import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NOTIFY_EMAIL = 'ryan@baadigi.com'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      contractor_id,
      name,
      email,
      phone,
      company_name,
      service_needed,
      message,
      urgency,
      preferred_contact,
      source = 'directory',
      landing_page,
      // Commercial-specific fields
      building_type,
      property_sqft,
      num_units_rtus,
      budget_band,
      timing,
      quote_request_id,
    } = body

    // Validate required fields
    if (!contractor_id || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: contractor_id, name, email' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get client IP from headers
    const forwarded = request.headers.get('x-forwarded-for')
    const ip_address = forwarded ? forwarded.split(',')[0].trim() : null
    const user_agent = request.headers.get('user-agent')

    // Insert lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        contractor_id,
        name,
        email,
        phone,
        company_name,
        service_needed,
        message,
        urgency,
        preferred_contact,
        source,
        landing_page,
        ip_address,
        user_agent,
        status: 'new',
        // Commercial-specific fields
        building_type: building_type ?? null,
        property_sqft: property_sqft ?? null,
        num_units_rtus: num_units_rtus ?? null,
        budget_band: budget_band ?? null,
        timing: timing ?? null,
        quote_request_id: quote_request_id ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Lead insert error:', error)
      return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 })
    }

    // Get contractor name for the email
    let contractorName = 'Unknown Contractor'
    const { data: contractor } = await supabase
      .from('contractors')
      .select('company_name')
      .eq('id', contractor_id)
      .single()
    if (contractor) contractorName = contractor.company_name

    // Send notification email to admin
    await sendLeadNotification({
      leadId: lead.id,
      contractorName,
      name,
      email,
      phone: phone || 'Not provided',
      companyName: company_name || 'Not provided',
      serviceNeeded: service_needed || 'Not specified',
      message: message || 'No message',
      urgency: urgency || 'routine',
      preferredContact: preferred_contact || 'either',
      buildingType: building_type || null,
      budgetBand: budget_band || null,
      source,
    })

    return NextResponse.json({ success: true, lead_id: lead.id }, { status: 201 })
  } catch (err) {
    console.error('Lead route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function sendLeadNotification(data: {
  leadId: string
  contractorName: string
  name: string
  email: string
  phone: string
  companyName: string
  serviceNeeded: string
  message: string
  urgency: string
  preferredContact: string
  buildingType: string | null
  budgetBand: string | null
  source: string
}) {
  const urgencyColors: Record<string, string> = {
    emergency: '#dc2626',
    soon: '#f59e0b',
    routine: '#22c55e',
  }
  const urgencyColor = urgencyColors[data.urgency] || '#6b7280'
  const urgencyLabel = data.urgency === 'emergency' ? '🚨 EMERGENCY' : data.urgency === 'soon' ? '⚡ Soon (2-3 days)' : '✅ Routine'

  console.log(`[LEAD NOTIFICATION] New lead from ${data.name} <${data.email}> for ${data.contractorName}`)
  console.log(`  Urgency: ${data.urgency} | Service: ${data.serviceNeeded} | Source: ${data.source}`)

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
          subject: `[My HVAC Tech] ${urgencyLabel} New Lead: ${data.name} → ${data.contractorName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #171717; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 700;">New Lead Received</h1>
                <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">My HVAC Tech &middot; ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
                <div style="background: ${urgencyColor}15; border: 1px solid ${urgencyColor}40; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
                  <span style="font-size: 14px; font-weight: 700; color: ${urgencyColor};">${urgencyLabel}</span>
                  <span style="font-size: 13px; color: #737373; margin-left: 8px;">for ${data.contractorName}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 8px 0; color: #737373; width: 130px;">Contact</td><td style="padding: 8px 0; font-weight: 600;">${data.name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #737373;">Email</td><td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #0284c7;">${data.email}</a></td></tr>
                  <tr><td style="padding: 8px 0; color: #737373;">Phone</td><td style="padding: 8px 0;">${data.phone}</td></tr>
                  <tr><td style="padding: 8px 0; color: #737373;">Company</td><td style="padding: 8px 0;">${data.companyName}</td></tr>
                  <tr><td style="padding: 8px 0; color: #737373;">Service Needed</td><td style="padding: 8px 0;">${data.serviceNeeded}</td></tr>
                  ${data.buildingType ? `<tr><td style="padding: 8px 0; color: #737373;">Building Type</td><td style="padding: 8px 0;">${data.buildingType}</td></tr>` : ''}
                  ${data.budgetBand ? `<tr><td style="padding: 8px 0; color: #737373;">Budget</td><td style="padding: 8px 0;">${data.budgetBand}</td></tr>` : ''}
                  <tr><td style="padding: 8px 0; color: #737373;">Preferred Contact</td><td style="padding: 8px 0;">${data.preferredContact}</td></tr>
                  <tr><td style="padding: 8px 0; color: #737373;">Source</td><td style="padding: 8px 0;">${data.source}</td></tr>
                </table>
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
                <p style="font-size: 13px; color: #737373; margin-bottom: 4px;">Message:</p>
                <p style="font-size: 14px; color: #404040; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
                <a href="https://myhvac.tech/admin/leads" style="display: inline-block; background: #171717; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">View in Admin Panel</a>
              </div>
            </div>
          `,
        }),
      }).catch(() => {})
    }
  } catch {
    // Silently fail — lead is stored in database
  }
}
