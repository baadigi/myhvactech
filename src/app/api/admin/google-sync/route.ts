import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

// All the fields we want from the Legacy Places API
const GOOGLE_FIELDS = [
  'rating',
  'user_ratings_total',
  'reviews',
  'url',
  'name',
  'formatted_phone_number',
  'international_phone_number',
  'website',
  'formatted_address',
  'address_components',
  'opening_hours',
  'photos',
  'business_status',
  'geometry',
  'types',
].join(',')

// editorial_summary is only in Places API (New) — not available in Legacy API
// We'll skip it and use the AI description generator instead

interface GoogleReview {
  author_name: string
  rating: number
  text: string
  time: number
  relative_time_description: string
  profile_photo_url?: string
}

interface GooglePhoto {
  photo_reference: string
  width: number
  height: number
  html_attributions: string[]
}

interface GoogleOpeningHours {
  open_now?: boolean
  periods?: {
    open: { day: number; time: string }
    close?: { day: number; time: string }
  }[]
  weekday_text?: string[]
}

interface GooglePlaceResult {
  rating?: number
  user_ratings_total?: number
  reviews?: GoogleReview[]
  url?: string
  name?: string
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string
  formatted_address?: string
  address_components?: {
    long_name: string
    short_name: string
    types: string[]
  }[]
  opening_hours?: GoogleOpeningHours
  photos?: GooglePhoto[]
  business_status?: string
  editorial_summary?: { overview?: string; language?: string }
  geometry?: {
    location: { lat: number; lng: number }
  }
  types?: string[]
}

// Convert Google opening_hours to our operating_hours format
// Our format: { "Monday": { "open": "08:00", "close": "17:00" }, ... }
function mapGoogleHoursToOperatingHours(
  openingHours: GoogleOpeningHours | undefined
): Record<string, { open: string; close: string }> | null {
  if (!openingHours?.periods) return null

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const result: Record<string, { open: string; close: string }> = {}

  for (const period of openingHours.periods) {
    const dayName = DAY_NAMES[period.open.day]
    if (!dayName) continue

    // Format time from "0800" to "08:00"
    const formatTime = (t: string) => {
      const padded = t.padStart(4, '0')
      return `${padded.slice(0, 2)}:${padded.slice(2)}`
    }

    result[dayName] = {
      open: formatTime(period.open.time),
      close: period.close ? formatTime(period.close.time) : '23:59',
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

// Sync a single contractor and return the update payload + response data
async function syncContractor(
  placeId: string,
  contractorId: string,
  apiKey: string,
  db: ReturnType<typeof createAdminClient>
) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${GOOGLE_FIELDS}&key=${apiKey}`

  const gRes = await fetch(url)
  const gData = await gRes.json()

  if (gData.status !== 'OK') {
    throw new Error(`Google API error: ${gData.status} - ${gData.error_message || 'Unknown error'}`)
  }

  const result: GooglePlaceResult = gData.result

  // Map reviews
  const googleReviews = (result.reviews || []).map((r) => ({
    author_name: r.author_name,
    rating: r.rating,
    text: r.text,
    time: r.time,
    relative_time_description: r.relative_time_description,
    profile_photo_url: r.profile_photo_url || null,
  }))

  // Map photos (store references — we'll build URLs on demand with the API key)
  const googlePhotos = (result.photos || []).slice(0, 10).map((p) => ({
    photo_reference: p.photo_reference,
    width: p.width,
    height: p.height,
    attributions: p.html_attributions || [],
  }))

  // Map opening hours
  const operatingHours = mapGoogleHoursToOperatingHours(result.opening_hours)

  // Store Google's raw hours data for reference
  const googleHoursRaw = result.opening_hours
    ? {
        open_now: result.opening_hours.open_now,
        weekday_text: result.opening_hours.weekday_text || [],
        periods: result.opening_hours.periods || [],
      }
    : null

  // Build the update payload — Google-specific columns
  const updateData: Record<string, unknown> = {
    google_place_id: placeId,
    google_rating: result.rating ?? null,
    google_review_count: result.user_ratings_total ?? 0,
    google_reviews: googleReviews,
    google_business_url: result.url ?? null,
    google_phone: result.formatted_phone_number ?? null,
    google_website: result.website ?? null,
    google_formatted_address: result.formatted_address ?? null,
    google_hours: googleHoursRaw,
    google_photos: googlePhotos,
    google_business_status: result.business_status ?? null,
    google_editorial_summary: result.editorial_summary?.overview ?? null,
    google_lat: result.geometry?.location?.lat ?? null,
    google_lng: result.geometry?.location?.lng ?? null,
    google_last_synced_at: new Date().toISOString(),
  }

  // Also auto-populate contractor core fields if they're empty
  // First, get current contractor data to check what's empty
  const { data: currentContractor } = await db
    .from('contractors')
    .select('phone, website, street_address, operating_hours, description')
    .eq('id', contractorId)
    .single()

  if (currentContractor) {
    // Only fill in if the contractor field is currently empty
    if (!currentContractor.phone && result.formatted_phone_number) {
      updateData.phone = result.formatted_phone_number
    }
    if (!currentContractor.website && result.website) {
      updateData.website = result.website
    }
    if (!currentContractor.street_address && result.formatted_address) {
      // Try to extract street address from formatted_address
      // Google format: "123 Main St, City, State ZIP, Country"
      const parts = result.formatted_address.split(',')
      if (parts.length >= 1) {
        updateData.street_address = parts[0].trim()
      }
    }
    if (!currentContractor.operating_hours && operatingHours) {
      updateData.operating_hours = operatingHours
    }
  }

  // Perform the update
  const { error } = await db
    .from('contractors')
    .update(updateData)
    .eq('id', contractorId)

  if (error) {
    throw new Error(error.message)
  }

  return {
    name: result.name,
    rating: result.rating,
    review_count: result.user_ratings_total,
    reviews_fetched: googleReviews.length,
    photos_fetched: googlePhotos.length,
    google_url: result.url,
    phone: result.formatted_phone_number,
    website: result.website,
    address: result.formatted_address,
    hours: result.opening_hours?.weekday_text ?? [],
    business_status: result.business_status,
    editorial_summary: result.editorial_summary?.overview ?? null,
    auto_populated: {
      phone: !currentContractor?.phone && !!result.formatted_phone_number,
      website: !currentContractor?.website && !!result.website,
      street_address: !currentContractor?.street_address && !!result.formatted_address,
      operating_hours: !currentContractor?.operating_hours && !!operatingHours,
    },
  }
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

    const data = await syncContractor(placeId, contractor_id, apiKey, db)

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Google sync error:', err)
    const message = err instanceof Error ? err.message : 'Failed to sync Google data'
    return NextResponse.json({ error: message }, { status: 500 })
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

  const results: { id: string; company_name: string; status: string; rating?: number; reviews?: number; photos?: number }[] = []

  for (const contractor of contractors) {
    try {
      const data = await syncContractor(contractor.google_place_id!, contractor.id, apiKey, db)

      results.push({
        id: contractor.id,
        company_name: contractor.company_name,
        status: 'synced',
        rating: data.rating,
        reviews: data.review_count,
        photos: data.photos_fetched,
      })

      // Small delay to be respectful of rate limits
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'fetch failed'
      results.push({ id: contractor.id, company_name: contractor.company_name, status: `error: ${message}` })
    }
  }

  const synced = results.filter((r) => r.status === 'synced').length
  return NextResponse.json({ success: true, synced, total: contractors.length, results })
}

// GET — Return a Google Places photo URL (proxy to avoid exposing API key)
// Query: ?photo_reference=xxx&maxwidth=400
export async function GET(request: Request) {
  const url = new URL(request.url)
  const photoRef = url.searchParams.get('photo_reference')
  const maxWidth = url.searchParams.get('maxwidth') || '800'

  if (!photoRef) {
    return NextResponse.json({ error: 'photo_reference is required' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${apiKey}`

  // Redirect to the actual photo (Google returns a 302 to the image)
  const gRes = await fetch(photoUrl, { redirect: 'follow' })

  if (!gRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 502 })
  }

  const contentType = gRes.headers.get('content-type') || 'image/jpeg'
  const buffer = await gRes.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
