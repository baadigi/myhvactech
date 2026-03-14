import { Metadata } from 'next'
import Link from 'next/link'
import { Search, Building2, ArrowRight, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Claim Your Listing',
  description:
    'Find and claim your commercial HVAC business listing on My HVAC Tech. Verify ownership to manage your profile, respond to reviews, and receive leads from property managers.',
  alternates: { canonical: `${SITE_URL}/for-contractors/claim` },
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function ClaimIndexPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params.q?.trim() || ''

  // Search contractors if query provided
  let contractors: { id: string; company_name: string; city: string; state: string; slug: string; is_claimed: boolean }[] = []

  if (query.length >= 2) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('contractors')
      .select('id, company_name, city, state, slug, is_claimed')
      .ilike('company_name', `%${query}%`)
      .order('company_name')
      .limit(20)

    contractors = data || []
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 py-16 px-4 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-700/60 border border-primary-500/40 rounded-full px-4 py-1.5 text-sm text-primary-200 mb-5">
            <Shield size={14} aria-hidden="true" />
            Claim Your Business
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-3">
            Claim Your Listing
          </h1>
          <p className="text-primary-200 text-base max-w-lg mx-auto">
            Search for your company below. Claiming your listing lets you manage your profile, respond to reviews, and receive leads from property managers.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="px-4 -mt-6">
        <div className="max-w-2xl mx-auto">
          <form action="/for-contractors/claim" method="GET">
            <div className="flex items-center bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
              <div className="flex items-center gap-2 flex-1 px-4 py-3.5">
                <Search size={18} className="text-neutral-400 shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by company name…"
                  className="w-full text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3.5 bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {query.length >= 2 ? (
            contractors.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-500 mb-4">
                  <span className="font-semibold text-neutral-900">{contractors.length}</span> result{contractors.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                </p>
                {contractors.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                        <Building2 size={18} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{c.company_name}</p>
                        <p className="text-xs text-neutral-500">{c.city}, {c.state}</p>
                      </div>
                    </div>
                    {c.is_claimed ? (
                      <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-3 py-1.5 rounded-lg shrink-0">
                        Already claimed
                      </span>
                    ) : (
                      <Link
                        href={`/for-contractors/claim/${c.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg transition-colors shrink-0"
                      >
                        Claim
                        <ArrowRight size={12} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 size={32} className="mx-auto text-neutral-300 mb-3" aria-hidden="true" />
                <p className="text-sm font-medium text-neutral-600">
                  No listings found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  Your business may not be listed yet. Register for free to create your profile.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  Register Your Business
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Search size={32} className="mx-auto text-neutral-300 mb-3" aria-hidden="true" />
              <p className="text-sm text-neutral-500">
                Enter your company name above to find your listing
              </p>
            </div>
          )}

          {/* CTA: not listed? */}
          {query.length >= 2 && contractors.length > 0 && (
            <div className="mt-8 bg-primary-50 border border-primary-200 rounded-xl p-5 text-center">
              <p className="text-sm text-primary-800 font-medium">
                Don&apos;t see your business?
              </p>
              <p className="text-xs text-primary-600 mt-1">
                Create a free listing and start receiving leads from property managers.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2.5 rounded-lg transition-colors"
              >
                Register for Free
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
