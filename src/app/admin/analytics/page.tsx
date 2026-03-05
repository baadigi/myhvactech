import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
        <span className="text-neutral-400">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-neutral-900 leading-none">{value}</div>
      {sub && <div className="text-xs text-neutral-400 mt-1.5">{sub}</div>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  // Date ranges
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch all analytics data in parallel
  const [
    totalEventsResult,
    todayEventsResult,
    weekEventsResult,
    eventsByTypeResult,
    topContractorsResult,
    recentEventsResult,
    blogViewsResult,
    leadsCountResult,
  ] = await Promise.all([
    // Total events (all time)
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }),
    // Today's events
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('created_at', today),
    // This week's events
    supabase.from('analytics_events').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    // Events by type (last 30 days)
    supabase.from('analytics_events').select('event_type').gte('created_at', thirtyDaysAgo),
    // Top contractors by profile views (last 30 days)
    supabase.from('analytics_events')
      .select('contractor_id')
      .eq('event_type', 'profile_view')
      .gte('created_at', thirtyDaysAgo),
    // Recent events
    supabase.from('analytics_events')
      .select('id, event_type, contractor_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
    // Blog views (last 30 days)
    supabase.from('blog_posts').select('title, slug, view_count').order('view_count', { ascending: false }).limit(5),
    // Total leads
    supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
  ])

  const totalEvents = totalEventsResult.count ?? 0
  const todayEvents = todayEventsResult.count ?? 0
  const weekEvents = weekEventsResult.count ?? 0
  const leads30d = leadsCountResult.count ?? 0

  // Count events by type
  const eventsByType: Record<string, number> = {}
  for (const e of (eventsByTypeResult.data || []) as { event_type: string }[]) {
    eventsByType[e.event_type] = (eventsByType[e.event_type] || 0) + 1
  }

  // Count top contractors by views
  const contractorViews: Record<string, number> = {}
  for (const e of (topContractorsResult.data || []) as { contractor_id: string }[]) {
    if (e.contractor_id) {
      contractorViews[e.contractor_id] = (contractorViews[e.contractor_id] || 0) + 1
    }
  }
  const topContractorIds = Object.entries(contractorViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }))

  // Fetch contractor names for top list
  let topContractors: { id: string; company_name: string; slug: string; views: number }[] = []
  if (topContractorIds.length > 0) {
    const { data: contractors } = await supabase
      .from('contractors')
      .select('id, company_name, slug')
      .in('id', topContractorIds.map((c) => c.id))
    if (contractors) {
      const nameMap = new Map(contractors.map((c: { id: string; company_name: string; slug: string }) => [c.id, c]))
      topContractors = topContractorIds.map((tc) => {
        const info = nameMap.get(tc.id)
        return {
          id: tc.id,
          company_name: info?.company_name || 'Unknown',
          slug: info?.slug || '',
          views: tc.count,
        }
      })
    }
  }

  const recentEvents = (recentEventsResult.data || []) as {
    id: string
    event_type: string
    contractor_id: string
    metadata: Record<string, string>
    created_at: string
  }[]

  const blogPosts = (blogViewsResult.data || []) as { title: string; slug: string; view_count: number }[]

  const EVENT_LABELS: Record<string, { label: string; color: string }> = {
    profile_view: { label: 'Profile Views', color: 'bg-blue-500' },
    phone_click: { label: 'Phone Clicks', color: 'bg-green-500' },
    website_click: { label: 'Website Clicks', color: 'bg-purple-500' },
    direction_request: { label: 'Direction Requests', color: 'bg-orange-500' },
    form_submit: { label: 'Form Submissions', color: 'bg-primary-500' },
    photo_view: { label: 'Photo Views', color: 'bg-pink-500' },
    review_view: { label: 'Review Views', color: 'bg-yellow-500' },
  }

  const maxEventCount = Math.max(...Object.values(eventsByType), 1)

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 font-display">Site Analytics</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Platform activity and engagement metrics</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Today"
          value={todayEvents}
          sub="events tracked"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard
          label="This Week"
          value={weekEvents}
          sub="last 7 days"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        />
        <StatCard
          label="Leads (30d)"
          value={leads30d}
          sub="quote requests"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard
          label="All Time"
          value={totalEvents.toLocaleString()}
          sub="total events"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Events by Type */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Events by Type (30 days)</h3>
          {Object.keys(eventsByType).length === 0 ? (
            <p className="text-sm text-neutral-400 py-6 text-center">No events recorded yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(EVENT_LABELS).map(([type, { label, color }]) => {
                const count = eventsByType[type] || 0
                if (count === 0) return null
                const pct = Math.round((count / maxEventCount) * 100)
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-neutral-600 w-32 truncate">{label}</span>
                    <div className="flex-1 bg-neutral-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium text-neutral-700 w-12 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Contractors by Views */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Top Contractors by Views (30 days)</h3>
          {topContractors.length === 0 ? (
            <p className="text-sm text-neutral-400 py-6 text-center">No profile views yet</p>
          ) : (
            <div className="space-y-2">
              {topContractors.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs font-bold text-neutral-400 w-5 text-right">{i + 1}</span>
                  <Link
                    href={`/contractors/${c.slug}`}
                    target="_blank"
                    className="flex-1 text-sm font-medium text-neutral-800 hover:text-primary-600 transition-colors truncate"
                  >
                    {c.company_name}
                  </Link>
                  <span className="text-sm font-semibold text-neutral-600">{c.views}</span>
                  <span className="text-[10px] text-neutral-400">views</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Blog Views */}
      {blogPosts.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-8">
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Top Blog Posts by Views</h3>
          <div className="space-y-2">
            {blogPosts.map((post) => (
              <div key={post.slug} className="flex items-center gap-3 py-1.5">
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="flex-1 text-sm font-medium text-neutral-800 hover:text-primary-600 transition-colors truncate"
                >
                  {post.title}
                </Link>
                <span className="text-sm font-semibold text-neutral-600">{post.view_count}</span>
                <span className="text-[10px] text-neutral-400">views</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GA4 Quick Link */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Google Analytics</h3>
            <p className="text-xs text-neutral-500 mt-0.5">For detailed traffic, audience, and acquisition data</p>
          </div>
          <a
            href="https://analytics.google.com/analytics/web/#/p/G-0QJYC9011B"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Open GA4 Dashboard
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" x2="21" y1="14" y2="3"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-sm font-semibold text-neutral-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-neutral-50">
          {recentEvents.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-400">No events recorded yet</div>
          ) : (
            recentEvents.map((event) => {
              const info = EVENT_LABELS[event.event_type] || { label: event.event_type, color: 'bg-neutral-400' }
              return (
                <div key={event.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${info.color}`} />
                  <span className="text-sm text-neutral-700 flex-1">{info.label}</span>
                  <span className="text-xs text-neutral-400">
                    {new Date(event.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
