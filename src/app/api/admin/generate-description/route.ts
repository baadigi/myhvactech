import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

// System type display names
const SYSTEM_LABELS: Record<string, string> = {
  rtu: 'Rooftop Units (RTUs)',
  split_system: 'Split Systems',
  chilled_water: 'Chilled Water / Chiller Systems',
  vrf: 'VRF/VRV Systems',
  boiler: 'Boiler Systems',
  ahu: 'Air Handling Units',
  ptac: 'PTAC Units',
  heat_pump: 'Heat Pumps',
  geothermal: 'Geothermal Systems',
  ductless_mini_split: 'Ductless Mini-Splits',
}

// Building type display names
const BUILDING_LABELS: Record<string, string> = {
  office: 'Office Buildings',
  retail: 'Retail Spaces',
  industrial: 'Industrial / Warehouse',
  healthcare: 'Healthcare Facilities',
  education: 'Educational Institutions',
  hospitality: 'Hotels & Hospitality',
  data_center: 'Data Centers',
  multi_family: 'Multi-Family Residential',
  government: 'Government Buildings',
  restaurant: 'Restaurants & Food Service',
  mixed_use: 'Mixed-Use Properties',
}

interface ContractorRow {
  company_name: string
  city: string
  state: string
  year_established: number | null
  system_types: string[]
  building_types_served: string[]
  brands_serviced: string[]
  emergency_response_minutes: number | null
  offers_24_7: boolean
  multi_site_coverage: boolean
  max_sites_supported: number | null
  num_technicians: number | null
  num_nate_certified: number | null
  years_commercial_experience: number | null
  offers_service_agreements: boolean
  service_agreement_types: string[]
  sla_summary: string | null
  google_rating: number | null
  google_review_count: number | null
  google_editorial_summary: string | null
  google_formatted_address: string | null
  google_phone: string | null
  google_website: string | null
  tonnage_range_min: number | null
  tonnage_range_max: number | null
  service_radius_miles: number
  license_number: string | null
  insurance_verified: boolean
  uses_gps_tracking: boolean
  dispatch_crm: string | null
  description: string | null
}

function buildFactSheet(c: ContractorRow): string {
  const facts: string[] = []

  facts.push(`Company: ${c.company_name}`)
  facts.push(`Location: ${c.google_formatted_address || `${c.city}, ${c.state}`}`)
  if (c.year_established) facts.push(`Established: ${c.year_established}`)
  if (c.years_commercial_experience) facts.push(`Commercial experience: ${c.years_commercial_experience} years`)
  if (c.service_radius_miles) facts.push(`Service radius: ${c.service_radius_miles} miles`)

  if (c.google_rating && c.google_review_count) {
    facts.push(`Google rating: ${c.google_rating}/5 (${c.google_review_count} reviews)`)
  }
  if (c.google_editorial_summary) {
    facts.push(`Google description: ${c.google_editorial_summary}`)
  }

  if (c.system_types.length > 0) {
    const labels = c.system_types.map((st) => SYSTEM_LABELS[st] || st)
    facts.push(`Systems serviced: ${labels.join(', ')}`)
  }
  if (c.tonnage_range_min != null && c.tonnage_range_max != null) {
    facts.push(`Tonnage range: ${c.tonnage_range_min}–${c.tonnage_range_max} tons`)
  }
  if (c.building_types_served.length > 0) {
    const labels = c.building_types_served.map((bt) => BUILDING_LABELS[bt] || bt)
    facts.push(`Building types: ${labels.join(', ')}`)
  }
  if (c.brands_serviced.length > 0) {
    facts.push(`Brands: ${c.brands_serviced.join(', ')}`)
  }
  if (c.num_technicians) {
    facts.push(`Technicians: ${c.num_technicians}${c.num_nate_certified ? ` (${c.num_nate_certified} NATE-certified)` : ''}`)
  }
  if (c.offers_24_7) facts.push('Offers 24/7 availability')
  if (c.emergency_response_minutes) facts.push(`Emergency response: ${c.emergency_response_minutes} minutes`)
  if (c.multi_site_coverage) {
    facts.push(`Multi-site coverage${c.max_sites_supported ? `: up to ${c.max_sites_supported} locations` : ''}`)
  }
  if (c.offers_service_agreements && c.service_agreement_types.length > 0) {
    facts.push(`Service agreements: ${c.service_agreement_types.join(', ')}`)
  }
  if (c.sla_summary) facts.push(`SLA: ${c.sla_summary}`)
  if (c.license_number) facts.push(`License: ${c.license_number}`)
  if (c.insurance_verified) facts.push('Insurance verified')
  if (c.uses_gps_tracking) facts.push('GPS-tracked dispatch fleet')
  if (c.dispatch_crm) facts.push(`Dispatch platform: ${c.dispatch_crm}`)

  return facts.join('\n')
}

async function generateWithClaude(factSheet: string, companyName: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const systemPrompt = `You are an expert commercial HVAC copywriter. You write unique, SEO-optimized business descriptions for commercial HVAC contractors listed on MyHVAC.tech — a directory built for property managers and facility managers (NOT homeowners).

Your writing must:
- Sound completely human — varied sentence lengths, natural flow, no AI patterns
- Be written from a third-person perspective about the company
- Target facility managers and property managers as the audience
- Naturally weave in relevant keywords (commercial HVAC, the city/state, system types, building types) without keyword stuffing
- Emphasize E-E-A-T signals: real experience, specific capabilities, verifiable facts
- Differentiate from residential-focused directories like Angi or HomeAdvisor by highlighting commercial proof points: tonnage handled, building types served, multi-site coverage, SLAs, emergency response
- Be 150–250 words — concise but substantive
- NEVER use generic filler like "look no further", "your one-stop shop", "committed to excellence", "dedicated team of professionals", "state-of-the-art", or similar clichés
- NEVER start with "Looking for" or "When it comes to"
- Every sentence must convey specific, useful information
- Write each description so it would be unique even among other HVAC contractors — use the specific facts provided`

  const userPrompt = `Write a unique business description for this commercial HVAC contractor. Use ONLY the facts provided — do not invent capabilities or statistics.

CONTRACTOR FACTS:
${factSheet}

Write the description now. Output ONLY the description text, no headers or labels.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(`Claude API error: ${response.status} — ${JSON.stringify(errData)}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text?.trim()

  if (!text) {
    throw new Error('Claude returned empty response')
  }

  return text
}

// Fallback template-based generation (no AI API needed)
function generateFallback(c: ContractorRow): string {
  const parts: string[] = []

  const exp = c.years_commercial_experience
    ? `With ${c.years_commercial_experience} years of commercial HVAC experience, `
    : c.year_established
      ? `Established in ${c.year_established}, `
      : ''

  parts.push(
    `${exp}${c.company_name} is a commercial HVAC contractor serving ${c.city}, ${c.state} and the surrounding area${c.service_radius_miles ? ` within a ${c.service_radius_miles}-mile radius` : ''}.`
  )

  if (c.google_rating && c.google_review_count) {
    parts.push(`Rated ${c.google_rating}/5 on Google with ${c.google_review_count} reviews.`)
  }

  if (c.system_types.length > 0) {
    const labels = c.system_types.map((st) => SYSTEM_LABELS[st] || st).join(', ')
    parts.push(`Specializes in ${labels}.`)
  }

  if (c.building_types_served.length > 0) {
    const labels = c.building_types_served.map((bt) => BUILDING_LABELS[bt] || bt).join(', ')
    parts.push(`Serves ${labels}.`)
  }

  if (c.offers_24_7 || c.emergency_response_minutes) {
    const avail: string[] = []
    if (c.offers_24_7) avail.push('24/7 availability')
    if (c.emergency_response_minutes) avail.push(`${c.emergency_response_minutes}-minute emergency response`)
    parts.push(`Offers ${avail.join(' with ')}.`)
  }

  return parts.join(' ')
}

// POST — Generate an "About Us" description for a contractor
// Body: { contractor_id: string, save?: boolean }
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { contractor_id, save } = body

    if (!contractor_id) {
      return NextResponse.json({ error: 'contractor_id is required' }, { status: 400 })
    }

    const db = createAdminClient()

    const { data: contractor, error } = await db
      .from('contractors')
      .select('*')
      .eq('id', contractor_id)
      .single()

    if (error || !contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    const c = contractor as unknown as ContractorRow
    const factSheet = buildFactSheet(c)
    let description: string
    let source: 'claude' | 'template'

    // Try Claude first, fall back to template
    try {
      description = await generateWithClaude(factSheet, c.company_name)
      source = 'claude'
    } catch (aiErr) {
      console.error('Claude generation failed, using template fallback:', aiErr)
      description = generateFallback(c)
      source = 'template'
    }

    // Optionally save
    if (save) {
      const { error: updateError } = await db
        .from('contractors')
        .update({ description })
        .eq('id', contractor_id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      description,
      source,
      saved: !!save,
      word_count: description.split(/\s+/).length,
    })
  } catch (err) {
    console.error('Generate description error:', err)
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 })
  }
}
