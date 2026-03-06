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

    // ── Deduplicate slugs within this batch ─────────────
    const slugCounts: Record<string, number> = {}
    for (const rec of records) {
      const base = rec.slug as string
      if (slugCounts[base] !== undefined) {
        slugCounts[base]++
        rec.slug = `${base}-${slugCounts[base]}`
      } else {
        slugCounts[base] = 0
      }
    }

    // ── Check for existing slugs in the database ────────
    const adminClient = createAdminClient()
    const allSlugs = records.map((r) => r.slug as string)

    // Query existing slugs in batches (avoid too-long IN queries)
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

    // Append numeric suffix for clashing slugs
    for (const rec of records) {
      let slug = rec.slug as string
      let counter = 1
      while (existingSlugs.has(slug)) {
        slug = `${rec.slug as string}-${counter}`
        counter++
      }
      existingSlugs.add(slug) // reserve it for subsequent rows
      rec.slug = slug
    }

    // ── Batch insert ────────────────────────────────────
    let imported = 0
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const { error, data } = await adminClient
        .from('contractors')
        .insert(batch)
        .select('id')

      if (error) {
        // Try row-by-row to pinpoint failures
        for (let j = 0; j < batch.length; j++) {
          const { error: rowErr } = await adminClient
            .from('contractors')
            .insert(batch[j])
            .select('id')

          if (rowErr) {
            // Find the original row index
            const originalIdx = i + j + 1 + errors.filter((e) => e.row <= i + j + 1).length
            errors.push({
              row: originalIdx,
              error: rowErr.message,
            })
          } else {
            imported++
          }
        }
      } else {
        imported += data?.length ?? batch.length
      }
    }

    return NextResponse.json({ imported, errors })
  } catch (err) {
    console.error('Import error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
