import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Contractor, Lead, Review } from '@/lib/types'
import { Button } from '@/components/ui/Button'

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i <= rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          className={i <= rating ? 'text-yellow-400' : 'text-neutral-300'}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  )
}

function LeadStatusBadge({ status }: { status: Lead['status'] }) {
  const classes: Record<Lead['status'], string> = {
    new: 'bg-blue-50 text-blue-700 border border-blue-200',
    sent: 'bg-sky-50 text-sky-700 border border-sky-200',
    viewed: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    responded: 'bg-green-50 text-green-700 border border-green-200',
    closed: 'bg-neutral-100 text-neutral-500 border border-neutral-200',
  }
  const labels: Record<Lead['status'], string> = {
    new: 'New',
    sent: 'Sent',
    viewed: 'Viewed',
    responded: 'Responded',
    closed: 'Closed',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes[status]}`}>
      {labels[status]}
    </span>
  )
}

function UrgencyBadge({ urgency }: { urgency: Lead['urgency'] }) {
  const classes: Record<Lead['urgency'], string> = {
    routine: 'bg-neutral-100 text-neutral-600',
    soon: 'bg-orange-50 text-orange-700',
    emergency: 'bg-red-50 text-red-700',
  }
  const labels: Record<Lead['urgency'], string> = {
    routine: 'Routine',
    soon: 'Soon',
    emergency: 'Emergency',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classes[urgency]}`}>
      {labels[urgency]}
    </span>
  )
}

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: string
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-neutral-400">{icon}</span>
        {trend && (
          <span className="text-xs font-medium text-success bg-green-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold font-display text-neutral-900 tabular-nums leading-none mb-1">
        {value}
      </p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: contractor } = await supabase
    .from('contractors')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!contractor) {
    redirect('/register')
  }

  const c = contractor as Contractor

  // Fetch recent leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, created_at, name, company_name, service_needed, urgency, status')
    .eq('contractor_id', c.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch recent reviews
  const { data: recentReviews } = await supabase
    .from('reviews')
    .select('id, created_at, reviewer_name, reviewer_company, rating, title, body, status')
    .eq('contractor_id', c.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const leads = (recentLeads ?? []) as Lead[]
  const reviews = (recentReviews ?? []) as Review[]

  const newLeadsCount = leads.filter(l => l.status === 'new').length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-display text-neutral-900">
            Welcome back
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">{c.company_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/contractors/${c.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
              Public Listing
            </Button>
          </Link>
          <Link href="/dashboard/profile">
            <Button size="sm">Edit Profile</Button>
          </Link>
        </div>
      </div>

      {/* Alert for new leads */}
      {newLeadsCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-blue-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </span>
            <p className="text-sm font-medium text-blue-800">
              You have {newLeadsCount} new lead{newLeadsCount !== 1 ? 's' : ''} waiting
            </p>
          </div>
          <Link href="/dashboard/leads">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-0">
              View Leads
            </Button>
          </Link>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Profile Views"
          value={(c.profile_views ?? 0).toLocaleString()}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          }
        />
        <StatCard
          label="Total Leads"
          value={(leads.length > 0 ? leads.length : 0).toLocaleString()}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.61-1.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          }
        />
        <StatCard
          label="Avg Rating"
          value={c.avg_rating ? c.avg_rating.toFixed(1) : '—'}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          }
        />
        <StatCard
          label="Reviews"
          value={(c.review_count ?? 0).toLocaleString()}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          }
        />
      </div>

      {/* Bottom section: leads + reviews side by side on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Recent Leads */}
        <section className="xl:col-span-3 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Recent Leads</h3>
            <Link href="/dashboard/leads" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>
          {leads.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto mb-3 text-neutral-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.61-1.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <p className="text-sm text-neutral-500">No leads yet</p>
              <p className="text-xs text-neutral-400 mt-1">Leads will appear here when customers contact you</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Name</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{lead.name}</p>
                        {lead.company_name && (
                          <p className="text-xs text-neutral-400">{lead.company_name}</p>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-neutral-600 max-w-[180px] truncate">
                        {lead.service_needed ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <LeadStatusBadge status={lead.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Reviews */}
        <section className="xl:col-span-2 bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Recent Reviews</h3>
            <Link href="/dashboard/reviews" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>
          {reviews.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto mb-3 text-neutral-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <p className="text-sm text-neutral-500">No reviews yet</p>
              <p className="text-xs text-neutral-400 mt-1">Customer reviews will appear here</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {reviews.map((review) => (
                <li key={review.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-neutral-900 leading-tight">{review.reviewer_name}</p>
                      {review.reviewer_company && (
                        <p className="text-xs text-neutral-400">{review.reviewer_company}</p>
                      )}
                    </div>
                    <time className="text-xs text-neutral-400 shrink-0">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </time>
                  </div>
                  <StarRating rating={review.rating} />
                  {review.title && (
                    <p className="text-sm font-medium text-neutral-800 mt-1.5 leading-tight">{review.title}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{review.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <section className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </Button>
          </Link>
          <Link href="/dashboard/photos">
            <Button variant="outline" size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              Manage Photos
            </Button>
          </Link>
          <Link href="/dashboard/leads">
            <Button variant="outline" size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.61-1.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              View All Leads
            </Button>
          </Link>
          <Link href="/dashboard/billing">
            <Button variant="outline" size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
              Manage Billing
            </Button>
          </Link>
          <Link href={`/contractors/${c.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
              View Public Listing
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
