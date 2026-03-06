import { Metadata } from 'next'
import { MapPin, ChevronLeft, ChevronRight, ArrowRight, SearchX } from 'lucide-react'
import { SITE_NAME, HVAC_SERVICES, BUILDING_TYPES } from '@/lib/constants'
import type { SearchParams, Contractor, Service } from '@/lib/types'
import ContractorCard from '@/components/ContractorCard'
import SearchBar from '@/components/SearchBar'
import SearchFilters from '@/components/SearchFilters'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'


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
  const city = params.city || ''
  const state = params.state || ''
  const q = params.q || ''
  const currentPage = parseInt(params.page || '1', 10)
  const pageSize = 20
  const sort = params.sort || 'relevance'

  // ── Fetch from Supabase ─────────────────────────────────
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbQuery: any = supabase
    .from('contractors')
    .select('*', { count: 'exact' })

  // Location filter: city (case-insensitive)
  if (city) {
    dbQuery = dbQuery.ilike('city', city)
  }
  if (state) {
    dbQuery = dbQuery.ilike('state', state)
  }

  // Text search on company_name if q provided
  if (q) {
    dbQuery = dbQuery.ilike('company_name', `%${q}%`)
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
    // building_types_served is a text[] column — use overlap
    const types = params.buildingType.split(',')
    dbQuery = dbQuery.overlaps('building_types_served', types)
  }
  if (params.systemType) {
    const types = params.systemType.split(',')
    dbQuery = dbQuery.overlaps('system_types', types)
  }

  // Sort
  if (sort === 'rating') {
    dbQuery = dbQuery.order('avg_rating', { ascending: false })
  } else if (sort === 'reviews') {
    dbQuery = dbQuery.order('review_count', { ascending: false })
  } else if (sort === 'response_time') {
    dbQuery = dbQuery.order('emergency_response_minutes', { ascending: true, nullsFirst: false })
  } else {
    // Default: verified first, then by name
    dbQuery = dbQuery.order('is_verified', { ascending: false }).order('company_name', { ascending: true })
  }

  // Pagination
  const from = (currentPage - 1) * pageSize
  dbQuery = dbQuery.range(from, from + pageSize - 1)

  const { data, count } = await dbQuery

  const contractors: Contractor[] = (data ?? []) as unknown as Contractor[]
  const totalResults = count ?? 0
  const totalPages = Math.ceil(totalResults / pageSize)

  // Resolve active building type label for context header
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
            defaultCity={params.city || ''}
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
                  {city ? (
                    <>{' '}found in{' '}<span className="font-semibold text-neutral-900">{city}{state ? `, ${state}` : ''}</span></>
                  ) : q ? (
                    <>{' '}matching{' '}<span className="font-semibold text-neutral-900">&ldquo;{q}&rdquo;</span></>
                  ) : (
                    <>{' '}found</>
                  )}
                </p>
                {/* Commercial context chips */}
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
                  {city
                    ? `We don't have any contractors listed in ${city}${state ? `, ${state}` : ''} yet. Try a nearby city or broaden your search.`
                    : 'Try searching for a specific city or company name.'}
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
                  src={`https://maps.google.com/maps?q=commercial+hvac+${encodeURIComponent(city)}+${encodeURIComponent(state)}&z=11&output=embed`}
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
