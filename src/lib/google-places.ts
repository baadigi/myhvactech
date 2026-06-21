import { createAdminClient } from '@/lib/supabase/admin'
import { TRADE_KEY } from '@/lib/trade-scope'

// Shared Google Places (Legacy) helpers used by:
//   - /api/admin/google-sync     (refresh contractors that already have a place_id)
//   - /api/admin/google-backfill (discover place_id for contractors missing one, then sync)

type AdminDb = ReturnType<typeof createAdminClient>

// All the fields we want from the Legacy Place Details API
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
  address_components?: { long_name: string; short_name: string; types: string[] }[]
  opening_hours?: GoogleOpeningHours
  photos?: GooglePhoto[]
  business_status?: string
  editorial_summary?: { overview?: string; language?: string }
  geometry?: { location: { lat: number; lng: number } }
  types?: string[]
}

// Convert Google opening_hours to our operating_hours format
// { "Monday": { "open": "08:00", "close": "17:00" }, ... }
function mapGoogleHoursToOperatingHours(
  openingHours: GoogleOpeningHours | undefined
): Record<string, { open: string; close: string }> | null {
  if (!openingHours?.periods) return null

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const result: Record<string, { open: string; close: string }> = {}

  for (const period of openingHours.periods) {
    const dayName = DAY_NAMES[period.open.day]
    if (!dayName) continue
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

/**
 * Find a Google Place ID for a business by name + location using the Find Place
 * from Text endpoint. Returns null if no confident match.
 *
 * Guard: only accepts a result whose formatted_address contains the expected
 * state token, so we don't attach a same-named business in the wrong location.
 */
export async function findPlaceId(
  companyName: string,
  city: string,
  stateAbbr: string,
  stateName: string,
  apiKey: string
): Promise<string | null> {
  const query = `${companyName} ${city} ${stateAbbr}`
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${encodeURIComponent(query)}` +
    `&inputtype=textquery&fields=place_id,formatted_address,name&key=${apiKey}`

  const res = await fetch(url)
  const data = await res.json()

  if (data.status === 'ZERO_RESULTS') return null
  if (data.status !== 'OK' || !data.candidates?.length) {
    throw new Error(`Find Place error: ${data.status} - ${data.error_message || 'no candidates'}`)
  }

  const candidate = data.candidates[0]
  const addr: string = (candidate.formatted_address || '').toLowerCase()
  const matchesLocation =
    addr.includes(stateAbbr.toLowerCase()) || addr.includes(stateName.toLowerCase())

  // Reject low-confidence cross-state matches to protect data integrity.
  if (!matchesLocation) return null

  return candidate.place_id ?? null
}

/**
 * Fetch full Place Details for a place_id and write Google fields onto the
 * contractor row. Also backfills empty core fields (phone/website/address/hours).
 */
export async function syncContractorGoogle(
  placeId: string,
  contractorId: string,
  apiKey: string,
  db: AdminDb
) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${GOOGLE_FIELDS}&key=${apiKey}`

  const gRes = await fetch(url)
  const gData = await gRes.json()

  if (gData.status !== 'OK') {
    throw new Error(`Google API error: ${gData.status} - ${gData.error_message || 'Unknown error'}`)
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

  const googlePhotos = (result.photos || []).slice(0, 10).map((p) => ({
    photo_reference: p.photo_reference,
    width: p.width,
    height: p.height,
    attributions: p.html_attributions || [],
  }))

  const operatingHours = mapGoogleHoursToOperatingHours(result.opening_hours)

  const googleHoursRaw = result.opening_hours
    ? {
        open_now: result.opening_hours.open_now,
        weekday_text: result.opening_hours.weekday_text || [],
        periods: result.opening_hours.periods || [],
      }
    : null

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

  // Auto-fill empty core fields from Google
  const { data: currentContractor } = await db
    .from('contractors')
    .select('phone, website, street_address, operating_hours, description')
    .eq('trade', TRADE_KEY)
    .eq('id', contractorId)
    .single()

  if (currentContractor) {
    if (!currentContractor.phone && result.formatted_phone_number) {
      updateData.phone = result.formatted_phone_number
    }
    if (!currentContractor.website && result.website) {
      updateData.website = result.website
    }
    if (!currentContractor.street_address && result.formatted_address) {
      const parts = result.formatted_address.split(',')
      if (parts.length >= 1) updateData.street_address = parts[0].trim()
    }
    if (
      (!currentContractor.operating_hours ||
        Object.keys(currentContractor.operating_hours).length === 0) &&
      operatingHours
    ) {
      updateData.operating_hours = operatingHours
    }
  }

  const { error } = await db.from('contractors').update(updateData).eq('id', contractorId)
  if (error) throw new Error(error.message)

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
  }
}
