import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Building2, MapPin, Star } from 'lucide-react'
import { SITE_URL } from '@/lib/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import ContactForm from '@/components/ContactForm'

interface Props {
  params: Promise<{ slug: string }>
}

async function getContractor(slug: string) {
  const db = createAdminClient()
  const { data, error } = await db
    .from('contractors')
    .select('id, company_name, slug, city, state, avg_rating, review_count, avg_quote_turnaround_hours, commercial_verified, phone')
    .eq('slug', slug)
    .neq('subscription_status', 'cancelled')
    .single()

  if (error || !data) return null
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const contractor = await getContractor(slug)
  if (!contractor) return { title: 'Contractor Not Found' }

  return {
    title: `Contact ${contractor.company_name} — ${contractor.city}, ${contractor.state}`,
    description: `Request a quote or contact ${contractor.company_name} in ${contractor.city}, ${contractor.state}. Get a response in as little as ${contractor.avg_quote_turnaround_hours ?? 4} hours.`,
    alternates: { canonical: `${SITE_URL}/contractors/${slug}/contact` },
  }
}

export default async function ContactContractorPage({ params }: Props) {
  const { slug } = await params
  const contractor = await getContractor(slug)

  if (!contractor) notFound()

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/contractors/${contractor.slug}`}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm font-medium"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Back to Profile
          </Link>
          <Link href="/" className="flex items-center gap-2 text-neutral-900 hover:text-primary-600 transition-colors">
            <Building2 size={20} className="text-primary-500" aria-hidden="true" />
            <span className="font-semibold text-sm">My HVAC Tech</span>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Contractor summary */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-white">
                {contractor.company_name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-neutral-900 truncate">
                {contractor.company_name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin size={13} aria-hidden="true" />
                  {contractor.city}, {contractor.state}
                </span>
                {contractor.review_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={13} className="text-yellow-400 fill-yellow-400" aria-hidden="true" />
                    {Number(contractor.avg_rating).toFixed(1)} ({contractor.review_count})
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Avg. response in {contractor.avg_quote_turnaround_hours ?? 4} hours
              </p>
            </div>
          </div>
        </div>

        {/* Lead capture form */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="bg-primary-600 px-6 py-5">
            <h2 className="text-lg font-semibold text-white">Request a Quote</h2>
            <p className="text-sm text-primary-200 mt-1">
              Tell {contractor.company_name} about your HVAC needs. Free, no obligation.
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <ContactForm
              contractorId={contractor.id}
              contractorName={contractor.company_name}
            />
          </div>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-4">
          Free for property and facility managers. No spam — ever.
        </p>
      </div>
    </main>
  )
}
