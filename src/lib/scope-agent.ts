// ─────────────────────────────────────────────────────────────────────────────
// Scope Agent — contractor matching, tiered ranking, and prompt assembly for
// the AI job-intake chat (/api/ai/chat). Server-only (rows include email).
//
// Ranking is real-data-only:
//   base signals (populated on all trades): offers_24_7, avg_rating/review_count,
//   city/state proximity tier.
//   bonus signals (only when non-null): system_types, building_types_served.
//   emergency_response_minutes is 0% populated — NEVER used.
// "Why chosen" reasons are generated only from fields that actually have data.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server'
import { TRADE_KEY } from '@/lib/trade-scope'
import { SERVICE_TYPES, SYSTEM_TYPES, BUILDING_TYPES, SITE_NAME, TIMING_OPTIONS } from '@/lib/constants'

export interface ScopeContractor {
  id: string
  company_name: string
  slug: string
  short_description: string | null
  logo_url: string | null
  city: string | null
  state: string | null
  avg_rating: number | null
  review_count: number | null
  is_verified: boolean | null
  offers_24_7: boolean | null
  system_types: string[] | null
  building_types_served: string[] | null
  email: string | null // server-only — stripped before anything reaches the client
}

export interface RankedContractor extends ScopeContractor {
  score: number
  reasons: string[]
}

const COLS =
  'id, company_name, slug, short_description, logo_url, city, state, avg_rating, review_count, is_verified, offers_24_7, system_types, building_types_served, email'

/** Trade-scoped contractor lookup by location. Falls back to the FTS RPC. */
export async function findContractors(params: {
  city?: string | null
  state?: string | null
  service?: string | null
}): Promise<ScopeContractor[]> {
  const supabase = await createClient()
  const { city, state } = params

  let query = supabase.from('contractors').select(COLS).eq('trade', TRADE_KEY).neq('subscription_status', 'cancelled').limit(25)
  if (state) query = query.ilike('state', state.trim())
  if (city) query = query.ilike('city', `%${city.trim()}%`)

  const { data, error } = await query
  if (error) console.error('Scope agent contractor query error:', error)
  let rows = (data as unknown as ScopeContractor[] | null) ?? []

  // Widen to state-only, then to the search_contractors RPC, if the city is thin.
  if (rows.length < 3 && city && state) {
    const { data: stateRows } = await supabase.from('contractors').select(COLS).eq('trade', TRADE_KEY).neq('subscription_status', 'cancelled').ilike('state', state.trim()).limit(25)
    rows = dedupeById([...rows, ...(((stateRows as unknown) as ScopeContractor[] | null) ?? [])])
  }
  if (rows.length < 3 && (city || state)) {
    const { data: fts } = await supabase.rpc('search_contractors', {
      search_term: [city, state].filter(Boolean).join(' '),
    })
    const ids = ((fts as { id: string }[] | null) ?? []).map((r) => r.id)
    if (ids.length) {
      // RPC is not trade-scoped — refetch by id WITH the trade filter.
      const { data: byId } = await supabase.from('contractors').select(COLS).eq('trade', TRADE_KEY).in('id', ids).neq('subscription_status', 'cancelled')
      rows = dedupeById([...rows, ...(((byId as unknown) as ScopeContractor[] | null) ?? [])])
    }
  }
  return rows
}

function dedupeById(rows: ScopeContractor[]): ScopeContractor[] {
  const seen = new Set<string>()
  return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
}

/** Tiered scoring — see header. Returns top `limit`, best first. */
export function rankContractors(
  rows: ScopeContractor[],
  intake: { city?: string | null; state?: string | null; systems?: string[]; buildingType?: string | null },
  limit = 5
): RankedContractor[] {
  const systemLabels = new Map<string, string>(SYSTEM_TYPES.map((s) => [s.value, s.label]))

  const ranked = rows.map((c) => {
    let score = 0
    const reasons: string[] = []

    // Base: 24/7 availability
    if (c.offers_24_7) {
      score += 2
      reasons.push('Offers 24/7 availability')
    }
    // Base: rating weighted by review volume (a 5.0 with 1 review ≠ 4.8 with 60)
    const rating = Number(c.avg_rating) || 0
    const reviews = Number(c.review_count) || 0
    if (rating > 0 && reviews > 0) {
      score += (rating / 5) * Math.min(reviews, 10) / 10 * 3
      reasons.push(`Rated ${rating.toFixed(1)}★ across ${reviews} review${reviews === 1 ? '' : 's'}`)
    }
    // Base: proximity tier (no geocoding in chat — city/state text match)
    if (intake.city && c.city && c.city.toLowerCase().includes(intake.city.trim().toLowerCase())) {
      score += 2
      reasons.push(`Based in ${c.city}`)
    } else if (intake.state && c.state && c.state.toLowerCase() === intake.state.trim().toLowerCase()) {
      score += 1
    }
    // Bonus: system expertise, only when the contractor actually lists systems
    const wanted = intake.systems ?? []
    if (wanted.length && c.system_types?.length) {
      const matches = wanted.filter((s) => c.system_types!.includes(s))
      if (matches.length) {
        score += Math.min(matches.length * 0.5, 1)
        reasons.push(`Works with ${matches.map((m) => systemLabels.get(m) ?? m).join(', ')}`)
      }
    }
    // Bonus: building type, only when non-null
    if (intake.buildingType && c.building_types_served?.includes(intake.buildingType)) {
      score += 0.5
      reasons.push('Serves your property type')
    }

    return { ...c, score: Math.round(score * 100) / 100, reasons }
  })

  return ranked.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** Client-safe shape — strips email and internal-only fields. */
export function toPublicShortlist(rows: RankedContractor[]) {
  return rows.map(({ id, company_name, slug, short_description, logo_url, city, state, avg_rating, review_count, is_verified, offers_24_7, score, reasons }) => ({
    id, company_name, slug, short_description, logo_url, city, state,
    avg_rating, review_count, is_verified, offers_24_7, score, reasons,
  }))
}

export type PublicShortlist = ReturnType<typeof toPublicShortlist>

// ── Prompt + tool definition for the chat route ───────────────────────────────

export const MAX_USER_TURNS = 6

const HVAC_QUESTIONS = [
  'What city and state is the building in?',
  'What type of property is it — office, retail, warehouse, healthcare, multifamily?',
  'What is going on — no cooling/heating, a repair, replacement, maintenance program, or an emergency?',
  'Do you know the equipment — RTUs, chillers, boilers, splits, VRF — and roughly how many units?',
  'How urgent is this — active emergency, this week, this month, or planning ahead?',
]

export function buildSystemPrompt(): string {
  const questions = HVAC_QUESTIONS
  return [
    `You are the Scope Agent for ${SITE_NAME}, a COMMERCIAL HVAC directory for property managers, facility managers, and building owners (NEVER homeowners/residential). Focus on commercial HVAC: RTUs, chillers, boilers, split systems, VRF, controls/BAS, ventilation, refrigeration, preventative maintenance, and emergency service across commercial buildings.`,
    `Your job: understand the buyer's job in 3-5 short follow-up questions (ONE question per message), then call the search_contractors tool to match them with local contractors.`,
    `Follow-up question bank (adapt, skip what they already told you):\n${questions.map((q) => `- ${q}`).join('\n')}`,
    `Valid service_type values: ${SERVICE_TYPES.map((s) => `${s.value} (${s.label})`).join(', ')}.`,
    `Valid system values: ${SYSTEM_TYPES.map((s) => s.value).join(', ')}. Valid building_type values: ${BUILDING_TYPES.map((b) => b.value).join(', ')}. Valid timing values: ${TIMING_OPTIONS.map((t) => t.value).join(', ')}.`,
    `Rules:`,
    `- Be brief and friendly. One question at a time. Never ask for information already given.`,
    `- Once you know at least the location and the type of work (don't drag it out), call search_contractors with everything gathered plus a 2-3 sentence scope_summary written for a contractor.`,
    `- After the tool returns, present the shortlist in one short paragraph (the UI renders the cards) and tell them to leave their email so the matched contractors can quote the job. Do not list contractor details yourself.`,
    `- NEVER invent contractor capabilities, response times, or credentials. Only the tool results are real.`,
    `- Stay on topic: commercial HVAC intake only. Politely decline anything else.`,
  ].filter(Boolean).join('\n\n')
}

export const SEARCH_TOOL = {
  name: 'search_contractors',
  description: 'Match the buyer with local commercial HVAC contractors. Call once you know the location and type of work.',
  input_schema: {
    type: 'object' as const,
    properties: {
      city: { type: 'string', description: 'Property city' },
      state: { type: 'string', description: '2-letter state code' },
      service_type: { type: 'string', enum: SERVICE_TYPES.map((s) => s.value) },
      systems: { type: 'array', items: { type: 'string' }, description: 'Relevant system values, if mentioned' },
      building_type: { type: 'string', description: 'Property type value, if known' },
      timing: { type: 'string', enum: TIMING_OPTIONS.map((t) => t.value) },
      scope_summary: { type: 'string', description: '2-3 sentence job scope written for a contractor' },
    },
    required: ['state', 'service_type', 'scope_summary'],
  },
}
