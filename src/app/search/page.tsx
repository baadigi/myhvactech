import { Metadata } from 'next'
import { MapPin, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { SITE_NAME, HVAC_SERVICES, BUILDING_TYPES } from '@/lib/constants'
import type { SearchParams, Contractor, Service } from '@/lib/types'
import ContractorCard from '@/components/ContractorCard'
import SearchBar from '@/components/SearchBar'
import SearchFilters from '@/components/SearchFilters'
import Link from 'next/link'

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Commercial AC Repair', slug: 'commercial-ac-repair', category: 'Repair', description: null, icon: null },
  { id: '2', name: 'Rooftop Unit (RTU) Service', slug: 'rooftop-unit-service', category: 'Maintenance', description: null, icon: null },
  { id: '3', name: 'Preventive Maintenance Plans', slug: 'preventive-maintenance-plans', category: 'Maintenance', description: null, icon: null },
  { id: '4', name: 'Emergency HVAC Service', slug: 'emergency-hvac-service', category: 'Emergency', description: null, icon: null },
]

const MOCK_CONTRACTORS: Contractor[] = [
  {
    id: '1',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    owner_id: null,
    company_name: 'ArcticAir Commercial HVAC',
    slug: 'arcticair-commercial-hvac',
    description: 'ArcticAir has served the Phoenix metro commercial market for over 20 years. We specialize in rooftop units, chillers, and full building automation systems for office parks, hospitals, and retail centers.',
    short_description: 'Phoenix\'s premier commercial HVAC contractor. Specializing in RTUs, chillers, and building automation for office, medical, and retail properties.',
    logo_url: null,
    cover_image_url: null,
    website: 'https://arcticairhvac.example.com',
    phone: '4805550182',
    email: 'service@arcticairhvac.example.com',
    street_address: '1420 E University Dr',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85034',
    country: 'US',
    location: null,
    service_radius_miles: 75,
    year_established: 2003,
    license_number: 'AZ-ROC-245890',
    insurance_verified: true,
    is_verified: true,
    is_claimed: true,
    is_featured: true,
    operating_hours: {
      monday: { open: '07:00', close: '18:00' },
      tuesday: { open: '07:00', close: '18:00' },
      wednesday: { open: '07:00', close: '18:00' },
      thursday: { open: '07:00', close: '18:00' },
      friday: { open: '07:00', close: '17:00' },
      saturday: { open: '08:00', close: '14:00' },
    },
    subscription_tier: 'gold',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: 'active',
    meta_title: null,
    meta_description: null,
    avg_rating: 4.8,
    review_count: 142,
    profile_views: 8400,
    distance_miles: 3.2,
    services: MOCK_SERVICES,
    // ── Commercial fields ──────────────────────────────────────────────────
    years_commercial_experience: 22,
    commercial_verified: true,
    system_types: ['rtu', 'chilled_water', 'ahu', 'vrf'],
    brands_serviced: ['Carrier', 'Trane', 'Johnson Controls', 'Daikin'],
    tonnage_range_min: 5,
    tonnage_range_max: 800,
    building_types_served: ['office', 'healthcare', 'retail', 'industrial', 'government'],
    emergency_response_minutes: 60,
    offers_24_7: true,
    sla_summary: '4-hour response SLA. 24/7 emergency dispatch. Dedicated account manager for multi-site portfolios.',
    multi_site_coverage: true,
    max_sites_supported: 50,
    offers_service_agreements: true,
    service_agreement_types: ['preventive_maintenance', 'full_service', 'parts_labor'],
    dispatch_crm: 'ServiceTitan',
    avg_quote_turnaround_hours: 2,
    uses_gps_tracking: true,
    num_technicians: 38,
    num_nate_certified: 24,
    metro_area: 'Phoenix, AZ',
    slot_tier: 'exclusive',
  },
  {
    id: '2',
    created_at: '2021-04-10T00:00:00Z',
    updated_at: '2024-05-15T00:00:00Z',
    owner_id: null,
    company_name: 'Desert Star Mechanical',
    slug: 'desert-star-mechanical',
    description: 'Full-service commercial HVAC for the Southwest. Licensed in AZ, NV, and CA. 24/7 emergency response with a dedicated dispatch team and GPS-tracked fleet.',
    short_description: '24/7 emergency commercial HVAC service. Licensed across AZ, NV, and CA. Competitive rates with same-day response.',
    logo_url: null,
    cover_image_url: null,
    website: 'https://desertstar.example.com',
    phone: '6025550341',
    email: null,
    street_address: '8800 N 19th Ave',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85021',
    country: 'US',
    location: null,
    service_radius_miles: 100,
    year_established: 2010,
    license_number: 'AZ-ROC-312045',
    insurance_verified: true,
    is_verified: true,
    is_claimed: true,
    is_featured: false,
    operating_hours: null,
    subscription_tier: 'silver',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: 'active',
    meta_title: null,
    meta_description: null,
    avg_rating: 4.5,
    review_count: 89,
    profile_views: 3200,
    distance_miles: 7.1,
    services: [
      { id: '4', name: 'Emergency HVAC Service', slug: 'emergency-hvac-service', category: 'Emergency', description: null, icon: null },
      { id: '1', name: 'Commercial AC Repair', slug: 'commercial-ac-repair', category: 'Repair', description: null, icon: null },
      { id: '5', name: 'Commercial Heating Repair', slug: 'commercial-heating-repair', category: 'Repair', description: null, icon: null },
    ],
    // ── Commercial fields ──────────────────────────────────────────────────
    years_commercial_experience: 15,
    commercial_verified: true,
    system_types: ['rtu', 'split_system', 'heat_pump', 'boiler'],
    brands_serviced: ['Rheem/Ruud', 'Lennox', 'York', 'Goodman/Amana', 'Carrier'],
    tonnage_range_min: 3,
    tonnage_range_max: 250,
    building_types_served: ['retail', 'restaurant', 'industrial', 'multifamily', 'office'],
    emergency_response_minutes: 45,
    offers_24_7: true,
    sla_summary: '45-min emergency response. Same-day service for most repairs. Licensed in AZ, NV, CA.',
    multi_site_coverage: true,
    max_sites_supported: 20,
    offers_service_agreements: true,
    service_agreement_types: ['preventive_maintenance', 'emergency_only'],
    dispatch_crm: 'BuildOps',
    avg_quote_turnaround_hours: 4,
    uses_gps_tracking: true,
    num_technicians: 22,
    num_nate_certified: 14,
    metro_area: 'Phoenix, AZ',
    slot_tier: 'preferred',
  },
  {
    id: '3',
    created_at: '2019-08-22T00:00:00Z',
    updated_at: '2024-04-30T00:00:00Z',
    owner_id: null,
    company_name: 'Pinnacle Climate Systems',
    slug: 'pinnacle-climate-systems',
    description: 'Specializing in energy-efficient HVAC retrofits, VRF system design, and building automation for office campuses and data centers. Our engineers hold LEED AP and CEM certifications.',
    short_description: 'Energy-efficiency specialists for commercial buildings. Reduce your utility bills with our retrofit and automation solutions.',
    logo_url: null,
    cover_image_url: null,
    website: 'https://pinnacleclimate.example.com',
    phone: '4805550978',
    email: null,
    street_address: '3301 S 32nd St',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85040',
    country: 'US',
    location: null,
    service_radius_miles: 50,
    year_established: 2015,
    license_number: 'AZ-ROC-398210',
    insurance_verified: true,
    is_verified: false,
    is_claimed: true,
    is_featured: false,
    operating_hours: null,
    subscription_tier: 'bronze',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: 'active',
    meta_title: null,
    meta_description: null,
    avg_rating: 4.3,
    review_count: 54,
    profile_views: 1800,
    distance_miles: 11.4,
    services: [
      { id: '6', name: 'Building Automation Systems', slug: 'building-automation-systems', category: 'Installation', description: null, icon: null },
      { id: '7', name: 'Energy Audits & Retrofits', slug: 'energy-audits-retrofits', category: 'Maintenance', description: null, icon: null },
      { id: '2', name: 'Rooftop Unit (RTU) Service', slug: 'rooftop-unit-service', category: 'Maintenance', description: null, icon: null },
    ],
    // ── Commercial fields ──────────────────────────────────────────────────
    years_commercial_experience: 10,
    commercial_verified: false,
    system_types: ['vrf', 'chilled_water', 'ahu', 'cooling_tower'],
    brands_serviced: ['Daikin', 'Mitsubishi', 'Bosch', 'Johnson Controls'],
    tonnage_range_min: 20,
    tonnage_range_max: 1200,
    building_types_served: ['office', 'data_center', 'education', 'government'],
    emergency_response_minutes: 120,
    offers_24_7: false,
    sla_summary: 'Scheduled maintenance contracts with annual energy benchmarking. 48-hour non-emergency response.',
    multi_site_coverage: false,
    max_sites_supported: null,
    offers_service_agreements: true,
    service_agreement_types: ['preventive_maintenance', 'full_service'],
    dispatch_crm: 'FieldEdge',
    avg_quote_turnaround_hours: 24,
    uses_gps_tracking: false,
    num_technicians: 11,
    num_nate_certified: 7,
    metro_area: 'Phoenix, AZ',
    slot_tier: 'standard',
  },
  {
    id: '4',
    created_at: '2020-02-14T00:00:00Z',
    updated_at: '2024-03-10T00:00:00Z',
    owner_id: null,
    company_name: 'Sonoran HVAC Solutions',
    slug: 'sonoran-hvac-solutions',
    description: 'Family-owned commercial HVAC serving the greater Phoenix and Scottsdale area. Specializing in multifamily, hospitality, and restaurant HVAC. Honest pricing, no upsells.',
    short_description: 'Family-owned, 15 years experience. Serving Phoenix, Scottsdale, Tempe, and surrounding cities with prompt, reliable commercial HVAC service.',
    logo_url: null,
    cover_image_url: null,
    website: null,
    phone: '4805550613',
    email: null,
    street_address: '7120 E Camelback Rd',
    city: 'Scottsdale',
    state: 'AZ',
    zip_code: '85251',
    country: 'US',
    location: null,
    service_radius_miles: 40,
    year_established: 2009,
    license_number: null,
    insurance_verified: false,
    is_verified: false,
    is_claimed: false,
    is_featured: false,
    operating_hours: null,
    subscription_tier: 'free',
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: 'inactive',
    meta_title: null,
    meta_description: null,
    avg_rating: 4.1,
    review_count: 28,
    profile_views: 890,
    distance_miles: 14.8,
    services: [
      { id: '1', name: 'Commercial AC Repair', slug: 'commercial-ac-repair', category: 'Repair', description: null, icon: null },
      { id: '3', name: 'Preventive Maintenance Plans', slug: 'preventive-maintenance-plans', category: 'Maintenance', description: null, icon: null },
    ],
    // ── Commercial fields ──────────────────────────────────────────────────
    years_commercial_experience: 15,
    commercial_verified: false,
    system_types: ['rtu', 'split_system', 'ptac'],
    brands_serviced: ['Carrier', 'Trane', 'Heil', 'Bard'],
    tonnage_range_min: 1,
    tonnage_range_max: 60,
    building_types_served: ['multifamily', 'hospitality', 'restaurant', 'retail'],
    emergency_response_minutes: 90,
    offers_24_7: false,
    sla_summary: 'Same-day service for existing customers. Best-effort emergency response.',
    multi_site_coverage: false,
    max_sites_supported: null,
    offers_service_agreements: false,
    service_agreement_types: [],
    dispatch_crm: null,
    avg_quote_turnaround_hours: 8,
    uses_gps_tracking: false,
    num_technicians: 6,
    num_nate_certified: 3,
    metro_area: 'Phoenix, AZ',
    slot_tier: null,
  },
]

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
  const city = params.city || 'Phoenix'
  const state = params.state || 'AZ'
  const currentPage = parseInt(params.page || '1', 10)

  // ── Client-side filtering would happen via server action / API in production ──
  // For now, apply mock filtering to demonstrate the UX
  let contractors = MOCK_CONTRACTORS

  // Sort
  const sort = params.sort || 'relevance'
  if (sort === 'rating') {
    contractors = [...contractors].sort((a, b) => b.avg_rating - a.avg_rating)
  } else if (sort === 'distance') {
    contractors = [...contractors].sort((a, b) => (a.distance_miles ?? 999) - (b.distance_miles ?? 999))
  } else if (sort === 'reviews') {
    contractors = [...contractors].sort((a, b) => b.review_count - a.review_count)
  } else if (sort === 'response_time') {
    contractors = [...contractors].sort(
      (a, b) =>
        (a.emergency_response_minutes ?? 9999) - (b.emergency_response_minutes ?? 9999)
    )
  }

  const totalResults = contractors.length
  const totalPages = Math.ceil(totalResults / 10)

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
                  <span className="font-semibold text-neutral-900">{totalResults} contractors</span>
                  {' '}found in{' '}
                  <span className="font-semibold text-neutral-900">{city}, {state}</span>
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
            <div className="space-y-3">
              {contractors.map((contractor) => (
                <ContractorCard key={contractor.id} contractor={contractor} />
              ))}
            </div>

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
