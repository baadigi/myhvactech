import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

interface GooglePlaceResult {
  rating?: number
  user_ratings_total?: number
  reviews?: {
    author_name: string
    rating: number
    text: string
    time: number
    relative_time_description: string
    profile_photo_url?: string
  }[]
  url?: string // Google Maps URL
  name?: string
}

// POST — Sync a single contractor's Google data by place_id
// Body: { contractor_id: string, place_id?: string }
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_PLACES_API_KEY not configured. Add it in Vercel env vars.' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { contractor_id, place_id } = body

    if (!contractor_id) {
      return NextResponse.json({ error: 'contractor_id is required' }, { status: 400 })
    }

    const db = createAdminClient()

    // Get contractor's place_id if not provided
    let placeId = place_id
    if (!placeId) {
      const { data: contractor } = await db
        .from('contractors')
        .select('google_place_id')
        .eq('id', contractor_id)
        .single()
      placeId = contractor?.google_place_id
    }

    if (!placeId) {
      return NextResponse.json(
        { error: 'No Google Place ID set for this contractor. Add one first.' },
        { status: 400 }
      )
    }

    // Fetch from Google Places API
    const fields = 'rating,user_ratings_total,reviews,url,name'
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`

    const gRes = await fetch(url)
    const gData = await gRes.json()

    if (gData.status !== 'OK') {
      return NextResponse.json(
        { error: `Google API error: ${gData.status} - ${gData.error_message || 'Unknown error'}` },
        { status: 502 }
      )
    }

    const result: GooglePlaceResult = gData.result

    // Map reviews to our format
    const googleReviews = (result.reviews || []).map((r) => ({
      author_name: r.author_name,
      rating: r.rating,
      text: r.text,
      time: r.time,
      relative_time_description: r.relative_time_description,
      profile_photo_url: r.profile_photo_url || null,
    }))

    // Update contractor record
    const updateData = {
      google_place_id: placeId,
      google_rating: result.rating || null,
      google_review_count: result.user_ratings_total || 0,
      google_reviews: googleReviews,
      google_business_url: result.url || null,
      google_last_synced_at: new Date().toISOString(),
    }

    const { error } = await db
      .from('contractors')
      .update(updateData)
      .eq('id', contractor_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        name: result.name,
        rating: result.rating,
        review_count: result.user_ratings_total,
        reviews_fetched: googleReviews.length,
        google_url: result.url,
      },
    })
  } catch (err) {
    console.error('Google sync error:', err)
    return NextResponse.json({ error: 'Failed to sync Google data' }, { status: 500 })
  }
}

// PATCH — Batch sync all contractors that have a google_place_id
export async function PATCH() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_PLACES_API_KEY not configured' },
      { status: 500 }
    )
  }

  const db = createAdminClient()

  // Get all contractors with a place_id
  const { data: contractors, error } = await db
    .from('contractors')
    .select('id, company_name, google_place_id')
    .not('google_place_id', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!contractors || contractors.length === 0) {
    return NextResponse.json({ message: 'No contractors with Google Place IDs found', synced: 0 })
  }

  const results: { id: string; company_name: string; status: string; rating?: number; reviews?: number }[] = []

  for (const contractor of contractors) {
    try {
      const fields = 'rating,user_ratings_total,reviews,url'
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${contractor.google_place_id}&fields=${fields}&key=${apiKey}`

      const gRes = await fetch(url)
      const gData = await gRes.json()

      if (gData.status !== 'OK') {
        results.push({ id: contractor.id, company_name: contractor.company_name, status: `error: ${gData.status}` })
        continue
      }

      const result: GooglePlaceResult = gData.result
      const googleReviews = (result.reviews || []).map((r) => ({
        author_name: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.time,
        relative_time_description: r.relative_time_description,
        profile_photo_url: r.profile_photo_url || null,
      }))

      await db.from('contractors').update({
        google_rating: result.rating || null,
        google_review_count: result.user_ratings_total || 0,
        google_reviews: googleReviews,
        google_business_url: result.url || null,
        google_last_synced_at: new Date().toISOString(),
      }).eq('id', contractor.id)

      results.push({
        id: contractor.id,
        company_name: contractor.company_name,
        status: 'synced',
        rating: result.rating,
        reviews: result.user_ratings_total,
      })

      // Small delay to be respectful of rate limits
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch {
      results.push({ id: contractor.id, company_name: contractor.company_name, status: 'error: fetch failed' })
    }
  }

  const synced = results.filter((r) => r.status === 'synced').length
  return NextResponse.json({ success: true, synced, total: contractors.length, results })
}
