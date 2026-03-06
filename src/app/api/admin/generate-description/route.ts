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
  google_reviews: { author_name: string; text: string; rating: number }[] | null
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

  // Include Google review snippets for voice/personality cues
  if (c.google_reviews && c.google_reviews.length > 0) {
    const topReviews = c.google_reviews
      .filter((r) => r.text && r.text.length > 20 && r.rating >= 4)
      .slice(0, 5)
    if (topReviews.length > 0) {
      facts.push(`\nNotable customer reviews:`)
      for (const r of topReviews) {
        facts.push(`- "${r.text.slice(0, 300)}" — ${r.author_name}`)
      }
    }
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

// Fetch the contractor's own website for richer context
async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
    // Clean URL
    let cleanUrl = url.trim()
    if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MyHVACTech-Bot/1.0' },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const html = await res.text()

    // Strip scripts, styles, nav, footer, then tags — extract body text
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Take first ~3000 chars to keep prompt reasonable
    return stripped.slice(0, 3000) || null
  } catch {
    return null
  }
}


// Build SEO keywords from contractor data
function buildSeoKeywords(c: ContractorRow): string[] {
  const kw: string[] = []

  // Location keywords
  kw.push(`commercial HVAC ${c.city}`)
  kw.push(`HVAC contractor ${c.city} ${c.state}`)
  if (c.google_formatted_address) {
    // Extract metro if available
    const parts = c.google_formatted_address.split(',').map((p: string) => p.trim())
    if (parts.length >= 2) kw.push(`HVAC service ${parts[0]}`)
  }

  // System-specific keywords
  const systemKwMap: Record<string, string[]> = {
    rtu: ['rooftop unit repair', 'RTU maintenance', 'commercial rooftop HVAC'],
    split_system: ['commercial split system', 'split system installation'],
    chilled_water: ['chiller repair', 'chilled water system', 'commercial chiller service'],
    vrf: ['VRF installation', 'VRF system service', 'variable refrigerant flow'],
    boiler: ['commercial boiler repair', 'boiler maintenance'],
    ahu: ['air handling unit service', 'AHU repair', 'air handler maintenance'],
    ptac: ['PTAC unit service', 'PTAC installation'],
    heat_pump: ['commercial heat pump', 'heat pump installation'],
    geothermal: ['geothermal HVAC', 'geothermal system installation'],
    ductless_mini_split: ['ductless mini-split', 'mini-split installation'],
  }
  for (const st of c.system_types || []) {
    if (systemKwMap[st]) kw.push(...systemKwMap[st])
  }

  // Building type keywords
  const buildingKwMap: Record<string, string[]> = {
    office: ['office building HVAC', 'commercial office cooling'],
    retail: ['retail HVAC service', 'store HVAC maintenance'],
    industrial: ['industrial HVAC', 'warehouse cooling', 'factory HVAC'],
    healthcare: ['hospital HVAC', 'medical facility HVAC', 'healthcare HVAC compliance'],
    education: ['school HVAC', 'university HVAC service'],
    hospitality: ['hotel HVAC', 'hospitality HVAC service'],
    data_center: ['data center cooling', 'server room HVAC', 'precision cooling'],
    multi_family: ['multi-family HVAC', 'apartment HVAC service'],
    government: ['government building HVAC', 'municipal HVAC service'],
    restaurant: ['restaurant HVAC', 'commercial kitchen ventilation'],
    mixed_use: ['mixed-use building HVAC'],
  }
  for (const bt of c.building_types_served || []) {
    if (buildingKwMap[bt]) kw.push(...buildingKwMap[bt])
  }

  // Service keywords
  if (c.offers_24_7) kw.push('24/7 emergency HVAC', 'after-hours HVAC repair')
  if (c.multi_site_coverage) kw.push('multi-site HVAC management', 'national HVAC coverage')
  if (c.offers_service_agreements) kw.push('HVAC maintenance contract', 'preventive maintenance agreement')
  if (c.tonnage_range_max && c.tonnage_range_max >= 100) kw.push('large tonnage HVAC', 'high-capacity commercial HVAC')

  // Brand keywords
  for (const brand of (c.brands_serviced || []).slice(0, 4)) {
    kw.push(`${brand} commercial HVAC`, `${brand} authorized service`)
  }

  return [...new Set(kw)] // deduplicate
}

async function generateWithClaude(
  factSheet: string,
  companyName: string,
  websiteText: string | null,
  seoKeywords: string[] = []
): Promise<{ full: string; short: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const websiteSection = websiteText
    ? `\n\nCONTENT FROM THEIR WEBSITE (use to extract real facts — services, history, differentiators, service areas, certifications):\n${websiteText}`
    : ''

  const systemPrompt = `You are an expert commercial HVAC copywriter who writes for MyHVAC.Tech — a directory built for property managers and facility managers who manage commercial buildings (NOT homeowners).

Your writing must:
- Sound like a knowledgeable industry journalist profiling the company, not ad copy
- Be third-person, present tense
- Target facility managers and commercial property managers as the reader
- Weave in relevant SEO keywords naturally: commercial HVAC, the city/metro area, specific system types and building types the company handles
- Emphasize what a facility manager actually cares about: response times, system expertise, track record, scale of projects, coverage area, certifications
- Highlight concrete differentiators from residential directories (Angi, HomeAdvisor): commercial-only focus, tonnage capacity, multi-building coverage, SLAs, emergency response guarantees
- MINIMUM 150 words, TARGET 200–300 words — this is critical. Even with limited data, write at least 150 words by elaborating on location, services, and what facility managers should expect
- If data is thin, expand on: the company's service area, typical commercial HVAC needs in that market, and what makes choosing a local contractor important for property managers
- Open with the single most compelling fact about the company (e.g. "Since 1974..." or "Covering 92 commercial projects across DFW...")
- Use short paragraphs (2–3 sentences max)
- Include the city/metro in the first sentence
- NEVER use these phrases: "look no further", "one-stop shop", "committed to excellence", "dedicated team", "state-of-the-art", "second to none", "unparalleled", "when it comes to", "whether you need X or Y"
- NEVER start with "Looking for" or "When it comes to"
- Every sentence must carry new information — no filler
- If the fact sheet is thin, focus on location, Google rating, and whatever specifics exist rather than inventing vague claims`

  const userPrompt = `Write a compelling business description for this commercial HVAC contractor.

CONTRACTOR FACTS (verified data from our database):
${factSheet}
${websiteSection}

SEO KEYWORDS TO WEAVE IN NATURALLY (use 5–8 of these, don't force all):
${seoKeywords.length > 0 ? seoKeywords.slice(0, 15).join(', ') : 'commercial HVAC, HVAC contractor, HVAC service'}

Instructions:
- Use facts from BOTH the database AND the website content (if provided)
- Naturally incorporate 5–8 of the SEO keywords above into the description — they should read as organic text, not a keyword list
- Do NOT copy sentences verbatim from their website — rewrite in your own voice
- If website content reveals specifics not in the database (year founded, certifications, project types, client testimonials, specific services), incorporate those
- If no website content is available and the database facts are thin, write a shorter but still useful description (~150 words) rather than padding with generic fluff

Write both outputs now. Format your response EXACTLY like this (including the separator):

FULL_DESCRIPTION:
[your 150-300 word description here]

SHORT_DESCRIPTION:
[your 150-155 character SEO meta snippet here — must be under 155 characters, pack in city + top differentiator + CTA-worthy detail]`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
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

  // Parse out both descriptions
  const fullMatch = text.match(/FULL_DESCRIPTION:\s*\n([\s\S]*?)(?:\nSHORT_DESCRIPTION:|$)/)
  const shortMatch = text.match(/SHORT_DESCRIPTION:\s*\n([\s\S]*?)$/)

  const fullDesc = fullMatch ? fullMatch[1].trim() : text
  const shortDesc = shortMatch ? shortMatch[1].trim().slice(0, 160) : ''

  return { full: fullDesc, short: shortDesc }
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

// Build a ContractorRow from inline form data (for Add page where no DB record exists yet)
function formDataToContractorRow(form: Record<string, unknown>): ContractorRow {
  return {
    company_name: (form.company_name as string) || 'Unknown',
    city: (form.city as string) || '',
    state: (form.state as string) || '',
    year_established: form.year_established ? Number(form.year_established) : null,
    system_types: (form.system_types as string[]) || [],
    building_types_served: (form.building_types_served as string[]) || [],
    brands_serviced: (form.brands_serviced as string[]) || [],
    emergency_response_minutes: form.emergency_response_minutes ? Number(form.emergency_response_minutes) : null,
    offers_24_7: !!form.offers_24_7,
    multi_site_coverage: !!form.multi_site_coverage,
    max_sites_supported: form.max_sites_supported ? Number(form.max_sites_supported) : null,
    num_technicians: form.num_technicians ? Number(form.num_technicians) : null,
    num_nate_certified: form.num_nate_certified ? Number(form.num_nate_certified) : null,
    years_commercial_experience: form.years_commercial_experience ? Number(form.years_commercial_experience) : null,
    offers_service_agreements: !!form.offers_service_agreements,
    service_agreement_types: (form.service_agreement_types as string[]) || [],
    sla_summary: (form.sla_summary as string) || null,
    google_rating: form.google_rating ? Number(form.google_rating) : null,
    google_review_count: form.google_review_count ? Number(form.google_review_count) : null,
    google_editorial_summary: (form.google_editorial_summary as string) || null,
    google_formatted_address: (form.google_formatted_address as string) || null,
    google_phone: (form.google_phone as string) || null,
    google_website: (form.google_website as string) || null,
    google_reviews: (form.google_reviews as ContractorRow['google_reviews']) || null,
    tonnage_range_min: form.tonnage_range_min ? Number(form.tonnage_range_min) : null,
    tonnage_range_max: form.tonnage_range_max ? Number(form.tonnage_range_max) : null,
    service_radius_miles: form.service_radius_miles ? Number(form.service_radius_miles) : 50,
    license_number: (form.license_number as string) || null,
    insurance_verified: !!form.insurance_verified,
    uses_gps_tracking: !!form.uses_gps_tracking,
    dispatch_crm: (form.dispatch_crm as string) || null,
    description: (form.description as string) || null,
  }
}

// POST — Generate an "About Us" description for a contractor
// Body: { contractor_id: string, save?: boolean }
//   OR: { form_data: {...}, save?: false }  (for unsaved Add form)
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { contractor_id, save, form_data } = body

    if (!contractor_id && !form_data) {
      return NextResponse.json({ error: 'contractor_id or form_data is required' }, { status: 400 })
    }

    let c: ContractorRow
    const db = createAdminClient()

    if (contractor_id) {
      // Existing contractor — fetch from DB
      const { data: contractor, error } = await db
        .from('contractors')
        .select('*')
        .eq('id', contractor_id)
        .single()

      if (error || !contractor) {
        return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
      }
      c = contractor as unknown as ContractorRow
    } else {
      // Inline form data — build a ContractorRow from it
      c = formDataToContractorRow(form_data)
    }

    const factSheet = buildFactSheet(c)

    // Try to fetch their website for richer context
    const websiteUrl = c.google_website || (form_data?.website as string) || null
    let websiteText: string | null = null
    if (websiteUrl) {
      websiteText = await fetchWebsiteContent(websiteUrl)
    }

    // Build SEO keywords for this contractor
    const seoKeywords = buildSeoKeywords(c)

    let description: string
    let shortDescription: string = ''
    let source: 'claude' | 'template'

    // Try Claude first, fall back to template
    try {
      const aiResult = await generateWithClaude(factSheet, c.company_name, websiteText, seoKeywords)
      description = aiResult.full
      shortDescription = aiResult.short

      // Check minimum length — retry once if too short
      const wordCount = description.split(/\s+/).length
      if (wordCount < 100) {
        console.log(`First attempt too short (${wordCount} words), retrying with stronger prompt...`)
        const retryResult = await generateWithClaude(
          factSheet + '\n\nIMPORTANT: Your previous attempt was only ' + wordCount + ' words. The MINIMUM is 150 words. Write a more comprehensive description covering the company\'s service area, capabilities, and value to facility managers.',
          c.company_name,
          websiteText,
          seoKeywords
        )
        if (retryResult.full.split(/\s+/).length > wordCount) {
          description = retryResult.full
          shortDescription = retryResult.short
        }
      }

      source = 'claude'
    } catch (aiErr) {
      console.error('Claude generation failed, using template fallback:', aiErr)
      description = generateFallback(c)
      source = 'template'
    }

    // Optionally save (only works with contractor_id)
    if (save && contractor_id) {
      const { error: updateError } = await db
        .from('contractors')
        .update({ description, ...(shortDescription ? { short_description: shortDescription } : {}) })
        .eq('id', contractor_id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      description,
      short_description: shortDescription,
      source,
      saved: !!(save && contractor_id),
      word_count: description.split(/\s+/).length,
      website_fetched: !!websiteText,
    })
  } catch (err) {
    console.error('Generate description error:', err)
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 })
  }
}
