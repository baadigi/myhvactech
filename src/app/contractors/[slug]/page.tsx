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

// ─── Mock Data ──────────────────────────────────────────────────────────────

function getMockContractor(slug: string): (Contractor & { reviews: Review[]; photos: ContractorPhoto[] }) | null {
  if (slug === '404-not-found-test') return null

  const sampleProjects: SampleProject[] = [
    {
      id: 'proj-1',
      contractor_id: 'mock-1',
      created_at: '2024-03-15T00:00:00Z',
      project_name: 'Downtown Office Tower — Chiller Plant Replacement',
      building_type: 'office',
      description: 'Full replacement of aging 400-ton centrifugal chiller plant serving an 18-story Class A office tower. Scope included two new Trane CenTraVac chillers, primary/secondary pumping redesign, cooling tower tie-in, and Niagara AX controls integration. Project was phased over 6 weekends to maintain tenant occupancy throughout.',
      square_footage: 280000,
      tonnage: 400,
      system_type: 'chilled_water',
      project_type: 'replacement',
      completion_date: '2024-03-01',
      project_value_range: '$250,000–$400,000',
      energy_savings_pct: 28,
      city: 'Phoenix',
      state: 'AZ',
      image_urls: [],
      sort_order: 1,
    },
    {
      id: 'proj-2',
      contractor_id: 'mock-1',
      created_at: '2023-11-20T00:00:00Z',
      project_name: 'WestStar Retail Portfolio — 12-Site Preventive Maintenance Contract',
      building_type: 'retail',
      description: 'Ongoing quarterly PM contract covering 12 retail locations across the Phoenix metro. Each site averages 8,000 sq ft with 4–6 RTUs. ArcticAir performs filter changes, coil cleaning, refrigerant checks, and full controls diagnostics each visit. Emergency callout frequency dropped 80% in year one.',
      square_footage: 96000,
      tonnage: 120,
      system_type: 'rtu',
      project_type: 'maintenance_contract',
      completion_date: null,
      project_value_range: '$50,000–$100,000',
      energy_savings_pct: 15,
      city: 'Phoenix',
      state: 'AZ',
      image_urls: [],
      sort_order: 2,
    },
    {
      id: 'proj-3',
      contractor_id: 'mock-1',
      created_at: '2023-07-10T00:00:00Z',
      project_name: 'Mercy Medical Center — AHU Retrofit & Controls Upgrade',
      building_type: 'healthcare',
      description: 'Retrofit of 6 aging air handling units in a 200-bed medical facility. Project required ICRA compliance, strict infection control protocols, and 24/7 coordination with facilities staff to maintain positive-pressure isolation rooms. New Honeywell Niagara controllers and VFD upgrades resulted in 22% energy reduction.',
      square_footage: 185000,
      tonnage: 260,
      system_type: 'ahu',
      project_type: 'retrofit',
      completion_date: '2023-06-28',
      project_value_range: '$100,000–$250,000',
      energy_savings_pct: 22,
      city: 'Scottsdale',
      state: 'AZ',
      image_urls: [],
      sort_order: 3,
    },
  ]

  return {
    id: 'mock-1',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
    owner_id: null,
    company_name: 'ArcticAir Commercial HVAC',
    slug: slug,
    description: `ArcticAir Commercial HVAC has been the Phoenix metro's most trusted commercial HVAC partner for over two decades. Founded in 2003 by licensed mechanical engineer Daniel Reyes, we've built our reputation on honest pricing, rapid response times, and technical excellence.

We specialize in large-scale commercial systems including rooftop packaged units, chiller plants, and full building automation integration. Our team of 18 NATE-certified technicians handles everything from routine preventive maintenance contracts to emergency system replacements for office parks, hospitals, retail centers, and industrial facilities.

ArcticAir is a certified Carrier Commercial dealer and a certified Trane service provider. We carry $2M in general liability insurance, $1M workers' compensation, and are fully licensed with the Arizona Registrar of Contractors (ROC-245890).`,
    short_description: "Phoenix's premier commercial HVAC contractor. Specializing in RTUs, chillers, and building automation.",
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
    meta_title: `ArcticAir Commercial HVAC — Phoenix, AZ | ${SITE_NAME}`,
    meta_description: "Phoenix's top-rated commercial HVAC company. 20+ years serving office parks, hospitals, and retail. NATE certified, licensed & insured. Request a free quote.",
    avg_rating: 4.8,
    review_count: 142,
    profile_views: 8400,
    // ─── Commercial Fields ────────────────────────────────────────────────
    years_commercial_experience: 21,
    commercial_verified: true,
    system_types: ['rtu', 'vrf', 'chilled_water', 'split_system', 'ahu'],
    brands_serviced: ['Carrier', 'Trane', 'Daikin', 'Honeywell'],
    tonnage_range_min: 5,
    tonnage_range_max: 500,
    building_types_served: ['office', 'retail', 'healthcare', 'industrial'],
    emergency_response_minutes: 60,
    offers_24_7: true,
    sla_summary: '60-minute emergency response guaranteed. Preventive maintenance visits completed within scheduled windows. 98.5% uptime guarantee on full-service contracts.',
    multi_site_coverage: true,
    max_sites_supported: 50,
    offers_service_agreements: true,
    service_agreement_types: ['preventive_maintenance', 'full_service', 'emergency_only'],
    dispatch_crm: 'ServiceTitan',
    avg_quote_turnaround_hours: 4,
    uses_gps_tracking: true,
    num_technicians: 18,
    num_nate_certified: 12,
    metro_area: 'Phoenix-Mesa-Scottsdale',
    slot_tier: 'preferred',
    services: [
      { id: '1', name: 'Commercial AC Repair', slug: 'commercial-ac-repair', category: 'Repair', description: 'Expert commercial AC repair and diagnostics', icon: null },
      { id: '2', name: 'Rooftop Unit (RTU) Service', slug: 'rooftop-unit-service', category: 'Maintenance', description: 'Comprehensive RTU maintenance and repair', icon: null },
      { id: '3', name: 'Chiller Repair & Maintenance', slug: 'chiller-repair-maintenance', category: 'Maintenance', description: 'Full-service chiller plant operations', icon: null },
      { id: '4', name: 'Emergency HVAC Service', slug: 'emergency-hvac-service', category: 'Emergency', description: '24/7 emergency response', icon: null },
      { id: '5', name: 'Building Automation Systems', slug: 'building-automation-systems', category: 'Installation', description: 'BAS integration and programming', icon: null },
      { id: '6', name: 'Preventive Maintenance Plans', slug: 'preventive-maintenance-plans', category: 'Maintenance', description: 'Customized PM contracts', icon: null },
      { id: '7', name: 'Commercial AC Installation', slug: 'commercial-ac-installation', category: 'Installation', description: 'New system design and installation', icon: null },
      { id: '8', name: 'Energy Audits & Retrofits', slug: 'energy-audits-retrofits', category: 'Maintenance', description: 'Energy efficiency consulting', icon: null },
    ],
    service_areas: [
      { id: '1', name: 'Phoenix', slug: 'phoenix', city: 'Phoenix', state: 'Arizona', state_abbr: 'AZ', county: 'Maricopa', population: 1608139, meta_title: null, meta_description: null },
      { id: '2', name: 'Scottsdale', slug: 'scottsdale', city: 'Scottsdale', state: 'Arizona', state_abbr: 'AZ', county: 'Maricopa', population: 258069, meta_title: null, meta_description: null },
      { id: '3', name: 'Tempe', slug: 'tempe', city: 'Tempe', state: 'Arizona', state_abbr: 'AZ', county: 'Maricopa', population: 195805, meta_title: null, meta_description: null },
      { id: '4', name: 'Mesa', slug: 'mesa', city: 'Mesa', state: 'Arizona', state_abbr: 'AZ', county: 'Maricopa', population: 504258, meta_title: null, meta_description: null },
      { id: '5', name: 'Chandler', slug: 'chandler', city: 'Chandler', state: 'Arizona', state_abbr: 'AZ', county: 'Maricopa', population: 261165, meta_title: null, meta_description: null },
      { id: '6', name: 'Gilbert', slug: 'gilbert', city: 'Gilbert', state: 'Arizona', state_abbr: 'AZ', county: 'Maricopa', population: 267918, meta_title: null, meta_description: null },
    ],
    reviews: [
      {
        id: 'r1',
        created_at: '2024-05-12T00:00:00Z',
        contractor_id: 'mock-1',
        reviewer_id: null,
        reviewer_name: 'Michael Torres',
        reviewer_company: 'Emerald Tower Properties',
        reviewer_title: 'VP of Facilities',
        rating: 5,
        title: 'Outstanding chiller plant overhaul',
        body: "ArcticAir replaced the chiller plant in our 18-story office tower. The project was completed two days ahead of schedule with zero tenant disruption. Their pre-commissioning process was incredibly thorough — they identified a secondary pump sizing issue before installation that saved us a costly retrofit down the road. Daniel and his crew are the real deal.",
        is_verified: true,
        response: "Thank you, Michael! The Emerald Tower project was a great collaboration. We're proud of how the new Trane centrifugal system came together. Looking forward to managing your PM contract.",
        response_date: '2024-05-14T00:00:00Z',
        status: 'approved',
        project_type: 'replacement',
        building_type: 'office',
      },
      {
        id: 'r2',
        created_at: '2024-04-03T00:00:00Z',
        contractor_id: 'mock-1',
        reviewer_id: null,
        reviewer_name: 'Sandra Kline',
        reviewer_company: 'WestStar Retail Management',
        reviewer_title: 'Director of Property Operations',
        rating: 5,
        title: "Best PM contract we've ever had",
        body: "We've had ArcticAir on a quarterly PM contract for our 12 retail locations for 3 years. Our emergency callout frequency dropped by 80% in the first year. Their technicians show up on time, document everything thoroughly, and flag potential issues before they become failures. Highly recommend for multi-site operators.",
        is_verified: true,
        response: null,
        response_date: null,
        status: 'approved',
        project_type: 'maintenance_contract',
        building_type: 'retail',
      },
      {
        id: 'r3',
        created_at: '2024-02-28T00:00:00Z',
        contractor_id: 'mock-1',
        reviewer_id: null,
        reviewer_name: 'James Okonkwo',
        reviewer_company: 'Banner Health Facilities',
        reviewer_title: 'Facility Manager',
        rating: 4,
        title: 'Solid emergency response, fair pricing',
        body: 'Called ArcticAir at 11pm for a failed AHU in our medical office building. Tech arrived within 90 minutes, diagnosed the issue quickly, and had a temp fix running within 2 hours. Full repair completed next morning. Emergency pricing was higher than I hoped but fair given the circumstances. Would use again.',
        is_verified: false,
        response: "James, we appreciate the honest feedback. Emergency overnight calls require additional resources, but we always aim to be transparent about pricing upfront. Glad we got your facility back online quickly.",
        response_date: '2024-03-01T00:00:00Z',
        status: 'approved',
        project_type: 'repair',
        building_type: 'healthcare',
      },
      {
        id: 'r4',
        created_at: '2024-01-15T00:00:00Z',
        contractor_id: 'mock-1',
        reviewer_id: null,
        reviewer_name: 'Rachel Nguyen',
        reviewer_company: 'Sunbelt Logistics',
        reviewer_title: 'Operations Manager',
        rating: 5,
        title: 'Designed and installed our entire system',
        body: 'ArcticAir handled the mechanical design and full HVAC installation for our new 80,000 sq ft distribution warehouse. From permit drawings through final commissioning, they were professional, communicative, and thorough. Came in under budget and passed city inspection first try.',
        is_verified: true,
        response: null,
        response_date: null,
        status: 'approved',
        project_type: 'new_installation',
        building_type: 'industrial',
      },
      {
        id: 'r5',
        created_at: '2023-11-08T00:00:00Z',
        contractor_id: 'mock-1',
        reviewer_id: null,
        reviewer_name: 'David Pratt',
        reviewer_company: 'Pinnacle Office Parks',
        reviewer_title: 'Senior Facility Manager',
        rating: 5,
        title: 'Building automation upgrade exceeded expectations',
        body: "Contracted ArcticAir to upgrade our BAS across three office buildings. The new Honeywell system they installed integrates beautifully with our energy management platform. First month energy savings were 22% vs prior year same period. The ROI timeline is even better than projected.",
        is_verified: true,
        response: "David, seeing those energy numbers come in is incredibly rewarding. The occupancy-based scheduling we programmed for your campus was the key driver. Happy to review your year-one performance data whenever you're ready.",
        response_date: '2023-11-10T00:00:00Z',
        status: 'approved',
        project_type: 'retrofit',
        building_type: 'office',
      },
    ],
    photos: [],
    sample_projects: sampleProjects,
  }
}

const SIMILAR_CONTRACTORS: Contractor[] = [
  {
    id: '2',
    created_at: '2021-04-10T00:00:00Z',
    updated_at: '2024-05-15T00:00:00Z',
    owner_id: null,
    company_name: 'Desert Star Mechanical',
    slug: 'desert-star-mechanical',
    description: null,
    short_description: '24/7 emergency commercial HVAC service. Licensed across AZ, NV, and CA.',
    logo_url: null,
    cover_image_url: null,
    website: null,
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
    years_commercial_experience: 14,
    commercial_verified: true,
    system_types: ['rtu', 'split_system', 'heat_pump'],
    brands_serviced: ['Carrier', 'Lennox', 'York'],
    tonnage_range_min: 5,
    tonnage_range_max: 200,
    building_types_served: ['office', 'retail', 'industrial'],
    emergency_response_minutes: 90,
    offers_24_7: true,
    sla_summary: '90-minute emergency response. PM visits within scheduled windows.',
    multi_site_coverage: true,
    max_sites_supported: 20,
    offers_service_agreements: true,
    service_agreement_types: ['preventive_maintenance', 'emergency_only'],
    dispatch_crm: 'BuildOps',
    avg_quote_turnaround_hours: 8,
    uses_gps_tracking: true,
    num_technicians: 10,
    num_nate_certified: 7,
    metro_area: 'Phoenix-Mesa-Scottsdale',
    slot_tier: 'standard',
    services: [
      { id: '4', name: 'Emergency HVAC Service', slug: 'emergency-hvac-service', category: 'Emergency', description: null, icon: null },
      { id: '1', name: 'Commercial AC Repair', slug: 'commercial-ac-repair', category: 'Repair', description: null, icon: null },
    ],
  },
  {
    id: '3',
    created_at: '2019-08-22T00:00:00Z',
    updated_at: '2024-04-30T00:00:00Z',
    owner_id: null,
    company_name: 'Pinnacle Climate Systems',
    slug: 'pinnacle-climate-systems',
    description: null,
    short_description: 'Energy-efficiency specialists. Reduce your utility bills with our retrofit and automation solutions.',
    logo_url: null,
    cover_image_url: null,
    website: null,
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
    years_commercial_experience: 9,
    commercial_verified: false,
    system_types: ['ahu', 'chilled_water', 'vrf'],
    brands_serviced: ['Daikin', 'Mitsubishi', 'Johnson Controls'],
    tonnage_range_min: 10,
    tonnage_range_max: 300,
    building_types_served: ['office', 'education', 'healthcare'],
    emergency_response_minutes: 120,
    offers_24_7: false,
    sla_summary: 'Next-business-day response on standard service calls. Emergency coverage by arrangement.',
    multi_site_coverage: false,
    max_sites_supported: null,
    offers_service_agreements: true,
    service_agreement_types: ['preventive_maintenance', 'full_service'],
    dispatch_crm: 'FieldEdge',
    avg_quote_turnaround_hours: 24,
    uses_gps_tracking: false,
    num_technicians: 6,
    num_nate_certified: 4,
    metro_area: 'Phoenix-Mesa-Scottsdale',
    slot_tier: 'standard',
    services: [
      { id: '6', name: 'Building Automation Systems', slug: 'building-automation-systems', category: 'Installation', description: null, icon: null },
      { id: '7', name: 'Energy Audits & Retrofits', slug: 'energy-audits-retrofits', category: 'Maintenance', description: null, icon: null },
    ],
  },
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const contractor = getMockContractor(slug)

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
  const contractor = getMockContractor(slug)

  if (!contractor) notFound()

  const yearsInBusiness = contractor.year_established
    ? new Date().getFullYear() - contractor.year_established
    : null

  // Resolve system type labels
  const systemTypeLabels = contractor.system_types.map((st) => {
    const found = SYSTEM_TYPES.find((s) => s.value === st)
    return found ? found.label : st
  })

  // Resolve service agreement labels
  const serviceAgreementLabels = contractor.service_agreement_types.map((sat) => {
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
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 33.4942,
      longitude: -111.9261,
    },
    telephone: contractor.phone,
    url: contractor.website,
    areaServed: contractor.metro_area || `${contractor.city}, ${contractor.state}`,
    knowsAbout: systemTypeLabels,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: (contractor.google_rating ?? contractor.avg_rating).toString(),
      reviewCount: ((contractor.google_review_count ?? 0) + contractor.review_count).toString(),
    },
    openingHoursSpecification: contractor.operating_hours
      ? Object.entries(contractor.operating_hours).map(([day, hours]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
          opens: hours.open,
          closes: hours.close,
        }))
      : [],
    review: contractor.reviews.slice(0, 5).map((r) => ({
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
        <div className="h-48 md:h-64 bg-gradient-to-br from-primary-700 to-primary-900 relative overflow-hidden">
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
                  {contractor.company_name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                </span>
              </div>

              <div className="flex-1 pt-2">
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
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} aria-hidden="true" />
                    {contractor.street_address}, {contractor.city}, {contractor.state} {contractor.zip_code}
                  </span>
                  {yearsInBusiness && (
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
                      <span className="text-neutral-300">·</span>
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-primary-500" aria-hidden="true" />
                        <span className="font-medium">{contractor.num_technicians} Technicians</span>
                      </span>
                    </>
                  )}
                  {contractor.num_nate_certified && (
                    <>
                      <span className="text-neutral-300">·</span>
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
                        <span className="text-neutral-300">·</span>
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
                      {contractor.avg_rating.toFixed(1)}
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
                      {contractor.google_rating.toFixed(1)}
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
                    {contractor.system_types.map((st) => {
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
                          {serviceAgreementLabels.map(l => l.replace(' (Parts + Labor)', '')).join(', ')}
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
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Shield size={15} className="text-accent-500 shrink-0" aria-hidden="true" />
                    <span>$2M general liability coverage</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Award size={15} className="text-accent-500 shrink-0" aria-hidden="true" />
                    <span>{contractor.num_nate_certified ?? 0} NATE certified technicians</span>
                  </div>
                  {contractor.uses_gps_tracking && (
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Timer size={15} className="text-accent-500 shrink-0" aria-hidden="true" />
                      <span>GPS-tracked dispatch fleet</span>
                    </div>
                  )}
                </div>

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
          <div className="pb-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Similar Contractors in {contractor.city}</h2>
              <Link
                href={`/search?city=${contractor.city}&state=${contractor.state}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                View all
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SIMILAR_CONTRACTORS.map((c) => (
                <ContractorCard key={c.id} contractor={c} />
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
