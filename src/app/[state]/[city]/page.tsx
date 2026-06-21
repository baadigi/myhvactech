import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, ChevronRight, Shield, Star, Clock, CheckCircle, Search, Building2 } from 'lucide-react'
import { US_STATES, HVAC_SERVICES, SYSTEM_TYPES, SITE_URL } from '@/lib/constants'
import { FAQSchema, BreadcrumbSchema, ItemListSchema } from '@/components/SchemaOrg'
import type { Contractor } from '@/lib/types'
import ContractorCard from '@/components/ContractorCard'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRADE_KEY } from '@/lib/trade-scope'

// ISR: cache rendered pages at the edge, refresh hourly. These pages read only
// public service-role data (no per-request state), so they're safe to cache.
export const revalidate = 3600

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ state: string; city: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCityName(citySlug: string): string {
  return citySlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function getStateObj(stateSlug: string) {
  return US_STATES.find(
    (s) => s.name.toLowerCase().replace(/\s+/g, '-') === stateSlug
  ) || null
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

async function getContractorsForCity(city: string, stateAbbr: string, stateName: string): Promise<Contractor[]> {
  const db = createAdminClient()

  // State is stored inconsistently (e.g. "CA" and "California") — match both.
  const { data } = await db
    .from('contractors')
    .select('*')
    .eq('trade', TRADE_KEY)
    .ilike('city', city)
    .or(`state.ilike.${stateAbbr},state.ilike.${stateName}`)
    .neq('subscription_status', 'cancelled')
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false })
    .limit(20)

  return (data ?? []) as unknown as Contractor[]
}

async function getNearbyCities(city: string, stateAbbr: string, stateName: string): Promise<string[]> {
  const db = createAdminClient()

  const { data } = await db
    .from('contractors')
    .select('city')
    .eq('trade', TRADE_KEY)
    .or(`state.ilike.${stateAbbr},state.ilike.${stateName}`)
    .neq('subscription_status', 'cancelled')

  if (!data) return []

  // Get unique city names that aren't the current city
  const citySet = new Set<string>()
  for (const row of data) {
    if (row.city && row.city.toLowerCase() !== city.toLowerCase()) {
      citySet.add(row.city)
    }
  }

  // Return up to 8 nearby cities, sorted alphabetically
  return Array.from(citySet).sort().slice(0, 8)
}

// ─── Derived city stats (real data only — no fabricated metrics) ──────────────

function getCityStats(contractors: Contractor[]) {
  const rated = contractors.filter(
    (c) => c.google_rating != null && (c.google_review_count ?? 0) > 0
  )
  const totalReviews = rated.reduce((s, c) => s + (c.google_review_count ?? 0), 0)
  const avgRating = totalReviews
    ? rated.reduce((s, c) => s + (c.google_rating ?? 0) * (c.google_review_count ?? 0), 0) / totalReviews
    : 0
  const emergency = contractors.filter((c) => c.offers_24_7).length

  const systemSet = new Set<string>()
  for (const c of contractors) for (const s of c.system_types ?? []) systemSet.add(s)
  const systemLabels = Array.from(systemSet)
    .map((v) => SYSTEM_TYPES.find((s) => s.value === v)?.label ?? v)

  return {
    count: contractors.length,
    ratedCount: rated.length,
    totalReviews,
    avgRating,
    emergency,
    systemLabels,
  }
}

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return []
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params
  const cityName = formatCityName(city)
  const stateObj = getStateObj(state)
  const stateDisplay = stateObj?.abbr || state.toUpperCase()

  return {
    title: `Best Commercial HVAC Contractors in ${cityName}, ${stateDisplay}`,
    description: `Find and compare the best commercial HVAC contractors in ${cityName}, ${stateDisplay}. Verified reviews, licensed professionals, free quotes for your commercial property.`,
    alternates: { canonical: `${SITE_URL}/${state}/${city}` },
    openGraph: {
      title: `Commercial HVAC Contractors in ${cityName}, ${stateDisplay}`,
      description: `Top-rated commercial HVAC companies in ${cityName}. Read reviews and get free quotes.`,
    },
  }
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function getFAQ(city: string, stateAbbr: string) {
  return [
    {
      q: `How much does commercial HVAC service cost in ${city}?`,
      a: `Commercial HVAC costs in ${city} depend on the system type and scope of work. Routine service calls typically run $150–$400. Preventive maintenance contracts for a single rooftop unit average $200–$500/year. Full system replacements range from $8,000 for small packaged units to $100,000+ for large chiller plants.`,
    },
    {
      q: `How do I find a reliable commercial HVAC contractor in ${city}, ${stateAbbr}?`,
      a: `Start by verifying the contractor holds a current state license and carries adequate insurance. Check reviews from other commercial property managers on My HVAC Tech. Ask for references from similar properties (office, retail, industrial). Get at least three written quotes for any major project.`,
    },
    {
      q: `Do ${city} commercial HVAC contractors offer emergency service?`,
      a: `Yes, many commercial HVAC contractors in ${city} offer 24/7 emergency response. Response times vary — the best operators typically arrive within 2–4 hours for critical failures. Always confirm after-hours rates upfront, as emergency service typically carries a surcharge.`,
    },
    {
      q: `What's the best time of year to schedule HVAC maintenance in ${city}?`,
      a: `For cooling systems, schedule spring tune-ups in March–April before peak demand season. For heating systems, fall service in September–October ensures readiness. Scheduling preventive maintenance during off-peak periods gives you faster scheduling and sometimes lower rates.`,
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CityPage({ params }: Props) {
  const { state, city } = await params
  const cityName = formatCityName(city)
  const stateObj = getStateObj(state)
  if (!stateObj) notFound()

  const [contractors, nearbyCities] = await Promise.all([
    getContractorsForCity(cityName, stateObj.abbr, stateObj.name),
    getNearbyCities(cityName, stateObj.abbr, stateObj.name),
  ])

  const stats = getCityStats(contractors)
  const contractorCount = stats.count

  const faq = [
    ...(stats.ratedCount
      ? [{
          q: `How many commercial HVAC contractors are in ${cityName}, ${stateObj.abbr}?`,
          a: `My HVAC Tech lists ${stats.count} commercial HVAC contractors serving ${cityName}, ${stateObj.abbr}, with a combined ${stats.totalReviews.toLocaleString()} Google reviews averaging ${stats.avgRating.toFixed(1)} stars.${stats.emergency ? ` ${stats.emergency} of them offer 24/7 emergency service.` : ''}`,
        }]
      : []),
    ...getFAQ(cityName, stateObj.abbr),
  ]

  // Unique, data-driven intro sentence (varies by real numbers + local system mix).
  const reviewLine = stats.ratedCount
    ? ` carrying a combined ${stats.totalReviews.toLocaleString()} Google reviews at an average of ${stats.avgRating.toFixed(1)} stars`
    : ''
  const emergencyLine = stats.emergency
    ? ` ${stats.emergency} offer 24/7 emergency response.`
    : ''
  const systemLine = stats.systemLabels.length
    ? ` Local crews service ${stats.systemLabels.slice(0, 4).join(', ')}${stats.systemLabels.length > 4 ? ', and more' : ''}.`
    : ''

  return (
    <main className="min-h-screen bg-neutral-50">
      <FAQSchema items={faq.map(f => ({ question: f.q, answer: f.a }))} />
      {contractors.length > 0 && (
        <ItemListSchema items={contractors.map((c) => ({
          name: c.company_name,
          url: `${SITE_URL}/contractors/${c.slug}`,
        }))} />
      )}
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE_URL },
        { name: stateObj.name, url: `${SITE_URL}/${state}` },
        { name: cityName, url: `${SITE_URL}/${state}/${city}` },
      ]} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-600 transition-colors">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href={`/${state}`} className="hover:text-neutral-600 transition-colors">{stateObj.name}</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-neutral-700">{cityName}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-4">
            Best Commercial HVAC Contractors in {cityName}, {stateObj.abbr}
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            Compare {contractorCount} commercial HVAC {contractorCount === 1 ? 'company' : 'companies'} serving {cityName}, {stateObj.abbr}
            {reviewLine}.{emergencyLine}{systemLine} Request free quotes and hire the right contractor for your building.
          </p>
          <div className="flex flex-wrap gap-3 mt-5 text-sm text-neutral-600">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-primary-500" aria-hidden="true" />
              {contractorCount} commercial contractor{contractorCount !== 1 ? 's' : ''}
            </span>
            {stats.ratedCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Star size={14} className="text-warning" aria-hidden="true" />
                {stats.avgRating.toFixed(1)}★ avg · {stats.totalReviews.toLocaleString()} Google reviews
              </span>
            )}
            {stats.emergency > 0 && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-neutral-400" aria-hidden="true" />
                {stats.emergency} offer 24/7 emergency
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Contractor Listings ──────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-neutral-900">
              Commercial HVAC Contractors in {cityName}
            </h2>
            <Link
              href={`/search?city=${cityName}&state=${stateObj.abbr}`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {contractorCount > 0 ? (
            <div className="space-y-3">
              {contractors.map((c) => (
                <ContractorCard key={c.id} contractor={c} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
              <Search size={32} className="mx-auto text-neutral-300 mb-3" aria-hidden="true" />
              <p className="text-neutral-600 font-medium mb-1">No contractors listed in {cityName} yet</p>
              <p className="text-sm text-neutral-400 mb-4">
                We&apos;re expanding our coverage. Check back soon or search nearby cities.
              </p>
              <Link
                href={`/search?state=${stateObj.abbr}`}
                className="inline-flex items-center gap-2 bg-primary-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Search size={14} aria-hidden="true" />
                Search all {stateObj.name} contractors
              </Link>
            </div>
          )}
        </section>

        {/* ── Services in City ─────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Commercial HVAC Services Available in {cityName}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HVAC_SERVICES.map((svc) => (
              <Link
                key={svc.slug}
                href={`/${state}/${city}/${svc.slug}`}
                className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-700 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all group"
              >
                <ChevronRight size={12} className="text-neutral-300 group-hover:text-primary-500 shrink-0" aria-hidden="true" />
                <span className="leading-tight">{svc.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Why Choose My HVAC Tech ───────────────────────────────────── */}
        <section className="mb-12 bg-primary-600 rounded-2xl p-8 text-white">
          <h2 className="text-xl font-bold mb-6">Why Choose My HVAC Tech in {cityName}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: <Building2 size={18} aria-hidden="true" />, title: 'Commercial-Focused Only', desc: 'Every contractor listed works on commercial buildings — RTUs, chillers, VRF — not residential.' },
              { icon: <Star size={18} aria-hidden="true" />, title: 'Real Google Reviews', desc: 'Ratings pulled from verified Google Business Profiles — not anonymous form submissions.' },
              { icon: <Clock size={18} aria-hidden="true" />, title: 'Compare in One Place', desc: 'Side-by-side systems serviced, ratings, and contact info — no calling around.' },
              { icon: <Shield size={18} aria-hidden="true" />, title: 'Free to Use', desc: 'No cost to search, compare, or request quotes. Ever.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 text-primary-200 shrink-0">{icon}</div>
                <div>
                  <p className="font-semibold text-sm text-white">{title}</p>
                  <p className="text-sm text-primary-200 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Nearby Cities ────────────────────────────────────────────── */}
        {nearbyCities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Nearby Cities
            </h2>
            <div className="flex flex-wrap gap-2">
              {nearbyCities.map((nearbyCity) => {
                const nearbySlug = nearbyCity.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                return (
                  <Link
                    key={nearbyCity}
                    href={`/${state}/${nearbySlug}`}
                    className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                  >
                    {nearbyCity}, {stateObj.abbr}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Frequently Asked Questions — Commercial HVAC in {cityName}
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
