import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = parseInt(searchParams.get('radius') || '25')
  const service = searchParams.get('service')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = 20

  const supabase = await createClient()

  // Geo search
  if (lat && lng) {
    const { data, error } = await supabase.rpc('nearby_contractors', {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_miles: radius,
      service_filter: service || null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ results: data, total: data?.length || 0 })
  }

  // Full-text search
  if (q) {
    const { data, error } = await supabase.rpc('search_contractors', {
      search_term: q,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ results: data, total: data?.length || 0 })
  }

  return NextResponse.json({ error: 'Provide q (search term) or lat+lng (location)' }, { status: 400 })
}
