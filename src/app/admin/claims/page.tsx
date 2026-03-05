'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface ClaimRow {
  id: string
  created_at: string
  contractor_id: string
  user_id: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  job_title: string | null
  message: string | null
  status: 'pending' | 'approved' | 'denied'
  admin_notes: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  contractors: {
    company_name: string
    slug: string
    city: string
    state: string
    is_claimed: boolean
    owner_id: string | null
  } | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  denied: 'bg-red-50 text-red-700 border-red-200',
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchClaims = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/claims?status=${statusFilter}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setClaims(data.claims || [])
    } catch (err) {
      console.error('Fetch claims error:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  const handleAction = async (claimId: string, action: 'approve' | 'deny') => {
    setActionLoading(claimId)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: claimId,
          action,
          admin_notes: adminNotes[claimId] || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed to ${action} claim` })
        return
      }
      setMessage({
        type: 'success',
        text: action === 'approve'
          ? 'Claim approved — listing ownership transferred.'
          : 'Claim denied.',
      })
      // Refresh the list
      fetchClaims()
      setExpandedId(null)
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setActionLoading(null)
    }
  }

  const pendingCount = claims.filter(c => c.status === 'pending').length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Claim Requests</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Review and approve contractor listing ownership claims
          </p>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`mb-4 px-4 py-2.5 border rounded-lg text-sm flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 opacity-60 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(['pending', 'approved', 'denied', 'all'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === status
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            {status === 'pending' ? `Pending${pendingCount > 0 ? '' : ''}` : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Claims list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-neutral-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-48" />
                  <div className="h-3 bg-neutral-100 rounded w-32" />
                  <div className="h-3 bg-neutral-100 rounded w-64" />
                </div>
              </div>
            </div>
          ))
        ) : claims.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
            <p className="text-sm text-neutral-400">
              No {statusFilter === 'all' ? '' : statusFilter + ' '}claim requests found
            </p>
          </div>
        ) : (
          claims.map(claim => {
            const isExpanded = expandedId === claim.id
            const contractor = claim.contractors
            return (
              <div
                key={claim.id}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
              >
                {/* Claim header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                  className="w-full px-5 py-4 flex items-start gap-4 hover:bg-neutral-50 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary-700">
                      {claim.contact_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900">{claim.contact_name}</span>
                      {claim.job_title && (
                        <span className="text-xs text-neutral-400">({claim.job_title})</span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_BADGE[claim.status]}`}>
                        {claim.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Wants to claim{' '}
                      <span className="font-medium text-neutral-700">
                        {contractor?.company_name || 'Unknown Contractor'}
                      </span>
                      {contractor && (
                        <span className="text-neutral-400"> · {contractor.city}, {contractor.state}</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {claim.contact_email}
                      {claim.contact_phone && ` · ${claim.contact_phone}`}
                      {' · '}
                      {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Chevron */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-neutral-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-neutral-100">
                    {/* Message */}
                    {claim.message && (
                      <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <p className="text-xs font-medium text-neutral-500 mb-1">Message from claimant:</p>
                        <p className="text-sm text-neutral-700">{claim.message}</p>
                      </div>
                    )}

                    {/* Contractor link */}
                    {contractor && (
                      <div className="mt-3">
                        <Link
                          href={`/contractors/${contractor.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" x2="21" y1="14" y2="3"/>
                          </svg>
                          View {contractor.company_name} Listing
                        </Link>
                      </div>
                    )}

                    {/* Admin review details */}
                    {claim.status !== 'pending' && (
                      <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <p className="text-xs text-neutral-500">
                          <span className="font-medium">{claim.status === 'approved' ? 'Approved' : 'Denied'}</span>
                          {claim.reviewed_by && ` by ${claim.reviewed_by}`}
                          {claim.reviewed_at && ` on ${new Date(claim.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                        </p>
                        {claim.admin_notes && (
                          <p className="text-xs text-neutral-600 mt-1">{claim.admin_notes}</p>
                        )}
                      </div>
                    )}

                    {/* Action buttons (only for pending) */}
                    {claim.status === 'pending' && (
                      <div className="mt-4 space-y-3">
                        {/* Admin notes input */}
                        <div>
                          <label htmlFor={`notes-${claim.id}`} className="block text-xs font-medium text-neutral-500 mb-1">
                            Admin Notes (optional)
                          </label>
                          <textarea
                            id={`notes-${claim.id}`}
                            value={adminNotes[claim.id] || ''}
                            onChange={e => setAdminNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                            placeholder="Internal notes about this claim decision…"
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400 resize-y"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(claim.id, 'approve')}
                            loading={actionLoading === claim.id}
                            disabled={actionLoading !== null}
                            className="!bg-green-600 hover:!bg-green-700"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Approve &amp; Transfer Ownership
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(claim.id, 'deny')}
                            loading={actionLoading === claim.id}
                            disabled={actionLoading !== null}
                            className="!text-red-600 hover:!bg-red-50 !border-red-200"
                          >
                            Deny
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
