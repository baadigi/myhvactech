'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { externalUrl } from '@/lib/utils'

interface ListingReview {
  screen?: {
    verdict: 'match' | 'mismatch' | 'unknown'
    reason: string
    site_title: string | null
  }
  decision?: 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  note?: string | null
  resubmitted_reason?: string
  previous_website?: string | null
}

interface ListingRow {
  id: string
  created_at: string
  company_name: string
  slug: string
  city: string
  state: string
  website: string | null
  email: string | null
  phone: string | null
  license_number: string | null
  short_description: string | null
  description: string | null
  listing_status: 'pending' | 'approved' | 'rejected'
  listing_review: ListingReview | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

const SCREEN_BADGE: Record<string, { label: string; className: string }> = {
  match: { label: 'TRADE CHECK: LOOKS RIGHT', className: 'bg-green-50 text-green-700 border-green-200' },
  mismatch: { label: 'TRADE CHECK: WRONG TRADE?', className: 'bg-red-50 text-red-700 border-red-200' },
  unknown: { label: 'TRADE CHECK: UNSURE', className: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
}

export default function AdminListingReviewPage() {
  const [listings, setListings] = useState<ListingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/listing-review?status=${statusFilter}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setListings(data.listings || [])
    } catch (err) {
      console.error('Fetch listing review error:', err)
      setMessage({ type: 'error', text: 'Could not load listings.' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleAction = async (listing: ListingRow, action: 'approve' | 'reject') => {
    setActionLoading(listing.id)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/listing-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listing.id, action, note: notes[listing.id] || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed to ${action} listing` })
        return
      }
      setMessage({
        type: 'success',
        text: action === 'approve'
          ? `${listing.company_name} approved — listing is live.`
          : `${listing.company_name} rejected — listing stays hidden.`,
      })
      setListings(prev => prev.filter(l => l.id !== listing.id))
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">Listing Review</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Self-registered listings stay hidden until approved here
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div className={`mb-4 px-4 py-2.5 border rounded-lg text-sm flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 opacity-60 hover:opacity-100" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(['pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === status
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-neutral-100 rounded w-48" />
                <div className="h-3 bg-neutral-100 rounded w-32" />
                <div className="h-3 bg-neutral-100 rounded w-64" />
              </div>
            </div>
          ))
        ) : listings.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
            <p className="text-sm text-neutral-400">No {statusFilter} listings</p>
          </div>
        ) : (
          listings.map(listing => {
            const review = listing.listing_review
            const screen = review?.screen
            const screenBadge = screen ? SCREEN_BADGE[screen.verdict] : null
            const websiteUrl = externalUrl(listing.website)
            return (
              <div key={listing.id} className="bg-white border border-neutral-200 rounded-xl p-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900">{listing.company_name}</span>
                  <span className="text-xs text-neutral-400">{listing.city}, {listing.state}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_BADGE[listing.listing_status]}`}>
                    {listing.listing_status.toUpperCase()}
                  </span>
                  {screenBadge && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${screenBadge.className}`}>
                      {screenBadge.label}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400 mt-1">
                  {listing.email}
                  {listing.phone && ` · ${listing.phone}`}
                  {listing.license_number && ` · License ${listing.license_number}`}
                  {' · signed up '}
                  {new Date(listing.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>

                <div className="mt-3 space-y-1 text-xs text-neutral-600">
                  <p>
                    <span className="font-medium text-neutral-500">Website: </span>
                    {websiteUrl ? (
                      <a href={websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-600 hover:text-primary-700 font-medium break-all">
                        {listing.website}
                      </a>
                    ) : (
                      <span className="text-neutral-400">none given</span>
                    )}
                  </p>
                  {screen && (
                    <p>
                      <span className="font-medium text-neutral-500">Trade check: </span>
                      {screen.reason}
                      {screen.site_title && <span className="text-neutral-400"> — site title: “{screen.site_title}”</span>}
                    </p>
                  )}
                  {review?.resubmitted_reason && (
                    <p>
                      <span className="font-medium text-neutral-500">Back in review: </span>
                      {review.resubmitted_reason}
                      {review.previous_website && <span className="text-neutral-400"> (was {review.previous_website})</span>}
                    </p>
                  )}
                  {(listing.short_description || listing.description) && (
                    <p>
                      <span className="font-medium text-neutral-500">Their description: </span>
                      {(listing.short_description || listing.description || '').slice(0, 300)}
                    </p>
                  )}
                </div>

                {review?.decision && listing.listing_status !== 'pending' && (
                  <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <p className="text-xs text-neutral-500">
                      <span className="font-medium">{review.decision === 'approved' ? 'Approved' : 'Rejected'}</span>
                      {review.reviewed_by && ` by ${review.reviewed_by}`}
                      {review.reviewed_at && ` on ${new Date(review.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                    {review.note && <p className="text-xs text-neutral-600 mt-1">{review.note}</p>}
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {listing.listing_status !== 'approved' && (
                    <input
                      type="text"
                      value={notes[listing.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [listing.id]: e.target.value }))}
                      placeholder="Internal note (optional)"
                      className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    {listing.listing_status !== 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handleAction(listing, 'approve')}
                        loading={actionLoading === listing.id}
                        disabled={actionLoading !== null}
                        className="!bg-green-600 hover:!bg-green-700"
                      >
                        Approve
                      </Button>
                    )}
                    {listing.listing_status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(listing, 'reject')}
                        loading={actionLoading === listing.id}
                        disabled={actionLoading !== null}
                        className="!text-red-600 hover:!bg-red-50 !border-red-200"
                      >
                        {listing.listing_status === 'approved' ? 'Remove from site' : 'Reject'}
                      </Button>
                    )}
                    <Link
                      href={`/admin/contractors/${listing.id}/edit`}
                      className="text-xs text-neutral-500 hover:text-neutral-700 font-medium ml-1"
                    >
                      Edit listing
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
