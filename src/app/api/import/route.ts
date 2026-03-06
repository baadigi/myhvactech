import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'ryan@baadigi.com'
const BATCH_SIZE = 50

// Fields that store arrays in the database — CSV values are comma-separated strings
const ARRAY_FIELDS = ['system_types', 'building_types_served', 'brands_serviced']

// Numeric fields
const INT_FIELDS = [
  'year_established',
  'num_technicians',
  'num_nate_certified',
  'emergency_response_minutes',
  'years_commercial_experience',
  'service_radius_miles',
]
const FLOAT_FIELDS = ['tonnage_range_min', 'tonnage_range_max']

// Boolean fields
const BOOL_FIELDS = [
  'offers_24_7',
  'multi_site_coverage',
  'offers_service_agreements',
  'is_verified',
  'commercial_verified',
]

// All accepted contractor columns (beyond the required ones)
const ACCEPTED_FIELDS = new Set([
  'company_name',
  'city',
  'state',
  'phone',
  'email',
  'website',
  'street_address',
  'zip_code',
  'description',
  'short_description',
  'license_number',
  'metro_area',
  'google_place_id',
  ...ARRAY_FIELDS,
  ...INT_FIELDS,
  ...FLOAT_FIELDS,
  ...BOOL_FIELDS,
])

function generateSlug(companyName: string, city: string): string {
  return `${companyName}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseBool(val: string | undefined | null): boolean {
  if (!val) return false
  const lower = val.toString().trim().toLowerCase()
  return ['true', '1', 'yes', 'y'].includes(lower)
}

function parseContractor(raw: Record<string, string>, index: number) {
  const companyName = raw.company_name?.trim()
  const city = raw.city?.trim()
  const state = raw.state?.trim()

  if (!companyName || !city || !state) {
    return {
      error: `Row ${index + 1}: Missing required field(s) — company_name, city, or state`,
    }
  }

  const record: Record<string, unknown> = {
    company_name: companyName,
    city,
    state,
    slug: generateSlug(companyName, city),
    country: 'US',
    subscription_tier: 'free',
    avg_rating: 0,
    review_count: 0,
    profile_views: 0,
    is_verified: false,
    commercial_verified: false,
  }

  // Map remaining accepted fields
  for (const key of Object.keys(raw)) {
    if (['company_name', 'city', 'state'].includes(key)) continue
    if (!ACCEPTED_FIELDS.has(key)) continue

    const val = raw[key]?.trim()
    if (!val) continue

    if (ARRAY_FIELDS.includes(key)) {
      record[key] = val.split(',').map((s: string) => s.trim()).filter(Boolean)
    } else if (INT_FIELDS.includes(key)) {
      const n = parseInt(val, 10)
      if (!isNaN(n)) record[key] = n
    } else if (FLOAT_FIELDS.includes(key)) {
      const n = parseFloat(val)
      if (!isNaN(n)) record[key] = n
    } else if (BOOL_FIELDS.includes(key)) {
      record[key] = parseBool(val)
    } else {
      record[key] = val
    }
  }

  return { record }
}

export async function POST(request: Request) {
  try {
    // ── Auth check ──────────────────────────────────────
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Parse body ──────────────────────────────────────
    const body = await request.json()
    const rows: Record<string, string>[] = body.rows

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Request body must contain a non-empty "rows" array' },
        { status: 400 }
      )
    }

    // ── Transform rows ──────────────────────────────────
    const records: Record<string, unknown>[] = []
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const result = parseContractor(rows[i], i)
      if ('error' in result) {
        errors.push({ row: i + 1, error: result.error as string })
      } else {
        records.push(result.record!)
      }
    }

    // ── Duplicate detection ────────────────────────────
    const adminClient = createAdminClient()
    let skipped = 0

    // Normalize phone: strip everything except digits
    const normPhone = (p: string) => p.replace(/\D/g, '').slice(-10) // last 10 digits

    // 1. Check google_place_id duplicates
    const placeIds = records
      .map((r) => r.google_place_id as string)
      .filter(Boolean)

    const existingPlaceIds = new Set<string>()
    for (let i = 0; i < placeIds.length; i += BATCH_SIZE) {
      const batch = placeIds.slice(i, i + BATCH_SIZE)
      const { data } = await adminClient
        .from('contractors')
        .select('google_place_id')
        .in('google_place_id', batch)
      if (data) {
        for (const row of data) {
          const pid = (row as { google_place_id: string }).google_place_id
          if (pid) existingPlaceIds.add(pid)
        }
      }
    }

    // 2. Check phone duplicates
    const phones = records
      .map((r) => (r.phone ? normPhone(r.phone as string) : ''))
      .filter((p) => p.length >= 10)
    const uniquePhones = [...new Set(phones)]

    const existingPhones = new Set<string>()
    for (let i = 0; i < uniquePhones.length; i += BATCH_SIZE) {
      const batch = uniquePhones.slice(i, i + BATCH_SIZE)
      const { data } = await adminClient
        .from('contractors')
        .select('phone')
        .not('phone', 'is', null)
      if (data) {
        for (const row of data) {
          const ph = (row as { phone: string }).phone
          if (ph) existingPhones.add(normPhone(ph))
        }
        break // we fetched all phones in one query
      }
    }

    // 3. Check company_name + city + state duplicates (fallback)
    const uniqueNames = [
      ...new Set(
        records
          .filter((r) => !r.google_place_id && !(r.phone && normPhone(r.phone as string).length >= 10))
          .map((r) => r.company_name as string)
      ),
    ]

    const existingNameCity = new Set<string>()
    for (let i = 0; i < uniqueNames.length; i += BATCH_SIZE) {
      const batch = uniqueNames.slice(i, i + BATCH_SIZE)
      const { data } = await adminClient
        .from('contractors')
        .select('company_name, city, state')
        .in('company_name', batch)
      if (data) {
        for (const row of data) {
          const r = row as { company_name: string; city: string; state: string }
          existingNameCity.add(
            `${r.company_name.toLowerCase()}|${r.city.toLowerCase()}|${r.state.toLowerCase()}`
          )
        }
      }
    }

    // 4. Filter out duplicates (priority: place_id > phone > name+city+state)
    const seenPlaceIds = new Set<string>()
    const seenPhones = new Set<string>()
    const seenNameCity = new Set<string>()
    const fresh: Record<string, unknown>[] = []

    for (const rec of records) {
      const pid = rec.google_place_id as string | undefined
      const phone = rec.phone ? normPhone(rec.phone as string) : ''

      // Check place ID first
      if (pid) {
        if (existingPlaceIds.has(pid) || seenPlaceIds.has(pid)) {
          skipped++
          continue
        }
        seenPlaceIds.add(pid)
      }

      // Check phone
      if (phone.length >= 10) {
        if (existingPhones.has(phone) || seenPhones.has(phone)) {
          if (!pid) {
            // Only skip if place_id didn't already pass
            skipped++
            continue
          }
        }
        seenPhones.add(phone)
      }

      // Check name + city + state (only if no place_id and no phone)
      if (!pid && phone.length < 10) {
        const key = `${(rec.company_name as string).toLowerCase()}|${(rec.city as string).toLowerCase()}|${(rec.state as string).toLowerCase()}`
        if (existingNameCity.has(key) || seenNameCity.has(key)) {
          skipped++
          continue
        }
        seenNameCity.add(key)
      }

      fresh.push(rec)
    }

    // ── Deduplicate slugs within this batch ─────────────
    const slugCounts: Record<string, number> = {}
    for (const rec of fresh) {
      const base = rec.slug as string
      if (slugCounts[base] !== undefined) {
        slugCounts[base]++
        rec.slug = `${base}-${slugCounts[base]}`
      } else {
        slugCounts[base] = 0
      }
    }

    const allSlugs = fresh.map((r) => r.slug as string)
    const existingSlugs = new Set<string>()
    for (let i = 0; i < allSlugs.length; i += BATCH_SIZE) {
      const batch = allSlugs.slice(i, i + BATCH_SIZE)
      const { data } = await adminClient
        .from('contractors')
        .select('slug')
        .in('slug', batch)
      if (data) {
        for (const row of data) {
          existingSlugs.add((row as { slug: string }).slug)
        }
      }
    }

    for (const rec of fresh) {
      let slug = rec.slug as string
      let counter = 1
      while (existingSlugs.has(slug)) {
        slug = `${rec.slug as string}-${counter}`
        counter++
      }
      existingSlugs.add(slug)
      rec.slug = slug
    }

    // ── Batch insert ────────────────────────────────────
    let imported = 0

    if (fresh.length === 0) {
      return NextResponse.json({ imported: 0, skipped, errors })
    }

    for (let i = 0; i < fresh.length; i += BATCH_SIZE) {
      const batch = fresh.slice(i, i + BATCH_SIZE)
      const { error, data } = await adminClient
        .from('contractors')
        .insert(batch)
        .select('id')

      if (error) {
        for (let j = 0; j < batch.length; j++) {
          const { error: rowErr } = await adminClient
            .from('contractors')
            .insert(batch[j])
            .select('id')

          if (rowErr) {
            const originalIdx = i + j + 1 + errors.filter((e) => e.row <= i + j + 1).length
            errors.push({ row: originalIdx, error: rowErr.message })
          } else {
            imported++
          }
        }
      } else {
        imported += data?.length ?? batch.length
      }
    }

    return NextResponse.json({ imported, skipped, errors })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
