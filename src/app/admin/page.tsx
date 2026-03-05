import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_TIERS } from '@/lib/constants'

const TIER_BADGE: Record<string, string> = {
  free: 'bg-neutral-100 text-neutral-600',
  bronze: 'bg-amber-50 text-amber-700 border border-amber-200',
  silver: 'bg-neutral-100 text-neutral-600 border border-neutral-300',
  gold: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
}

function StatCard({ label, value, sub, href }: { label: string; value: string | number; sub?: string; href?: string }) {
  const content = (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 transition-colors">
      <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-3xl font-bold text-neutral-900 leading-none">{value}</div>
      {sub && <div className="text-xs text-neutral-400 mt-1.5">{sub}</div>}
    </div>
  )
  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

export default async function AdminPage() {
  const supabase = await createClient()

  // Fetch all stats in parallel
  const [
    contractorsResult,
    reviewsResult,
    leadsResult,
    recentSignupsResult,
    pendingReviewsResult,
  ] = await Promise.all([
    supabase.from('contractors').select('subscription_tier, created_at'),
    supabase.from('reviews').select('status'),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase
      .from('contractors')
      .select('id, company_name, slug, subscription_tier, is_verified, commercial_verified, city, state, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const contractors = contractorsResult.data || []
  const reviews = reviewsResult.data || []
  const totalLeads = leadsResult.count ?? 0
  const recentSignups = recentSignupsResult.data || []
  const pendingCount = pendingReviewsResult.count ?? 0

  // Tier counts
  const tierCounts = {
    free: 0, bronze: 0, silver: 0, gold: 0,
  }
  for (const c of contractors as { subscription_tier: string }[]) {
    if (c.subscription_tier in tierCounts) {
      tierCounts[c.subscription_tier as keyof typeof tierCounts]++
    }
  }

  // Review status counts
  const reviewCounts = { pending: 0, approved: 0, flagged: 0, removed: 0 }
  for (const r of reviews as { status: string }[]) {
    if (r.status in reviewCounts) {
      reviewCounts[r.status as keyof typeof reviewCounts]++
    }
  }

  // Signups this week
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const newThisWeek = contractors.filter(
    (c: { created_at: string }) => new Date(c.created_at) > oneWeekAgo
  ).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">Overview</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Platform health at a glance</p>
      </div>

      {/* Top stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Contractors"
          value={contractors.length}
          sub={`${newThisWeek} new this week`}
          href="/admin/contractors"
        />
        <StatCard
          label="Total Reviews"
          value={reviews.length}
          sub={`${reviewCounts.pending} pending`}
          href="/admin/reviews"
        />
        <StatCard
          label="Total Leads"
          value={totalLeads}
        />
        <StatCard
          label="Pending Moderation"
          value={pendingCount}
          sub="Reviews to review"
          href="/admin/reviews?status=pending"
        />
      </div>

      {/* Contractor tiers + Review status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Contractors by tier */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Contractors by Tier</h3>
          <div className="space-y-3">
            {(Object.keys(SUBSCRIPTION_TIERS) as Array<keyof typeof SUBSCRIPTION_TIERS>).map((tier) => {
              const count = tierCounts[tier] ?? 0
              const total = contractors.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={tier} className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold w-16 justify-center ${TIER_BADGE[tier] || ''}`}>
                    {SUBSCRIPTION_TIERS[tier].name}
                  </span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${tier === 'gold' ? 'bg-yellow-400' : tier === 'silver' ? 'bg-neutral-400' : tier === 'bronze' ? 'bg-amber-500' : 'bg-neutral-300'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-neutral-700 w-8 text-right">{count}</span>
                  <span className="text-xs text-neutral-400 w-10 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Reviews by status */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Reviews by Status</h3>
          <div className="space-y-3">
            {([
              { key: 'approved', label: 'Approved', color: 'bg-green-500' },
              { key: 'pending', label: 'Pending', color: 'bg-yellow-400' },
              { key: 'flagged', label: 'Flagged', color: 'bg-orange-500' },
              { key: 'removed', label: 'Removed', color: 'bg-red-500' },
            ] as const).map(({ key, label, color }) => {
              const count = reviewCounts[key] ?? 0
              const total = reviews.length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-neutral-600 w-16">{label}</span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-neutral-700 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
          {pendingCount > 0 && (
            <Link
              href="/admin/reviews?status=pending"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6"/>
              </svg>
              Moderate {pendingCount} pending review{pendingCount !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">Recent Contractor Signups</h3>
          <Link
            href="/admin/contractors"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-neutral-50">
          {recentSignups.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-400">No contractors yet</div>
          ) : (
            recentSignups.map((c: {
              id: string
              company_name: string
              slug: string
              subscription_tier: string
              is_verified: boolean
              commercial_verified: boolean
              city: string
              state: string
              created_at: string
            }) => (
              <div key={c.id} className="px-5 py-3 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900 truncate">{c.company_name}</span>
                    {c.is_verified && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success flex-shrink-0" aria-label="Verified">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">{c.city}, {c.state}</div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${TIER_BADGE[c.subscription_tier] || ''}`}>
                  {c.subscription_tier}
                </span>
                <span className="text-xs text-neutral-400 hidden sm:block">
                  {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <Link
                  href={`/contractors/${c.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label={`View ${c.company_name} listing`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" x2="21" y1="14" y2="3"/>
                  </svg>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
