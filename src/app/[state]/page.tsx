import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, ChevronRight, Search, Star, Shield } from 'lucide-react'
import { US_STATES, HVAC_SERVICES, SITE_URL } from '@/lib/constants'
import { FAQSchema, BreadcrumbSchema } from '@/components/SchemaOrg'
import type { Contractor } from '@/lib/types'
import ContractorCard from '@/components/ContractorCard'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ state: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStateData(stateSlug: string) {
  return US_STATES.find(
    (s) => s.name.toLowerCase().replace(/\s+/g, '-') === stateSlug
  ) || null
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

async function getCitiesForState(stateAbbr: string): Promise<string[]> {
  const db = createAdminClient()

  const { data } = await db
    .from('contractors')
    .select('city')
    .ilike('state', stateAbbr)
    .neq('subscription_status', 'cancelled')

  if (!data) return []

  // Deduplicate city names (case-insensitive) and return sorted
  const cityMap = new Map<string, string>()
  for (const row of data) {
    if (row.city) {
      const key = row.city.toLowerCase()
      if (!cityMap.has(key)) {
        cityMap.set(key, row.city)
      }
    }
  }

  return Array.from(cityMap.values()).sort()
}

async function getFeaturedContractors(stateAbbr: string): Promise<Contractor[]> {
  const db = createAdminClient()

  const { data } = await db
    .from('contractors')
    .select('*')
    .ilike('state', stateAbbr)
    .neq('subscription_status', 'cancelled')
    .order('is_verified', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(6)

  return (data ?? []) as unknown as Contractor[]
}

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return US_STATES.map((s) => ({
    state: s.name.toLowerCase().replace(/\s+/g, '-'),
  }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params
  const stateObj = getStateData(state)
  if (!stateObj) return { title: 'Not Found' }

  return {
    title: `Commercial HVAC Contractors in ${stateObj.name}`,
    description: `Find top-rated commercial HVAC contractors in ${stateObj.name}. Compare verified reviews, request free quotes, and hire certified professionals for your building.`,
    alternates: { canonical: `${SITE_URL}/${state}` },
    openGraph: {
      title: `Commercial HVAC Contractors in ${stateObj.name}`,
      description: `Browse ${stateObj.name}'s best commercial HVAC companies. Verified reviews, licensed contractors, free quotes.`,
    },
  }
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function getFAQ(stateName: string, stateAbbr: string) {
  return [
    {
      q: `How do I find a licensed commercial HVAC contractor in ${stateName}?`,
      a: `${stateName} requires commercial HVAC contractors to hold a state contractor's license. Use My HVAC Tech to filter for verified contractors — we confirm license numbers directly with the ${stateAbbr} licensing board. Always verify that the contractor carries general liability insurance and workers' compensation before signing a contract.`,
    },
    {
      q: `What should I expect to pay for commercial HVAC service in ${stateName}?`,
      a: `Commercial HVAC costs in ${stateName} vary significantly based on system type, building size, and service complexity. Routine maintenance contracts typically run $150–$400 per unit per year. Emergency service calls average $300–$800 for diagnosis and basic repairs. System replacements for rooftop units range from $8,000–$35,000 depending on tonnage.`,
    },
    {
      q: `Do commercial HVAC contractors in ${stateName} offer 24/7 emergency service?`,
      a: `Many commercial HVAC contractors in ${stateName} offer 24/7 emergency response, particularly those serving healthcare, food service, and data center clients. Use the "Emergency Service" filter on My HVAC Tech to find contractors with confirmed after-hours availability.`,
    },
    {
      q: `What commercial HVAC certifications should I look for in ${stateName}?`,
      a: `Look for NATE (North American Technician Excellence) certified technicians, which validates hands-on HVAC competency. For refrigerant handling, EPA Section 608 certification is federally required. In ${stateName}, commercial work typically requires a state contractor license. Manufacturer certifications from Carrier, Trane, or Lennox indicate authorized service capability.`,
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StatePage({ params }: Props) {
  const { state } = await params
  const stateObj = getStateData(state)
  if (!stateObj) notFound()

  const [cities, contractors] = await Promise.all([
    getCitiesForState(stateObj.abbr),
    getFeaturedContractors(stateObj.abbr),
  ])

  const faq = getFAQ(stateObj.name, stateObj.abbr)
  const serviceCategories = [
    { name: 'Repair', services: HVAC_SERVICES.filter(s => s.category === 'Repair') },
    { name: 'Installation', services: HVAC_SERVICES.filter(s => s.category === 'Installation') },
    { name: 'Maintenance', services: HVAC_SERVICES.filter(s => s.category === 'Maintenance') },
    { name: 'Emergency', services: HVAC_SERVICES.filter(s => s.category === 'Emergency') },
  ]

  // Pick a default city slug for service links
  const defaultCitySlug = cities[0]
    ? cities[0].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : ''

  return (
    <main className="min-h-screen bg-neutral-50">
      <FAQSchema items={faq.map(f => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE_URL },
        { name: stateObj.name, url: `${SITE_URL}/${state}` },
      ]} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-600 transition-colors">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-neutral-700">{stateObj.name}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-4">
            Commercial HVAC Contractors in {stateObj.name}
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            Browse {stateObj.name}&apos;s top-rated commercial HVAC companies. Whether you manage a single office building or a portfolio of industrial facilities, My HVAC Tech connects you with licensed, insured contractors who specialize in commercial systems.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-sm text-neutral-600">
            <span className="flex items-center gap-1.5">
              <Star size={14} className="text-warning" aria-hidden="true" />
              Verified reviews
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={14} className="text-accent-500" aria-hidden="true" />
              License &amp; insurance checked
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-primary-500" aria-hidden="true" />
              Serving all of {stateObj.abbr}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Cities Grid ───────────────────────────────────────────────── */}
        {cities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-5">
              Browse by City in {stateObj.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {cities.map((city) => {
                const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                return (
                  <Link
                    key={city}
                    href={`/${state}/${citySlug}`}
                    className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all group"
                  >
                    <MapPin size={13} className="text-neutral-400 group-hover:text-primary-500 shrink-0" aria-hidden="true" />
                    {city}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Featured Contractors ────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-neutral-900">
              Featured Contractors in {stateObj.name}
            </h2>
            <Link
              href={`/search?state=${stateObj.abbr}`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {contractors.length > 0 ? (
            <div className="space-y-3">
              {contractors.map((contractor) => (
                <ContractorCard key={contractor.id} contractor={contractor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
              <Search size={32} className="mx-auto text-neutral-300 mb-3" aria-hidden="true" />
              <p className="text-neutral-600 font-medium mb-1">No contractors listed in {stateObj.name} yet</p>
              <p className="text-sm text-neutral-400">We&apos;re expanding our coverage. Check back soon.</p>
            </div>
          )}

          {contractors.length > 0 && (
            <div className="mt-4 text-center">
              <Link
                href={`/search?state=${stateObj.abbr}`}
                className="inline-flex items-center gap-2 bg-primary-500 text-white font-medium text-sm px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Search size={15} aria-hidden="true" />
                Search All {stateObj.name} Contractors
              </Link>
            </div>
          )}
        </section>

        {/* ── Services in State ────────────────────────────────────────── */}
        {defaultCitySlug && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-5">
              Commercial HVAC Services in {stateObj.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {serviceCategories.map(({ name, services }) => (
                <div key={name}>
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">{name}</h3>
                  <div className="space-y-1">
                    {services.map((svc) => (
                      <Link
                        key={svc.slug}
                        href={`/${state}/${defaultCitySlug}/${svc.slug}`}
                        className="flex items-center gap-2 text-sm text-neutral-700 hover:text-primary-600 py-1 transition-colors"
                      >
                        <ChevronRight size={12} className="text-neutral-300 shrink-0" aria-hidden="true" />
                        {svc.name} in {stateObj.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Frequently Asked Questions — Commercial HVAC in {stateObj.name}
          </h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">{item.q}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
