import { Metadata } from 'next'
import { headers } from 'next/headers'
import { MapPin, ChevronLeft, ChevronRight, ArrowRight, SearchX } from 'lucide-react'
import { SITE_NAME, HVAC_SERVICES, BUILDING_TYPES, US_STATES } from '@/lib/constants'
import type { SearchParams, Contractor, Service } from '@/lib/types'
import ContractorCard from '@/components/ContractorCard'
import SearchBar from '@/components/SearchBar'
import SearchFilters from '@/components/SearchFilters'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Try to resolve a location string to { city?, state? } */
function parseLocation(input: string): { city?: string; state?: string } {
  const trimmed = input.trim()
  if (!trimmed) return {}

  // Check if the input is a state name or abbreviation
  const stateMatch = US_STATES.find(
    (s) =>
      s.abbr.toLowerCase() === trimmed.toLowerCase() ||
      s.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (stateMatch) {
    return { state: stateMatch.abbr }
  }

  // Check for "City, ST" or "City, State" patterns
  const commaMatch = trimmed.match(/^(.+?),\s*(.+)$/)
  if (commaMatch) {
    const cityPart = commaMatch[1].trim()
    const statePart = commaMatch[2].trim()
    const stateFromPart = US_STATES.find(
      (s) =>
        s.abbr.toLowerCase() === statePart.toLowerCase() ||
        s.name.toLowerCase() === statePart.toLowerCase()
    )
    return {
      city: cityPart,
      state: stateFromPart?.abbr || undefined,
    }
  }

  // Default: treat as city name
  return { city: trimmed }
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<SearchParams & {
    sort?: string
    minRating?: string
    verified?: string
    emergency?: string
    radius?: string
    categories?: string
    buildingType?: string
    systemType?: string
    serviceAgreement?: string
    multiSite?: string
    tonnageMin?: string
    tonnageMax?: string
  }>
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const city = params.city ? ` in ${params.city}` : ''
  const query = params.q ? ` — ${params.q}` : ''

  return {
    title: `Commercial HVAC Contractors${city}${query} | ${SITE_NAME}`,
    description: `Search and compare commercial HVAC contractors${city}. Filter by building type, system, service, and more. Read verified reviews and request free quotes.`,
    robots: { index: false, follow: true },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const rawCity = params.city || ''
  const rawState = params.state || ''
  const q = params.q || ''
  const currentPage = parseInt(params.page || '1', 10)
  const pageSize = 20
  const sort = params.sort || 'relevance'

  // ── Geo detection via Vercel headers ───────────────────────
  const headersList = await headers()
  const geoCity = headersList.get('x-vercel-ip-city') || ''
  const geoRegion = headersList.get('x-vercel-ip-country-region') || ''

  // ── Parse the location input smartly ────────────────────────
  const parsed = parseLocation(rawCity)
  const city = parsed.city || ''
  const state = parsed.state || rawState || ''

  // If user provided no location at all, fall back to geo-detected state
  const useGeoFallback = !city && !state && !rawCity && !rawState
  const effectiveState = state || (useGeoFallback ? geoRegion : '')
  const effectiveCity = city
  const geoFallbackCity = useGeoFallback ? decodeURIComponent(geoCity) : ''

  // Display label for the location
  const locationLabel = effectiveCity
    ? `${effectiveCity}${effectiveState ? ', ' + effectiveState : ''}`
    : effectiveState
      ? US_STATES.find(s => s.abbr === effectiveState)?.name || effectiveState
      : geoFallbackCity
        ? `${geoFallbackCity} area`
        : ''

  // ── Fetch from Supabase (admin client bypasses RLS) ────────
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbQuery: any = supabase
    .from('contractors')
    .select('*', { count: 'exact' })
    .neq('subscription_status', 'cancelled')

  // Location filters
  if (effectiveCity) {
    dbQuery = dbQuery.ilike('city', effectiveCity)
  }
  if (effectiveState) {
    dbQuery = dbQuery.ilike('state', effectiveState)
  }

  // Smart text search: if q matches a known HVAC service, skip text filtering
  if (q) {
    const qLower = q.toLowerCase().trim()
    const isServiceQuery = HVAC_SERVICES.some(
      (svc) =>
        svc.name.toLowerCase() === qLower ||
        svc.slug === qLower.replace(/\s+/g, '-').toLowerCase() ||
        qLower.includes(svc.name.toLowerCase()) ||
        svc.name.toLowerCase().includes(qLower)
    )

    if (!isServiceQuery) {
      dbQuery = dbQuery.or(
        `company_name.ilike.%${q}%,description.ilike.%${q}%,short_description.ilike.%${q}%`
      )
    }
  }

  // Sidebar filters
  if (params.verified === 'true') {
    dbQuery = dbQuery.eq('is_verified', true)
  }
  if (params.emergency === 'true') {
    dbQuery = dbQuery.eq('offers_24_7', true)
  }
  if (params.serviceAgreement === 'true') {
    dbQuery = dbQuery.eq('offers_service_agreements', true)
  }
  if (params.multiSite === 'true') {
    dbQuery = dbQuery.eq('multi_site_coverage', true)
  }
  if (params.minRating) {
    const minR = parseFloat(params.minRating)
    if (minR > 0) dbQuery = dbQuery.gte('avg_rating', minR)
  }
  if (params.buildingType) {
    const types = params.buildingType.split(',')
    dbQuery = dbQuery.overlaps('building_types_served', types)
  }
  if (params.systemType) {
    const types = params.systemType.split(',')
    dbQuery = dbQuery.overlaps('system_types', types)
  }
  if (params.tonnageMin) {
    const minT = parseInt(params.tonnageMin, 10)
    if (!isNaN(minT)) dbQuery = dbQuery.gte('tonnage_range_max', minT)
  }
  if (params.tonnageMax) {
    const maxT = parseInt(params.tonnageMax, 10)
    if (!isNaN(maxT)) dbQuery = dbQuery.lte('tonnage_range_min', maxT)
  }

  // Sort
  if (sort === 'rating') {
    dbQuery = dbQuery.order('avg_rating', { ascending: false })
  } else if (sort === 'reviews') {
    dbQuery = dbQuery.order('review_count', { ascending: false })
  } else if (sort === 'response_time') {
    dbQuery = dbQuery.order('emergency_response_minutes', { ascending: true, nullsFirst: false })
  } else {
    dbQuery = dbQuery.order('is_verified', { ascending: false }).order('company_name', { ascending: true })
  }

  // Pagination
  const from = (currentPage - 1) * pageSize
  dbQuery = dbQuery.range(from, from + pageSize - 1)

  const { data, count } = await dbQuery

  const contractors: Contractor[] = (data ?? []) as unknown as Contractor[]
  const totalResults = count ?? 0
  const totalPages = Math.ceil(totalResults / pageSize)

  const activeBuildingType = params.buildingType
    ? BUILDING_TYPES.find((bt) => bt.value === params.buildingType)?.label
    : null
  const activeSystemType = params.systemType

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* ── Compact Search Bar Header ─────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <SearchBar
            variant="compact"
            defaultQuery={params.q || ''}
            defaultCity={rawCity || (useGeoFallback ? geoFallbackCity : '')}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar Filters ───────────────────────────────────────────── */}
          <aside className="w-full lg:w-64 shrink-0">
            <SearchFilters
              selectedCategories={(params as Record<string, string>).categories?.split(',') ?? []}
              minRating={parseFloat((params as Record<string, string>).minRating || '0')}
              verifiedOnly={(params as Record<string, string>).verified === 'true'}
              emergencyOnly={(params as Record<string, string>).emergency === 'true'}
              radius={parseInt((params as Record<string, string>).radius || '25', 10)}
              selectedBuildingTypes={params.buildingType ? params.buildingType.split(',') : []}
              selectedSystemTypes={params.systemType ? params.systemType.split(',') : []}
              serviceAgreement={(params as Record<string, string>).serviceAgreement === 'true'}
              multiSite={(params as Record<string, string>).multiSite === 'true'}
            />
          </aside>

          {/* ── Main Results ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* ── CTA Banner ────────────────────────────────────────────────── */}
            <div className="mb-4 bg-primary-600 rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Need quotes fast?</p>
                <p className="text-xs text-primary-100 mt-0.5">
                  Describe your property and we&apos;ll match you with vetted contractors.
                </p>
              </div>
              <Link
                href="/get-quotes"
                className="inline-flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-lg bg-white text-primary-700 text-sm font-semibold hover:bg-primary-50 transition-colors"
              >
                Get Free Quotes
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            {/* Results header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-neutral-500">
                  <span className="font-semibold text-neutral-900">{totalResults} contractor{totalResults !== 1 ? 's' : ''}</span>
                  {locationLabel ? (
                    <>{' '}found in{' '}<span className="font-semibold text-neutral-900">{locationLabel}</span></>
                  ) : q ? (
                    <>{' '}matching{' '}<span className="font-semibold text-neutral-900">&ldquo;{q}&rdquo;</span></>
                  ) : (
                    <>{' '}found</>
                  )}
                  {q && locationLabel ? (
                    <>{' '}for{' '}<span className="font-semibold text-neutral-900">&ldquo;{q}&rdquo;</span></>
                  ) : null}
                </p>
                {useGeoFallback && effectiveState && (
                  <p className="text-xs text-primary-600 mt-1">
                    Showing results near your location
                  </p>
                )}
                {activeBuildingType && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Showing contractors for{' '}
                    <span className="font-medium text-neutral-700">{activeBuildingType}</span>{' '}
                    properties
                  </p>
                )}
                {activeSystemType && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Filtered by system type:{' '}
                    <span className="font-medium text-neutral-700 capitalize">
                      {activeSystemType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="sort-select" className="text-sm text-neutral-600 whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  defaultValue={sort}
                  className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Highest Rated</option>
                  <option value="distance">Nearest First</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="response_time">Response Time</option>
                </select>
              </div>
            </div>

            {/* Contractor list */}
            {contractors.length === 0 ? (
              <div className="text-center py-16">
                <SearchX size={48} className="mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-800 mb-1">No contractors found</h3>
                <p className="text-sm text-neutral-500 max-w-md mx-auto">
                  {locationLabel
                    ? `We don't have any contractors listed in ${locationLabel} yet. Try a nearby city or broaden your search.`
                    : 'Try searching for a specific city or state name.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contractors.map((contractor) => (
                  <ContractorCard key={contractor.id} contractor={contractor} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                  Previous
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-primary-500 text-white'
                        : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                    }`}
                    aria-label={`Page ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* ── Map (desktop) ──────────────────────────────────────────────── */}
          <div className="hidden xl:block w-80 shrink-0">
            <div className="sticky top-6">
              <div className="rounded-xl h-[520px] overflow-hidden border border-neutral-200 shadow-sm">
                <iframe
                  title="Contractor locations"
                  src={`https://maps.google.com/maps?q=commercial+hvac+${encodeURIComponent(effectiveCity || geoFallbackCity)}+${encodeURIComponent(effectiveState)}&z=11&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
