import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Phone, Globe, Share2, CheckCircle, Star, MapPin, Zap,
  Clock, Shield, Camera, Calendar, ExternalLink, ChevronRight,
  Building2, Thermometer, Wrench, Award, ShieldCheck, Users,
  AlertTriangle, ClipboardList, Timer, Cpu
} from 'lucide-react'
import { SITE_NAME, SYSTEM_TYPES, SERVICE_AGREEMENT_TYPES } from '@/lib/constants'
import type { Contractor, Review, ContractorPhoto, SampleProject, GoogleReview } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import RatingStars from '@/components/RatingStars'
import ContractorCard from '@/components/ContractorCard'
import ContactForm from '@/components/ContactForm'
import ContractorProfileTabs from '@/components/ContractorProfileTabs'
import { formatPhoneNumber } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Data Fetching ──────────────────────────────────────────────────────────

async function getContractor(slug: string) {
  const db = createAdminClient()

  // Get the contractor
  const { data: contractor, error } = await db
    .from('contractors')
    .select('*')
    .eq('slug', slug)
    .neq('subscription_status', 'cancelled')
    .single()

  if (error || !contractor) return null

  // Get reviews
  const { data: reviews } = await db
    .from('reviews')
    .select('*')
    .eq('contractor_id', contractor.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20)

  // Get photos
  const { data: photos } = await db
    .from('contractor_photos')
    .select('*')
    .eq('contractor_id', contractor.id)
    .order('sort_order', { ascending: true })

  // Get sample projects
  const { data: sampleProjects } = await db
    .from('sample_projects')
    .select('*')
    .eq('contractor_id', contractor.id)
    .order('sort_order', { ascending: true })

  // Get services via junction table
  const { data: contractorServices } = await db
    .from('contractor_services')
    .select('service_id, services(id, name, slug, category, description, icon)')
    .eq('contractor_id', contractor.id)

  const services = contractorServices
    ?.map((cs: Record<string, unknown>) => cs.services)
    .filter(Boolean) ?? []

  // Get service areas via junction table
  const { data: contractorAreas } = await db
    .from('contractor_service_areas')
    .select('service_area_id, service_areas(id, name, slug, city, state, state_abbr, county, population, meta_title, meta_description)')
    .eq('contractor_id', contractor.id)

  const serviceAreas = contractorAreas
    ?.map((ca: Record<string, unknown>) => ca.service_areas)
    .filter(Boolean) ?? []

  // Parse google_reviews from JSONB if present
  let googleReviews: GoogleReview[] = []
  if (contractor.google_reviews) {
    try {
      googleReviews = typeof contractor.google_reviews === 'string'
        ? JSON.parse(contractor.google_reviews)
        : contractor.google_reviews
    } catch {
      googleReviews = []
    }
  }

  return {
    ...contractor,
    reviews: reviews ?? [],
    photos: photos ?? [],
    sample_projects: sampleProjects ?? [],
    services,
    service_areas: serviceAreas,
    google_reviews: googleReviews,
    // Defaults for optional fields
    system_types: contractor.system_types ?? [],
    building_types_served: contractor.building_types_served ?? [],
    brands_serviced: contractor.brands_serviced ?? [],
    service_agreement_types: contractor.service_agreement_types ?? [],
  }
}

async function getSimilarContractors(contractor: { id: string; city: string; state: string }) {
  const db = createAdminClient()
  const { data } = await db
    .from('contractors')
    .select(`
      id, company_name, slug, short_description, logo_url,
      city, state, avg_rating, review_count, subscription_tier,
      is_verified, is_featured, is_claimed, commercial_verified,
      years_commercial_experience, system_types, building_types_served,
      brands_serviced, emergency_response_minutes, offers_24_7,
      sla_summary, multi_site_coverage, max_sites_supported,
      offers_service_agreements, service_agreement_types,
      dispatch_crm, avg_quote_turnaround_hours, uses_gps_tracking,
      num_technicians, num_nate_certified, metro_area, slot_tier,
      tonnage_range_min, tonnage_range_max, service_radius_miles,
      year_established, license_number, insurance_verified,
      phone, email, website, street_address, zip_code, country,
      subscription_status, created_at, updated_at, owner_id,
      cover_image_url, location, operating_hours, stripe_customer_id,
      stripe_subscription_id, meta_title, meta_description, profile_views,
      commercial_verified
    `)
    .eq('state', contractor.state)
    .neq('id', contractor.id)
    .neq('subscription_status', 'cancelled')
    .order('avg_rating', { ascending: false })
    .limit(2)

  return data ?? []
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const contractor = await getContractor(slug)

  if (!contractor) return { title: 'Contractor Not Found' }

  return {
    title: contractor.meta_title || `${contractor.company_name} — ${contractor.city}, ${contractor.state} | ${SITE_NAME}`,
    description: contractor.meta_description || `View profile, reviews, and contact information for ${contractor.company_name} in ${contractor.city}, ${contractor.state}. ${contractor.review_count} verified reviews.`,
    openGraph: {
      title: contractor.company_name,
      description: contractor.short_description || contractor.meta_description || '',
      type: 'website',
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ContractorProfilePage({ params }: Props) {
  const { slug } = await params
  const contractor = await getContractor(slug)

  if (!contractor) notFound()

  const similarContractors = await getSimilarContractors(contractor)

  const yearsInBusiness = contractor.year_established
    ? new Date().getFullYear() - contractor.year_established
    : null

  // Resolve system type labels
  const systemTypeLabels = contractor.system_types.map((st: string) => {
    const found = SYSTEM_TYPES.find((s) => s.value === st)
    return found ? found.label : st
  })

  // Resolve service agreement labels
  const serviceAgreementLabels = contractor.service_agreement_types.map((sat: string) => {
    const found = SERVICE_AGREEMENT_TYPES.find((s) => s.value === sat)
    return found ? found.label : sat
  })

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HVACBusiness',
    name: contractor.company_name,
    image: contractor.logo_url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contractor.street_address,
      addressLocality: contractor.city,
      addressRegion: contractor.state,
      postalCode: contractor.zip_code,
    },
    telephone: contractor.phone,
    url: contractor.website,
    areaServed: contractor.metro_area || `${contractor.city}, ${contractor.state}`,
    knowsAbout: systemTypeLabels,
    aggregateRating: contractor.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: (contractor.google_rating ?? contractor.avg_rating).toString(),
      reviewCount: ((contractor.google_review_count ?? 0) + contractor.review_count).toString(),
    } : undefined,
    review: contractor.reviews.slice(0, 5).map((r: Review) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.reviewer_name },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating.toString(),
        bestRating: '5',
      },
      reviewBody: r.body,
      datePublished: r.created_at,
    })),
    creator: {
      '@type': 'SoftwareApplication',
      name: 'Perplexity Computer',
      url: 'https://www.perplexity.ai/computer',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-neutral-50">

        {/* ── Cover Image Area ─────────────────────────────────────────────── */}
        <div className="h-48 md:h-56 bg-gradient-to-br from-primary-700 to-primary-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white -translate-x-12 translate-y-12" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="relative -mt-12 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              {/* Logo */}
              <div className="w-24 h-24 rounded-xl border-4 border-white shadow-lg bg-primary-600 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-white">
                  {contractor.company_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
                </span>
              </div>

              <div className="flex-1 pt-2">
                {/* Company name — white while overlapping gradient, dark once past it */}
                <div className="flex flex-wrap items-start gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 font-display">
                    {contractor.company_name}
                  </h1>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {contractor.commercial_verified && (
                      <Badge variant="verified" className="bg-green-100 text-green-800 border-green-200">
                        <ShieldCheck size={11} aria-hidden="true" />
                        Commercial Verified
                      </Badge>
                    )}
                    {contractor.is_verified && (
                      <Badge variant="verified">
                        <CheckCircle size={11} aria-hidden="true" />
                        Verified
                      </Badge>
                    )}
                    {contractor.is_featured && (
                      <Badge variant="featured">
                        <Star size={11} aria-hidden="true" />
                        Featured
                      </Badge>
                    )}
                    {contractor.slot_tier === 'preferred' && (
                      <Badge variant="featured" className="bg-amber-100 text-amber-800 border-amber-200">
                        Preferred Partner
                      </Badge>
                    )}
                    {contractor.slot_tier === 'exclusive' && (
                      <Badge variant="featured" className="bg-red-100 text-red-800 border-red-200">
                        Exclusive Partner
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} aria-hidden="true" />
                    {[contractor.street_address, contractor.city, contractor.state, contractor.zip_code].filter(Boolean).join(', ')}
                  </span>
                  {yearsInBusiness && yearsInBusiness > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar size={13} aria-hidden="true" />
                      Est. {contractor.year_established}
                    </span>
                  )}
                </div>

                {/* Key commercial stats */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600 mb-2">
                  {contractor.years_commercial_experience && (
                    <span className="flex items-center gap-1">
                      <Award size={13} className="text-primary-500" aria-hidden="true" />
                      <span className="font-medium">{contractor.years_commercial_experience} Years Commercial Experience</span>
                    </span>
                  )}
                  {contractor.num_technicians && (
                    <>
                      <span className="text-neutral-300">&middot;</span>
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-primary-500" aria-hidden="true" />
                        <span className="font-medium">{contractor.num_technicians} Technicians</span>
                      </span>
                    </>
                  )}
                  {contractor.num_nate_certified && (
                    <>
                      <span className="text-neutral-300">&middot;</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={13} className="text-green-600" aria-hidden="true" />
                        <span className="font-medium">{contractor.num_nate_certified} NATE Certified</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Emergency response */}
                {(contractor.emergency_response_minutes || contractor.offers_24_7) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600 mb-2">
                    {contractor.emergency_response_minutes && (
                      <span className="flex items-center gap-1 text-red-700 font-medium">
                        <AlertTriangle size={13} aria-hidden="true" />
                        {contractor.emergency_response_minutes}-min Emergency Response
                      </span>
                    )}
                    {contractor.offers_24_7 && (
                      <>
                        <span className="text-neutral-300">&middot;</span>
                        <span className="flex items-center gap-1 text-red-700 font-medium">
                          <Zap size={13} aria-hidden="true" />
                          24/7 Available
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Rating */}
                {contractor.review_count > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars rating={contractor.avg_rating} size="md" />
                    <span className="text-sm font-semibold text-neutral-900">
                      {Number(contractor.avg_rating).toFixed(1)}
                    </span>
                    <span className="text-sm text-neutral-500">
                      ({contractor.review_count} reviews)
                    </span>
                  </div>
                )}

                {/* Google Rating */}
                {contractor.google_rating && (
                  <div className="flex items-center gap-2 mt-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-semibold text-neutral-900">
                      {Number(contractor.google_rating).toFixed(1)}
                    </span>
                    <span className="text-sm text-neutral-500">
                      ({contractor.google_review_count ?? 0} Google reviews)
                    </span>
                    {contractor.google_business_url && (
                      <a
                        href={contractor.google_business_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View on Google
                      </a>
                    )}
                  </div>
                )}

                {/* System type badges */}
                {contractor.system_types.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {contractor.system_types.map((st: string) => {
                      const found = SYSTEM_TYPES.find((s) => s.value === st)
                      const label = found ? found.label.replace(' / ', '/').replace('Rooftop Unit (RTU)', 'RTU').replace('Air Handling Unit (AHU)', 'AHU').replace('Chilled Water / Chiller', 'Chilled Water').replace('VRF / VRV System', 'VRF') : st.toUpperCase()
                      return (
                        <span
                          key={st}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200"
                        >
                          {label}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Action Bar ────────────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 mb-8 pb-6 border-b border-neutral-200">
            <Link
              href={`/get-quotes?contractor=${contractor.id}`}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors"
            >
              <ClipboardList size={16} aria-hidden="true" />
              Request a Quote
            </Link>
            {contractor.phone && (
              <a
                href={`tel:${contractor.phone}`}
                className="inline-flex items-center gap-2 h-12 px-5 rounded-lg border border-neutral-300 bg-white text-neutral-700 font-medium text-sm hover:bg-neutral-50 transition-colors"
              >
                <Phone size={16} aria-hidden="true" />
                {formatPhoneNumber(contractor.phone)}
              </a>
            )}
            {contractor.website && (
              <a
                href={contractor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-12 px-5 rounded-lg border border-neutral-300 bg-white text-neutral-700 font-medium text-sm hover:bg-neutral-50 transition-colors"
              >
                <Globe size={16} aria-hidden="true" />
                Website
                <ExternalLink size={12} className="text-neutral-400" aria-hidden="true" />
              </a>
            )}
            <button
              className="inline-flex items-center gap-2 h-12 px-5 rounded-lg border border-neutral-300 bg-white text-neutral-700 font-medium text-sm hover:bg-neutral-50 transition-colors"
              aria-label="Share this profile"
            >
              <Share2 size={16} aria-hidden="true" />
              Share
            </button>
          </div>

          {/* ── Main Layout ────────────────────────────────────────────────── */}
          <div className="flex flex-col xl:flex-row gap-8 pb-16">

            {/* Main content with tabs */}
            <div className="flex-1 min-w-0">
              <ContractorProfileTabs contractor={contractor} />
            </div>

            {/* Sidebar */}
            <div className="xl:w-96 shrink-0">
              <div className="sticky top-6 space-y-4">
                {/* Quote form */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="bg-primary-600 px-5 py-4">
                    <h2 className="text-base font-semibold text-white">Request a Quote</h2>
                    <p className="text-xs text-primary-200 mt-0.5">
                      Avg. response in {contractor.avg_quote_turnaround_hours ?? 4} hours
                    </p>
                  </div>
                  <div className="p-5">
                    <ContactForm
                      contractorId={contractor.id}
                      contractorName={contractor.company_name}
                      compact
                    />
                  </div>
                </div>

                {/* Commercial Capabilities summary */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-2">
                    <Cpu size={15} className="text-primary-500" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-neutral-900">Commercial Capabilities</h3>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {contractor.emergency_response_minutes && (
                      <div className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-xs text-neutral-500">Emergency Response</span>
                        <span className="text-xs font-semibold text-red-700">
                          {contractor.emergency_response_minutes} min
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-5 py-2.5">
                      <span className="text-xs text-neutral-500">24/7 Availability</span>
                      <span className={`text-xs font-semibold ${contractor.offers_24_7 ? 'text-green-700' : 'text-neutral-400'}`}>
                        {contractor.offers_24_7 ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {contractor.multi_site_coverage && contractor.max_sites_supported && (
                      <div className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-xs text-neutral-500">Multi-Site Coverage</span>
                        <span className="text-xs font-semibold text-neutral-800">
                          Up to {contractor.max_sites_supported} locations
                        </span>
                      </div>
                    )}
                    {contractor.offers_service_agreements && contractor.service_agreement_types.length > 0 && (
                      <div className="flex items-start justify-between px-5 py-2.5 gap-3">
                        <span className="text-xs text-neutral-500 shrink-0">Service Agreements</span>
                        <span className="text-xs font-semibold text-neutral-800 text-right">
                          {serviceAgreementLabels.map((l: string) => l.replace(' (Parts + Labor)', '')).join(', ')}
                        </span>
                      </div>
                    )}
                    {contractor.dispatch_crm && (
                      <div className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-xs text-neutral-500">Dispatch Platform</span>
                        <span className="text-xs font-semibold text-neutral-800">{contractor.dispatch_crm}</span>
                      </div>
                    )}
                    {contractor.avg_quote_turnaround_hours && (
                      <div className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-xs text-neutral-500">Avg Quote Turnaround</span>
                        <span className="text-xs font-semibold text-neutral-800">
                          {contractor.avg_quote_turnaround_hours} hours
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust signals */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-2">
                  {contractor.is_verified && (
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <CheckCircle size={15} className="text-accent-500 shrink-0" aria-hidden="true" />
                      <span>License &amp; insurance verified</span>
                    </div>
                  )}
                  {contractor.insurance_verified && (
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Shield size={15} className="text-accent-500 shrink-0" aria-hidden="true" />
                      <span>Insurance verified</span>
                    </div>
                  )}
                  {(contractor.num_nate_certified ?? 0) > 0 && (
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Award size={15} className="text-accent-500 shrink-0" aria-hidden="true" />
                      <span>{contractor.num_nate_certified} NATE certified technicians</span>
                    </div>
                  )}
                  {contractor.uses_gps_tracking && (
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Timer size={15} className="text-accent-500 shrink-0" aria-hidden="true" />
                      <span>GPS-tracked dispatch fleet</span>
                    </div>
                  )}
                </div>

                {/* Claim This Listing CTA (only for unclaimed) */}
                {!contractor.is_claimed && (
                  <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck size={16} className="text-amber-700" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">Is this your business?</p>
                        <p className="text-xs text-amber-700 mt-0.5 mb-3">
                          Claim this listing to manage your profile, respond to reviews, and receive leads.
                        </p>
                        <Link
                          href={`/for-contractors/claim/${contractor.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
                        >
                          <ShieldCheck size={12} aria-hidden="true" />
                          Claim This Listing
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Reviews */}
                {contractor.google_reviews && contractor.google_reviews.length > 0 && (
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <h3 className="text-sm font-semibold text-neutral-900">Google Reviews</h3>
                      </div>
                      {contractor.google_business_url && (
                        <a
                          href={contractor.google_business_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        >
                          View all <ExternalLink size={10} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {contractor.google_reviews.slice(0, 3).map((review: GoogleReview, i: number) => (
                        <div key={i} className="px-5 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill={star <= review.rating ? 'currentColor' : 'none'}
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  className={star <= review.rating ? 'text-yellow-400' : 'text-neutral-200'}
                                  aria-hidden="true"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs text-neutral-400">{review.relative_time_description}</span>
                          </div>
                          <p className="text-xs text-neutral-600 line-clamp-3">{review.text}</p>
                          <p className="text-xs text-neutral-500 mt-1 font-medium">— {review.author_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Similar Contractors ─────────────────────────────────────────── */}
          {similarContractors.length > 0 && (
            <div className="pb-16">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Similar Contractors in {contractor.state}</h2>
                <Link
                  href={`/search?city=${contractor.city}&state=${contractor.state}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                >
                  View all
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarContractors.map((c) => (
                  <ContractorCard key={c.id} contractor={c as unknown as Contractor} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  )
}
