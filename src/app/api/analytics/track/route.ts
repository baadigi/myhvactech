import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { contractor_id, event_type, metadata } = body

    if (!contractor_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: contractor_id, event_type' },
        { status: 400 }
      )
    }

    const validEventTypes = [
      'profile_view',
      'phone_click',
      'website_click',
      'direction_request',
      'form_submit',
      'photo_view',
      'review_view',
    ]

    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const forwarded = request.headers.get('x-forwarded-for')
    const ip_address = forwarded ? forwarded.split(',')[0].trim() : null
    const user_agent = request.headers.get('user-agent')

    const supabase = await createClient()

    const { error } = await supabase.from('analytics_events').insert({
      contractor_id,
      event_type,
      metadata: metadata || {},
      ip_address,
      user_agent,
    })

    if (error) {
      console.error('Analytics insert error:', error)
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
    }

    // Increment profile_views counter for profile_view events
    if (event_type === 'profile_view') {
      await supabase.rpc('increment_profile_views', { contractor_id })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Analytics track error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
