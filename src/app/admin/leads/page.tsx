'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BUDGET_BANDS } from '@/lib/constants'

interface LeadContractor {
  id: string
  company_name: string
  slug: string
  city: string
  state: string
}

interface AdminLead {
  id: string
  created_at: string
  contractor_id: string
  name: string
  email: string
  phone: string | null
  company_name: string | null
  service_needed: string | null
  message: string | null
  urgency: 'routine' | 'soon' | 'emergency'
  preferred_contact: 'email' | 'phone' | 'either'
  source: string
  landing_page: string | null
  status: 'new' | 'sent' | 'viewed' | 'responded' | 'closed'
  building_type: string | null
  property_sqft: number | null
  num_units_rtus: number | null
  budget_band: string | null
  timing: string | null
  contractor: LeadContractor | null
}

type StatusFilter = 'all' | AdminLead['status']

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'responded', label: 'Responded' },
  { id: 'closed', label: 'Closed' },
]

function StatusBadge({ status }: { status: AdminLead['status'] }) {
  const config: Record<AdminLead['status'], { cls: string; label: string }> = {
    new: { cls: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'New' },
    sent: { cls: 'bg-sky-50 text-sky-700 border border-sky-200', label: 'Sent' },
    viewed: { cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200', label: 'Viewed' },
    responded: { cls: 'bg-green-50 text-green-700 border border-green-200', label: 'Responded' },
    closed: { cls: 'bg-neutral-100 text-neutral-500 border border-neutral-200', label: 'Closed' },
  }
  const { cls, label } = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function UrgencyBadge({ urgency }: { urgency: AdminLead['urgency'] }) {
  const config: Record<AdminLead['urgency'], { cls: string; label: string }> = {
    routine: { cls: 'bg-neutral-100 text-neutral-600', label: 'Routine' },
    soon: { cls: 'bg-orange-50 text-orange-700', label: 'Soon' },
    emergency: { cls: 'bg-red-50 text-red-700 font-semibold', label: '🔴 Emergency' },
  }
  const { cls, label } = config[urgency]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${cls}`}>
      {label}
    </span>
  )
}

function LeadDetailPanel({
  lead,
  onClose,
  onStatusChange,
}: {
  lead: AdminLead
  onClose: () => void
  onStatusChange: (id: string, status: AdminLead['status']) => Promise<void>
}) {
  const [updating, setUpdating] = useState<AdminLead['status'] | null>(null)

  const handleStatusChange = async (status: AdminLead['status']) => {
    setUpdating(status)
    await onStatusChange(lead.id, status)
    setUpdating(null)
  }

  const budgetLabel = BUDGET_BANDS.find(b => b.value === lead.budget_band)?.label

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{lead.name}</h3>
          {lead.company_name && (
            <p className="text-sm text-neutral-500">{lead.company_name}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600 transition-colors mt-0.5"
          aria-label="Close details"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" x2="6" y1="6" y2="18"/>
            <line x1="6" x2="18" y1="6" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Contractor info */}
      {lead.contractor && (
        <div className="bg-white border border-neutral-200 rounded-lg p-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Contractor</p>
          <Link
            href={`/contractors/${lead.contractor.slug}`}
            target="_blank"
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            {lead.contractor.company_name}
          </Link>
          <p className="text-xs text-neutral-400">
            {lead.contractor.city}, {lead.contractor.state}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lead.email && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Email</p>
            <a href={`mailto:${lead.email}`} className="text-sm text-primary-600 hover:underline">{lead.email}</a>
          </div>
        )}
        {lead.phone && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Phone</p>
            <a href={`tel:${lead.phone}`} className="text-sm text-primary-600 hover:underline">{lead.phone}</a>
          </div>
        )}
        {lead.service_needed && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Service Needed</p>
            <p className="text-sm text-neutral-700">{lead.service_needed}</p>
          </div>
        )}
        {lead.building_type && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Building Type</p>
            <p className="text-sm text-neutral-700 capitalize">{lead.building_type.replace(/_/g, ' ')}</p>
          </div>
        )}
        {lead.property_sqft && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Square Footage</p>
            <p className="text-sm text-neutral-700">{lead.property_sqft.toLocaleString()} sq ft</p>
          </div>
        )}
        {lead.budget_band && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Budget</p>
            <p className="text-sm text-neutral-700">{budgetLabel ?? lead.budget_band}</p>
          </div>
        )}
        {lead.timing && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Timing</p>
            <p className="text-sm text-neutral-700 capitalize">{lead.timing.replace(/_/g, ' ')}</p>
          </div>
        )}
        {lead.preferred_contact && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Preferred Contact</p>
            <p className="text-sm text-neutral-700 capitalize">{lead.preferred_contact}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Source</p>
          <p className="text-sm text-neutral-700">{lead.source}</p>
        </div>
        {lead.landing_page && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">Landing Page</p>
            <p className="text-sm text-neutral-700 truncate">{lead.landing_page}</p>
          </div>
        )}
      </div>

      {lead.message && (
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Message</p>
          <p className="text-sm text-neutral-700 bg-white border border-neutral-200 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
            {lead.message}
          </p>
        </div>
      )}

      {/* Status actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {lead.status !== 'viewed' && lead.status !== 'responded' && lead.status !== 'closed' && (
          <button
            onClick={() => handleStatusChange('viewed')}
            disabled={updating === 'viewed'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-sm font-medium bg-white text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
          >
            {updating === 'viewed' ? 'Updating…' : 'Mark as Viewed'}
          </button>
        )}
        {lead.status !== 'responded' && lead.status !== 'closed' && (
          <button
            onClick={() => handleStatusChange('responded')}
            disabled={updating === 'responded'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 text-sm font-medium bg-white text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
          >
            {updating === 'responded' ? 'Updating…' : 'Mark as Responded'}
          </button>
        )}
        {lead.status !== 'closed' && (
          <button
            onClick={() => handleStatusChange('closed')}
            disabled={updating === 'closed'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 transition-colors"
          >
            {updating === 'closed' ? 'Closing…' : 'Close Lead'}
          </button>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email Lead
          </a>
        )}
      </div>
    </div>
  )
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<StatusFilter, number>>({
    all: 0, new: 0, sent: 0, viewed: 0, responded: 0, closed: 0,
  })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', '50')

      const res = await fetch(`/api/admin/leads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setLeads(data.leads ?? [])
      setTotal(data.total ?? 0)
      setCounts(data.counts ?? { all: 0, new: 0, sent: 0, viewed: 0, responded: 0, closed: 0 })
    } catch (err) {
      console.error('Error loading leads:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => { loadLeads() }, [loadLeads])

  // Debounced search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleStatusChange = async (id: string, status: AdminLead['status']) => {
    const res = await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })

    if (res.ok) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l))
      // Update counts locally
      setCounts(prev => {
        const lead = leads.find(l => l.id === id)
        if (!lead) return prev
        const oldStatus = lead.status as StatusFilter
        return {
          ...prev,
          [oldStatus]: Math.max(0, prev[oldStatus] - 1),
          [status]: prev[status as StatusFilter] + 1,
        }
      })
    }
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold font-display text-neutral-900">Leads</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            All inbound leads across all contractors &middot; {counts.all} total
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" x2="16.65" y1="21" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, company…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-900 placeholder-neutral-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Status filter tabs */}
        <div className="border-b border-neutral-200 overflow-x-auto">
          <nav className="flex" aria-label="Filter by lead status">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1) }}
                className={[
                  'px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 -mb-px flex items-center gap-1.5',
                  statusFilter === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300',
                ].join(' ')}
                aria-pressed={statusFilter === tab.id}
              >
                {tab.label}
                <span className={[
                  'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold',
                  statusFilter === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500',
                ].join(' ')}>
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4">
                <div className="h-4 bg-neutral-200 rounded w-20"/>
                <div className="h-4 bg-neutral-200 rounded flex-1"/>
                <div className="h-4 bg-neutral-200 rounded w-32"/>
                <div className="h-4 bg-neutral-200 rounded w-24"/>
                <div className="h-4 bg-neutral-200 rounded w-16"/>
              </div>
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <svg className="mx-auto mb-3 text-neutral-300" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.61-1.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <p className="text-sm font-medium text-neutral-600">
              {search ? 'No leads match your search' : statusFilter === 'all' ? 'No leads yet' : `No ${statusFilter} leads`}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {search ? 'Try a different search term' : 'Leads will appear here when customers contact contractors'}
            </p>
          </div>
        ) : (
          <>
            {/* Table — desktop */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Contractor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Urgency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {leads.map(lead => (
                    <>
                      <tr
                        key={lead.id}
                        className={[
                          'transition-colors cursor-pointer',
                          expandedId === lead.id ? 'bg-primary-50' : 'hover:bg-neutral-50',
                          lead.status === 'new' ? 'bg-blue-50/30' : '',
                        ].join(' ')}
                        onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                        aria-expanded={expandedId === lead.id}
                      >
                        <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-900">{lead.name}</p>
                          {lead.company_name && (
                            <p className="text-xs text-neutral-400">{lead.company_name}</p>
                          )}
                          <p className="text-xs text-neutral-400">{lead.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {lead.contractor ? (
                            <div>
                              <p className="font-medium text-neutral-700 text-xs">{lead.contractor.company_name}</p>
                              <p className="text-xs text-neutral-400">{lead.contractor.city}, {lead.contractor.state}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 max-w-[160px] truncate text-xs">
                          {lead.service_needed ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <UrgencyBadge urgency={lead.urgency} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            onClick={e => {
                              e.stopPropagation()
                              setExpandedId(expandedId === lead.id ? null : lead.id)
                            }}
                            aria-label={expandedId === lead.id ? 'Collapse lead details' : 'Expand lead details'}
                          >
                            {expandedId === lead.id ? 'Collapse' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {expandedId === lead.id && (
                        <tr key={`${lead.id}-detail`}>
                          <td colSpan={7} className="px-4 py-3 bg-neutral-50">
                            <LeadDetailPanel
                              lead={lead}
                              onClose={() => setExpandedId(null)}
                              onStatusChange={handleStatusChange}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <ul className="sm:hidden divide-y divide-neutral-100">
              {leads.map(lead => (
                <li key={lead.id}>
                  <button
                    className="w-full text-left px-4 py-4 hover:bg-neutral-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                    aria-expanded={expandedId === lead.id}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">{lead.name}</p>
                        {lead.company_name && (
                          <p className="text-xs text-neutral-400">{lead.company_name}</p>
                        )}
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    {lead.contractor && (
                      <p className="text-xs text-primary-600 font-medium mb-1">
                        → {lead.contractor.company_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-neutral-400">
                        {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {lead.service_needed && (
                        <span className="text-xs text-neutral-500">· {lead.service_needed}</span>
                      )}
                      <UrgencyBadge urgency={lead.urgency} />
                    </div>
                  </button>
                  {expandedId === lead.id && (
                    <div className="px-4 pb-4">
                      <LeadDetailPanel
                        lead={lead}
                        onClose={() => setExpandedId(null)}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, total)} of {total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
