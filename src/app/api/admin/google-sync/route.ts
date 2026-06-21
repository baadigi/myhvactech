import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncContractorGoogle } from '@/lib/google-places'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
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

    const data = await syncContractorGoogle(placeId, contractor_id, apiKey, db)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Google sync error:', err)
    const message = err instanceof Error ? err.message : 'Failed to sync Google data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH — Batch sync all contractors that already have a google_place_id
export const maxDuration = 300

export async function PATCH() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  const db = createAdminClient()

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
      const data = await syncContractorGoogle(contractor.google_place_id!, contractor.id, apiKey, db)
      results.push({
        id: contractor.id,
        company_name: contractor.company_name,
        status: 'synced',
        rating: data.rating,
        reviews: data.review_count,
      })
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
