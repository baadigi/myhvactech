'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

type ReviewStatus = 'pending' | 'approved' | 'flagged' | 'removed'

interface ReviewRow {
  id: string
  created_at: string
  contractor_id: string
  reviewer_name: string
  reviewer_company: string | null
  reviewer_title: string | null
  rating: number
  title: string | null
  body: string
  is_verified: boolean
  status: ReviewStatus
  project_type: string | null
  building_type: string | null
  contractors: {
    id: string
    company_name: string
    slug: string
    city: string
    state: string
  } | null
}

interface StatusCounts {
  all: number
  pending: number
  approved: number
  flagged: number
  removed: number
}

const STATUS_TABS: { key: ReviewStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'removed', label: 'Removed' },
]

const STATUS_BADGE: Record<ReviewStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  flagged: 'bg-orange-50 text-orange-700 border border-orange-200',
  removed: 'bg-red-50 text-red-700 border border-red-200',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={star <= rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          className={star <= rating ? 'text-yellow-400' : 'text-neutral-200'}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [counts, setCounts] = useState<StatusCounts>({ all: 0, pending: 0, approved: 0, flagged: 0, removed: 0 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ReviewStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const limit = 50

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page: String(page),
        limit: String(limit),
      })
      const res = await fetch(`/api/admin/reviews?${params}`)
      if (!res.ok) throw new Error('Failed to fetch reviews')
      const data = await res.json()
      setReviews(data.reviews || [])
      setTotal(data.total || 0)
      setCounts(data.counts || { all: 0, pending: 0, approved: 0, flagged: 0, removed: 0 })
    } catch (err) {
      console.error('Fetch reviews error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  const updateReviewStatus = async (id: string, status: ReviewStatus) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      // Update counts
      setCounts(prev => {
        const oldStatus = reviews.find(r => r.id === id)?.status
        if (!oldStatus || oldStatus === status) return prev
        return {
          ...prev,
          [oldStatus]: Math.max(0, prev[oldStatus] - 1),
          [status]: prev[status] + 1,
        }
      })
    } catch (err) {
      console.error('Update review error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">Review Moderation</h2>
        <p className="text-sm text-neutral-500 mt-0.5">{counts.all} total reviews</p>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-neutral-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-800',
            ].join(' ')}
          >
            {tab.label}
            <span className={[
              'inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px]',
              activeTab === tab.key
                ? 'bg-primary-100 text-primary-700'
                : 'bg-neutral-100 text-neutral-500',
            ].join(' ')}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-1/3" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  <div className="h-3 bg-neutral-100 rounded w-full" />
                  <div className="h-3 bg-neutral-100 rounded w-3/4" />
                </div>
                <div className="h-8 w-32 bg-neutral-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 px-6 py-12 text-center">
          <div className="text-neutral-300 mb-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <p className="text-sm text-neutral-400">No reviews in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const isLoading = actionLoading === review.id
            return (
              <div
                key={review.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StarRating rating={review.rating} />
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[review.status]}`}>
                        {review.status}
                      </span>
                      {review.is_verified && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-neutral-400 ml-auto">
                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Contractor link */}
                    {review.contractors && (
                      <div className="mb-2">
                        <a
                          href={`/contractors/${review.contractors.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                          {review.contractors.company_name}
                        </a>
                        <span className="text-xs text-neutral-400"> · {review.contractors.city}, {review.contractors.state}</span>
                      </div>
                    )}

                    {/* Review title & body */}
                    {review.title && (
                      <h4 className="text-sm font-semibold text-neutral-900 mb-1">{review.title}</h4>
                    )}
                    <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">{review.body}</p>

                    {/* Reviewer info */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      <span className="font-medium text-neutral-600">{review.reviewer_name}</span>
                      {review.reviewer_company && <span>{review.reviewer_company}</span>}
                      {review.reviewer_title && <span>· {review.reviewer_title}</span>}
                      {review.project_type && <span>· {review.project_type}</span>}
                      {review.building_type && <span>· {review.building_type}</span>}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {review.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReviewStatus(review.id, 'approved')}
                        loading={isLoading}
                        className="!h-8 text-xs text-green-700 border-green-200 hover:bg-green-50"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Approve
                      </Button>
                    )}
                    {review.status !== 'flagged' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReviewStatus(review.id, 'flagged')}
                        loading={isLoading}
                        className="!h-8 text-xs text-orange-700 border-orange-200 hover:bg-orange-50"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                          <line x1="4" x2="4" y1="22" y2="15"/>
                        </svg>
                        Flag
                      </Button>
                    )}
                    {review.status !== 'removed' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateReviewStatus(review.id, 'removed')}
                        loading={isLoading}
                        className="!h-8 text-xs"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Remove
                      </Button>
                    )}
                    {review.status === 'removed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReviewStatus(review.id, 'pending')}
                        loading={isLoading}
                        className="!h-8 text-xs"
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 text-sm rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-neutral-600 px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 px-3 text-sm rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
