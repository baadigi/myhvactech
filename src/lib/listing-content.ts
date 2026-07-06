// Shared listing-content generation — National LLM-SEO format (Q&A-led body + FAQ).
// Used by the admin generate/bulk routes and the preview batch script.
// Grounding rule: use ONLY facts present in the DB row or the fetched website. Never invent.

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

export interface ContractorRow {
  id?: string
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

export interface FaqItem {
  question: string
  answer: string
}

export interface ListingContent {
  description: string
  short: string
  meta: string
  qa: FaqItem[]   // top "Quick Answers" snippets — the 3 highest-intent questions AI/searchers ask
  faq: FaqItem[]  // detailed operational FAQ
}

export function buildFactSheet(c: ContractorRow): string {
  const facts: string[] = []
  facts.push(`Company: ${c.company_name}`)
  facts.push(`Location: ${c.google_formatted_address || `${c.city}, ${c.state}`}`)
  if (c.year_established) facts.push(`Established: ${c.year_established}`)
  if (c.years_commercial_experience) facts.push(`Commercial experience: ${c.years_commercial_experience} years`)
  if (c.service_radius_miles) facts.push(`Service radius: ${c.service_radius_miles} miles`)
  if (c.google_rating && c.google_review_count) {
    facts.push(`Google rating: ${c.google_rating}/5 (${c.google_review_count} reviews)`)
  }
  if (c.google_editorial_summary) facts.push(`Google description: ${c.google_editorial_summary}`)
  if (c.google_reviews && c.google_reviews.length > 0) {
    const topReviews = c.google_reviews.filter((r) => r.text && r.text.length > 20 && r.rating >= 4).slice(0, 5)
    if (topReviews.length > 0) {
      facts.push(`\nNotable customer reviews:`)
      for (const r of topReviews) facts.push(`- "${r.text.slice(0, 300)}" — ${r.author_name}`)
    }
  }
  if (c.system_types.length > 0) {
    facts.push(`Systems serviced: ${c.system_types.map((st) => SYSTEM_LABELS[st] || st).join(', ')}`)
  }
  if (c.tonnage_range_min != null && c.tonnage_range_max != null) {
    facts.push(`Tonnage range: ${c.tonnage_range_min}–${c.tonnage_range_max} tons`)
  }
  if (c.building_types_served.length > 0) {
    facts.push(`Building types: ${c.building_types_served.map((bt) => BUILDING_LABELS[bt] || bt).join(', ')}`)
  }
  if (c.brands_serviced.length > 0) facts.push(`Brands: ${c.brands_serviced.join(', ')}`)
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

// Fetch the contractor's own website for extra grounding (best-effort, plain fetch).
export async function fetchWebsiteContent(url: string): Promise<string | null> {
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

// Anti-fabrication fallback (no AI). Plain prose from known facts only.
export function generateFallback(c: ContractorRow): string {
  const parts: string[] = []
  const exp = c.years_commercial_experience
    ? `With ${c.years_commercial_experience} years of commercial HVAC experience, `
    : c.year_established
      ? `Established in ${c.year_established}, `
      : ''
  parts.push(`${exp}${c.company_name} is a commercial HVAC contractor serving ${c.city}, ${c.state} and the surrounding area${c.service_radius_miles ? ` within a ${c.service_radius_miles}-mile radius` : ''}.`)
  if (c.google_rating && c.google_review_count) parts.push(`Rated ${c.google_rating}/5 on Google across ${c.google_review_count} reviews.`)
  if (c.system_types.length > 0) parts.push(`Services ${c.system_types.map((st) => SYSTEM_LABELS[st] || st).join(', ')}.`)
  if (c.building_types_served.length > 0) parts.push(`Works on ${c.building_types_served.map((bt) => BUILDING_LABELS[bt] || bt).join(', ')}.`)
  if (c.offers_24_7 || c.emergency_response_minutes) {
    const avail: string[] = []
    if (c.offers_24_7) avail.push('24/7 availability')
    if (c.emergency_response_minutes) avail.push(`${c.emergency_response_minutes}-minute emergency response`)
    parts.push(`Offers ${avail.join(' with ')}.`)
  }
  return parts.join(' ')
}

// ── Quick-Answers question bank ──────────────────────────────────────────────
// High-intent questions people/AI ask when choosing a commercial HVAC contractor.
// Each listing gets 3, chosen by its own facts + a rotation seed so the ~5k listings
// don't all repeat the same trio. The model only ANSWERS these (grounded) — it does
// not phrase them, which is what keeps them varied and on-topic at scale.
interface QTemplate {
  id: string
  applies: (c: ContractorRow) => boolean
  q: (c: ContractorRow) => string
}

const cityState = (c: ContractorRow) => `${c.city}, ${c.state}`
const firstSystemLabel = (c: ContractorRow) =>
  c.system_types?.length ? (SYSTEM_LABELS[c.system_types[0]] || c.system_types[0]).replace(/\s*\(.*\)/, '') : ''
const firstBuildingLabel = (c: ContractorRow) =>
  c.building_types_served?.length ? (BUILDING_LABELS[c.building_types_served[0]] || c.building_types_served[0]) : ''

const QA_BANK: QTemplate[] = [
  { id: 'best', applies: () => true, q: (c) => `What makes ${c.company_name} a strong choice for commercial HVAC in ${cityState(c)}?` },
  { id: 'choose', applies: () => true, q: (c) => `How do I choose a reliable commercial HVAC contractor in ${c.city}?` },
  { id: 'commercial', applies: () => true, q: (c) => `Does ${c.company_name} handle commercial HVAC, not just residential systems?` },
  { id: 'services', applies: () => true, q: (c) => `What commercial HVAC services does ${c.company_name} provide in ${c.city}?` },
  { id: 'area', applies: () => true, q: (c) => `What areas around ${c.city} does ${c.company_name} serve?` },
  { id: 'cost', applies: () => true, q: (c) => `How much does commercial HVAC service cost in ${c.city}?` },
  { id: '247', applies: (c) => c.offers_24_7 || !!c.emergency_response_minutes, q: (c) => `Who offers 24/7 emergency commercial HVAC service in ${c.city}?` },
  { id: 'response', applies: (c) => !!c.emergency_response_minutes, q: (c) => `How fast can ${c.company_name} respond to an HVAC emergency in ${c.city}?` },
  { id: 'systems', applies: (c) => !!c.system_types?.length, q: (c) => `Does ${c.company_name} service ${firstSystemLabel(c)} for commercial buildings?` },
  { id: 'buildings', applies: (c) => !!c.building_types_served?.length, q: (c) => `Does ${c.company_name} work on HVAC for ${firstBuildingLabel(c)} in ${c.city}?` },
  { id: 'multisite', applies: (c) => c.multi_site_coverage, q: (c) => `Can ${c.company_name} manage HVAC across multiple ${c.state} locations?` },
  { id: 'maintenance', applies: (c) => c.offers_service_agreements, q: (c) => `Does ${c.company_name} offer commercial HVAC maintenance agreements?` },
  { id: 'brands', applies: (c) => !!c.brands_serviced?.length, q: (c) => `Is ${c.company_name} certified to service ${c.brands_serviced[0]} equipment?` },
  { id: 'reviews', applies: (c) => !!c.google_review_count, q: (c) => `Is ${c.company_name} a well-reviewed HVAC contractor in ${c.city}?` },
  { id: 'tenure', applies: (c) => !!(c.year_established || c.years_commercial_experience), q: (c) => `How long has ${c.company_name} served the ${c.city} area?` },
  { id: 'licensed', applies: (c) => !!(c.license_number || c.insurance_verified), q: (c) => `Is ${c.company_name} licensed and insured for commercial HVAC work?` },
]

function seedFrom(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// Pick 3 applicable questions: always lead with a distinct "why this company"/"how to
// choose" opener, then rotate through the rest by a per-listing seed so neighbors differ.
export function selectQaQuestions(c: ContractorRow): string[] {
  const seed = seedFrom(c.id || `${c.company_name}|${c.city}`)
  const applicable = QA_BANK.filter((t) => t.applies(c))
  const openers = applicable.filter((t) => t.id === 'best' || t.id === 'choose' || t.id === 'commercial')
  const rest = applicable.filter((t) => !openers.includes(t))
  const opener = openers[seed % openers.length]
  // Rotate the remaining pool by seed, take 2 distinct.
  const rotated = rest.map((t, i) => ({ t, k: (i + seed) % rest.length })).sort((a, b) => a.k - b.k).map((x) => x.t)
  const picks = [opener, ...rotated.slice(0, 2)].filter(Boolean)
  return picks.map((t) => t.q(c))
}

const SYSTEM_PROMPT = `You are an expert commercial HVAC writer for MyHVAC.Tech — a directory for property managers and facility managers who run commercial buildings (NOT homeowners).

You write in the National LLM-SEO format so the page is quotable by AI answer engines (ChatGPT, Perplexity, Google AI Overviews) AND ranks in classic search. Three parts, in this order:
1. QUICK ANSWERS ("qa") — you are GIVEN exactly 3 questions. Use each question VERBATIM and write an ANSWER-FIRST answer of 1–2 fully self-contained sentences (the answer must make sense quoted alone, without the question). These are the AI-citable snippets. Lead each answer with the company name + the concrete grounded fact. For a general question (e.g. cost) where you lack a specific figure, give an honest, useful answer (what it depends on + that the company provides quotes) — never invent numbers.
2. The BODY ("description") — a direct-answer lead sentence, then 2–4 short E-E-A-T paragraphs of substance. Do NOT just repeat the Quick Answers verbatim; go deeper.
3. FAQ ("faq") — 3–5 more detailed/operational questions a facility manager would ask, each answered in 1–3 self-contained sentences. Different questions from the Quick Answers.

HARD RULES:
- GROUNDING: Use ONLY facts in the CONTRACTOR FACTS or WEBSITE CONTENT provided. NEVER invent years in business, certifications, license numbers, crew size, brands, response times, or claims. If a fact is not given, do not state it. This is the most important rule.
- Third person, present tense. Reader = commercial facility/property manager.
- Every FAQ answer must be answerable from the given facts. If you lack specific facts, ask/answer general-but-accurate questions grounded in the systems/building-types/city that ARE given (e.g. "What commercial HVAC systems does {company} service?" answered from the systems list). Do NOT fabricate specifics to fill an FAQ.
- Weave location + system/building keywords in naturally; no keyword stuffing.
- Short paragraphs (2–3 sentences). Plain text only — NO markdown headings, NO bold, NO bullet characters in the body.
- BANNED phrases: "look no further", "one-stop shop", "committed to excellence", "dedicated team", "state-of-the-art", "second to none", "unparalleled", "when it comes to", "whether you need". Never open with "Looking for" or "When it comes to".
- Every sentence carries new information. No filler.
- If data is thin, it's fine to be shorter and factual rather than padded. Lean on the city/metro's real commercial HVAC context (climate, common building types given) without inventing company specifics.`

function buildUserPrompt(factSheet: string, websiteText: string | null, qaQuestions: string[]): string {
  const websiteSection = websiteText
    ? `\n\nWEBSITE CONTENT (extract real facts only — services, history, certifications, service areas; do not copy sentences verbatim):\n${websiteText}`
    : ''
  return `CONTRACTOR FACTS (verified data — the ONLY facts you may state):
${factSheet}${websiteSection}

QUICK-ANSWER QUESTIONS (answer these 3 verbatim, in this order):
${qaQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Return ONLY a valid JSON object, no prose around it, in exactly this shape:
{
  "qa": [
    { "question": "<use the given question verbatim>", "answer": "Answer-first, 1–2 self-contained sentences that read well quoted alone." }
  ],
  "description": "The About body. Direct-answer lead sentence first, then 2–4 short paragraphs separated by blank lines. 180–320 words. Plain text, no markdown.",
  "short_description": "150–160 chars for the listing card. Include city + top real differentiator.",
  "meta_description": "150–160 chars SEO meta. Include company name, city, and a CTA like 'verified reviews' or 'free quotes'.",
  "faq": [
    { "question": "...", "answer": "1–3 self-contained sentences, grounded in the facts." }
  ]
}
Provide EXACTLY 3 "qa" items and 3–5 "faq" items (different questions). Ensure the JSON parses.`
}

interface GenOpts {
  apiKey?: string
  model?: string
}

// Single Claude call → National LLM-SEO body + FAQ + short/meta. Grounded, JSON out.
export async function generateListingContent(
  c: ContractorRow,
  websiteText: string | null,
  opts: GenOpts = {}
): Promise<ListingContent> {
  const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const factSheet = buildFactSheet(c)
  const qaQuestions = selectQaQuestions(c)
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: opts.model || 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(factSheet, websiteText, qaQuestions) }],
    }),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(`Claude API error: ${response.status} — ${JSON.stringify(errData)}`)
  }
  const data = await response.json()
  const text: string = data.content?.[0]?.text?.trim() || ''
  if (!text) throw new Error('Claude returned empty response')

  // Extract the JSON object (model may wrap it in ```json fences).
  const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = jsonStr.indexOf('{')
  const end = jsonStr.lastIndexOf('}')
  const parsed = JSON.parse(jsonStr.slice(start, end + 1))

  const cleanItems = (arr: unknown): FaqItem[] =>
    Array.isArray(arr)
      ? (arr as FaqItem[])
          .filter((f) => f && f.question && f.answer)
          .map((f) => ({ question: String(f.question).trim(), answer: String(f.answer).trim() }))
      : []

  return {
    description: String(parsed.description || '').trim(),
    short: String(parsed.short_description || '').trim().slice(0, 160),
    meta: String(parsed.meta_description || parsed.short_description || '').trim().slice(0, 160),
    qa: cleanItems(parsed.qa).slice(0, 3),
    faq: cleanItems(parsed.faq),
  }
}
