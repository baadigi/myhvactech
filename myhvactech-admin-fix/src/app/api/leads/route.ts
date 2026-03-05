import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // TODO: Send auto-response email to user (via Resend)
    // TODO: Send lead notification to contractor (email + SMS for Silver/Gold)
    // TODO: Update contractor stats

    return NextResponse.json({ success: true, lead_id: lead.id }, { status: 201 })
  } catch (err) {
    console.error('Lead route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
