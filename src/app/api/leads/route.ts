import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/email'

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
      building_type,
      property_sqft,
      num_units_rtus,
      budget_band,
      timing,
      quote_request_id,
    } = body

    if (!contractor_id || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: contractor_id, name, email' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const forwarded = request.headers.get('x-forwarded-for')
    const ip_address = forwarded ? forwarded.split(',')[0].trim() : null
    const user_agent = request.headers.get('user-agent')

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

    let contractorName = 'Unknown Contractor'
    const { data: contractor } = await supabase
      .from('contractors')
      .select('company_name')
      .eq('id', contractor_id)
      .single()
    if (contractor) contractorName = contractor.company_name

    const urgencyLabels: Record<string, string> = {
      emergency: '🚨 EMERGENCY',
      soon: '⚡ Soon (2-3 days)',
      routine: '✅ Routine',
    }
    const urgencyColors: Record<string, string> = {
      emergency: '#dc2626',
      soon: '#f59e0b',
      routine: '#22c55e',
    }
    const urg = urgency || 'routine'
    const urgencyLabel = urgencyLabels[urg] || urg
    const urgencyColor = urgencyColors[urg] || '#6b7280'

    await sendNotification({
      subject: `[My HVAC Tech] ${urgencyLabel} New Lead: ${name} → ${contractorName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #171717; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 700;">New Lead Received</h1>
            <p style="margin: 8px 0 0; color: #a3a3a3; font-size: 14px;">My HVAC Tech &middot; ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style="border: 1px solid #e5e5e5; border-top: none; padding: 24px 32px; border-radius: 0 0 12px 12px;">
            <div style="background: ${urgencyColor}15; border: 1px solid ${urgencyColor}40; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
              <span style="font-size: 14px; font-weight: 700; color: ${urgencyColor};">${urgencyLabel}</span>
              <span style="font-size: 13px; color: #737373; margin-left: 8px;">for ${contractorName}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #737373; width: 130px;">Contact</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #737373;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #0284c7;">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #737373;">Phone</td><td style="padding: 8px 0;">${phone || 'Not provided'}</td></tr>
              <tr><td style="padding: 8px 0; color: #737373;">Company</td><td style="padding: 8px 0;">${company_name || 'Not provided'}</td></tr>
              <tr><td style="padding: 8px 0; color: #737373;">Service Needed</td><td style="padding: 8px 0;">${service_needed || 'Not specified'}</td></tr>
              ${building_type ? `<tr><td style="padding: 8px 0; color: #737373;">Building Type</td><td style="padding: 8px 0;">${building_type}</td></tr>` : ''}
              ${budget_band ? `<tr><td style="padding: 8px 0; color: #737373;">Budget</td><td style="padding: 8px 0;">${budget_band}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #737373;">Preferred Contact</td><td style="padding: 8px 0;">${preferred_contact || 'either'}</td></tr>
              <tr><td style="padding: 8px 0; color: #737373;">Source</td><td style="padding: 8px 0;">${source}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
            <p style="font-size: 13px; color: #737373; margin-bottom: 4px;">Message:</p>
            <p style="font-size: 14px; color: #404040; line-height: 1.6; white-space: pre-wrap;">${message || 'No message'}</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
            <a href="https://myhvac.tech/admin/leads" style="display: inline-block; background: #171717; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">View in Admin Panel</a>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true, lead_id: lead.id }, { status: 201 })
  } catch (err) {
    console.error('Lead route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
