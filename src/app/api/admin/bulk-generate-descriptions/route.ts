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
  id: string
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
  short_description: string | null
  meta_description: string | null
  slug: string
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

async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
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

    return stripped.slice(0, 3000) || null
  } catch {
    return null
  }
}

function buildSeoKeywords(c: ContractorRow): string[] {
  const kw: string[] = []
  kw.push(`commercial HVAC ${c.city}`)
  kw.push(`HVAC contractor ${c.city} ${c.state}`)

  const systemKwMap: Record<string, string[]> = {
    rtu: ['rooftop unit repair', 'RTU maintenance'],
    split_system: ['commercial split system'],
    chilled_water: ['chiller repair', 'chilled water system'],
    vrf: ['VRF installation', 'VRF system service'],
    boiler: ['commercial boiler repair'],
    ahu: ['air handling unit service'],
    ptac: ['PTAC unit service'],
    heat_pump: ['commercial heat pump'],
    geothermal: ['geothermal HVAC'],
    ductless_mini_split: ['ductless mini-split'],
  }
  for (const st of c.system_types || []) {
    if (systemKwMap[st]) kw.push(...systemKwMap[st])
  }

  if (c.offers_24_7) kw.push('24/7 emergency HVAC')
  if (c.multi_site_coverage) kw.push('multi-site HVAC management')
  if (c.offers_service_agreements) kw.push('HVAC maintenance contract')

  for (const brand of (c.brands_serviced || []).slice(0, 3)) {
    kw.push(`${brand} commercial HVAC`)
  }

  return [...new Set(kw)]
}

async function generateWithClaude(
  factSheet: string,
  companyName: string,
  websiteText: string | null,
  seoKeywords: string[] = []
): Promise<{ full: string; short: string; meta: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

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
- MINIMUM 200 words, TARGET 250–350 words — this is CRITICAL, do not write fewer than 200 words under any circumstances
- Even with limited data, write at least 200 words by elaborating on: what facility managers in that specific metro need, why local commercial HVAC expertise matters, the types of systems common in that market, seasonal considerations, and what a property manager should look for when hiring
- Open with the single most compelling fact about the company (e.g. "Since 1974..." or "Covering 92 commercial projects across DFW...")
- Use short paragraphs (2–3 sentences max)
- Include the city/metro in the first sentence
- NEVER use these phrases: "look no further", "one-stop shop", "committed to excellence", "dedicated team", "state-of-the-art", "second to none", "unparalleled", "when it comes to", "whether you need X or Y"
- NEVER start with "Looking for" or "When it comes to"
- Every sentence must carry new information — no filler`

  const userPrompt = `Write a compelling business description for this commercial HVAC contractor.

CONTRACTOR FACTS (verified data from our database):
${factSheet}
${websiteSection}

SEO KEYWORDS TO WEAVE IN NATURALLY (use 5–8 of these, don't force all):
${seoKeywords.length > 0 ? seoKeywords.slice(0, 15).join(', ') : 'commercial HVAC, HVAC contractor, HVAC service'}

Instructions:
- MINIMUM 200 words for the full description — count carefully before submitting
- Use facts from BOTH the database AND the website content (if provided)
- Naturally incorporate 5–8 of the SEO keywords above
- If data is thin, enrich with: market-specific HVAC challenges for that city/region, why local expertise matters for commercial properties, what building types are common in the area, seasonal HVAC demands, and what facility managers should expect from a quality contractor
- Do NOT copy sentences verbatim from their website — rewrite in your own voice

Write ALL THREE outputs now. Format your response EXACTLY like this (including the separators):

FULL_DESCRIPTION:
[your 200-350 word description here — MINIMUM 200 words]

SHORT_DESCRIPTION:
[exactly 150-160 characters for the contractor card — must include city and top differentiator. Count characters carefully.]

META_DESCRIPTION:
[exactly 150-160 characters for SEO meta tag — must include company name, city, and a call-to-action like "verified reviews" or "free quotes". Count characters carefully.]`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(`Claude API error: ${response.status} — ${JSON.stringify(errData)}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text?.trim()

  if (!text) throw new Error('Claude returned empty response')

  const fullMatch = text.match(/FULL_DESCRIPTION:\s*\n([\s\S]*?)(?:\nSHORT_DESCRIPTION:|$)/)
  const shortMatch = text.match(/SHORT_DESCRIPTION:\s*\n([\s\S]*?)(?:\nMETA_DESCRIPTION:|$)/)
  const metaMatch = text.match(/META_DESCRIPTION:\s*\n([\s\S]*?)$/)

  const fullDesc = fullMatch ? fullMatch[1].trim() : text
  const shortDesc = shortMatch ? shortMatch[1].trim().slice(0, 160) : ''
  const metaDesc = metaMatch ? metaMatch[1].trim().slice(0, 160) : shortDesc

  return { full: fullDesc, short: shortDesc, meta: metaDesc }
}

// POST — Bulk regenerate descriptions for contractors with thin content
// Body: { mode: 'all' | 'thin' | 'missing', dry_run?: boolean, limit?: number }
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { mode = 'thin', dry_run = false, limit = 50 } = body

    const db = createAdminClient()

    // Fetch contractors based on mode
    let query = db
      .from('contractors')
      .select('*')
      .neq('subscription_status', 'cancelled')
      .order('profile_views', { ascending: false })
      .limit(limit)

    if (mode === 'missing') {
      // Only contractors with no description at all
      query = query.is('description', null)
    } else if (mode === 'thin') {
      // Contractors with no description OR very short ones (< 100 chars)
      // We'll filter short ones in JS since Supabase doesn't support length()
    }
    // mode === 'all' — regenerate everything

    const { data: contractors, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!contractors || contractors.length === 0) {
      return NextResponse.json({ message: 'No contractors found to process', processed: 0 })
    }

    // Filter for thin content if needed
    let toProcess = contractors as unknown as ContractorRow[]
    if (mode === 'thin') {
      toProcess = toProcess.filter(c =>
        !c.description ||
        c.description.length < 200 ||
        !c.short_description ||
        c.short_description.length < 100 ||
        !c.meta_description
      )
    }

    if (dry_run) {
      return NextResponse.json({
        message: 'Dry run — no changes made',
        would_process: toProcess.length,
        contractors: toProcess.map(c => ({
          id: c.id,
          name: c.company_name,
          slug: c.slug,
          current_description_length: c.description?.length ?? 0,
          current_short_length: c.short_description?.length ?? 0,
          has_meta: !!c.meta_description,
        })),
      })
    }

    const results: Array<{
      id: string
      name: string
      status: string
      word_count?: number
      short_length?: number
      meta_length?: number
    }> = []

    // Process sequentially to avoid rate limits
    for (const c of toProcess) {
      try {
        const factSheet = buildFactSheet(c)
        const seoKeywords = buildSeoKeywords(c)

        // Try to fetch website
        const websiteUrl = c.google_website || null
        let websiteText: string | null = null
        if (websiteUrl) {
          websiteText = await fetchWebsiteContent(websiteUrl)
        }

        const aiResult = await generateWithClaude(factSheet, c.company_name, websiteText, seoKeywords)

        // Validate minimum length — retry if too short
        let description = aiResult.full
        let shortDescription = aiResult.short
        let metaDescription = aiResult.meta

        const wordCount = description.split(/\s+/).length
        if (wordCount < 150) {
          // Retry with stronger prompt
          const retryResult = await generateWithClaude(
            factSheet + '\n\nCRITICAL: Your previous attempt was only ' + wordCount + ' words. You MUST write at least 200 words. Expand on the local market, seasonal HVAC needs, building types in the area, and what makes this contractor relevant to facility managers.',
            c.company_name,
            websiteText,
            seoKeywords
          )
          if (retryResult.full.split(/\s+/).length > wordCount) {
            description = retryResult.full
            shortDescription = retryResult.short
            metaDescription = retryResult.meta
          }
        }

        // Ensure short_description is at least 100 chars
        if (!shortDescription || shortDescription.length < 100) {
          const rating = c.google_rating ? ` ${c.google_rating}★ rated.` : ''
          const systems = c.system_types.length > 0
            ? ` ${c.system_types.slice(0, 2).map(st => SYSTEM_LABELS[st] || st).join(' & ')}.`
            : ''
          shortDescription = `Commercial HVAC contractor in ${c.city}, ${c.state}.${rating}${systems} Verified reviews, free quotes.`.slice(0, 160)
        }

        // Ensure meta_description is at least 100 chars
        if (!metaDescription || metaDescription.length < 100) {
          metaDescription = `${c.company_name} — commercial HVAC contractor in ${c.city}, ${c.state}. Read verified reviews, compare services, and request free quotes.`.slice(0, 160)
        }

        // Save to DB
        const { error: updateError } = await db
          .from('contractors')
          .update({
            description,
            short_description: shortDescription,
            meta_description: metaDescription,
          })
          .eq('id', c.id)

        if (updateError) {
          results.push({ id: c.id, name: c.company_name, status: `error: ${updateError.message}` })
        } else {
          results.push({
            id: c.id,
            name: c.company_name,
            status: 'success',
            word_count: description.split(/\s+/).length,
            short_length: shortDescription.length,
            meta_length: metaDescription.length,
          })
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1500))
      } catch (err) {
        results.push({
          id: c.id,
          name: c.company_name,
          status: `error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status.startsWith('error')).length

    return NextResponse.json({
      message: `Processed ${results.length} contractors: ${successCount} succeeded, ${errorCount} failed`,
      processed: results.length,
      success: successCount,
      errors: errorCount,
      results,
    })
  } catch (err) {
    console.error('Bulk generate error:', err)
    return NextResponse.json({ error: 'Failed to run bulk generation' }, { status: 500 })
  }
}
