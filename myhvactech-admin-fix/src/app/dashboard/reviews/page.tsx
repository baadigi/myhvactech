'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import type { Review } from '@/lib/types'

type StatusFilter = 'all' | Review['status']

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'flagged', label: 'Flagged' },
]

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          className={i <= rating ? 'text-yellow-400' : 'text-neutral-300'}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  )
}

function ReviewStatusBadge({ status }: { status: Review['status'] }) {
  const config: Record<Review['status'], { cls: string; label: string }> = {
    pending: { cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200', label: 'Pending' },
    approved: { cls: 'bg-green-50 text-green-700 border border-green-200', label: 'Approved' },
    flagged: { cls: 'bg-red-50 text-red-700 border border-red-200', label: 'Flagged' },
    removed: { cls: 'bg-neutral-100 text-neutral-500 border border-neutral-200', label: 'Removed' },
  }
  const { cls, label } = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

function ReviewCard({
  review,
  onResponse,
}: {
  review: Review
  onResponse: (id: string, response: string) => Promise<void>
}) {
  const [showRespond, setShowRespond] = useState(false)
  const [responseText, setResponseText] = useState(review.response ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseText.trim()) return
    setSaving(true)
    await onResponse(review.id, responseText.trim())
    setSaving(false)
    setSaved(true)
    setShowRespond(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-neutral-900 text-sm">{review.reviewer_name}</p>
            {review.reviewer_company && (
              <span className="text-xs text-neutral-400">· {review.reviewer_company}</span>
            )}
            {review.reviewer_title && (
              <span className="text-xs text-neutral-400">{review.reviewer_title}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <StarRating rating={review.rating} size={14} />
            <time className="text-xs text-neutral-400">
              {new Date(review.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
        </div>
        <ReviewStatusBadge status={review.status} />
      </div>

      {/* Review content */}
      {review.title && (
        <p className="font-medium text-neutral-800 text-sm">{review.title}</p>
      )}
      <p className="text-sm text-neutral-700 leading-relaxed">{review.body}</p>

      {/* Metadata tags */}
      <div className="flex flex-wrap gap-1.5">
        {review.project_type && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-600 capitalize">
            {review.project_type.replace('_', ' ')}
          </span>
        )}
        {review.building_type && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-600 capitalize">
            {review.building_type.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Existing response */}
      {review.response && !showRespond && (
        <div className="bg-primary-50 border border-primary-100 rounded-lg px-4 py-3">
          <p className="text-xs font-medium text-primary-700 mb-1 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 14 4 9 9 4"/>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
            </svg>
            Your response
            {review.response_date && (
              <span className="font-normal text-primary-500">
                · {new Date(review.response_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </p>
          <p className="text-sm text-primary-800 leading-relaxed">{review.response}</p>
          <button
            onClick={() => setShowRespond(true)}
            className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Edit response
          </button>
        </div>
      )}

      {/* Action buttons */}
      {!showRespond && !review.response && review.status !== 'removed' && (
        <div className="pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRespond(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 14 4 9 9 4"/>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
            </svg>
            Respond to Review
          </Button>
          {saved && (
            <span className="ml-3 text-xs text-success font-medium">✓ Response saved</span>
          )}
        </div>
      )}

      {/* Response form */}
      {showRespond && (
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div>
            <label htmlFor={`response-${review.id}`} className="block text-sm font-medium text-neutral-700 mb-1.5">
              Your Response
            </label>
            <textarea
              id={`response-${review.id}`}
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              rows={4}
              placeholder="Thank you for your review. We appreciate your business and..."
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
            <p className="text-xs text-neutral-400 mt-1">
              Your response will be publicly visible on your profile listing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={saving} disabled={!responseText.trim()}>
              {review.response ? 'Update Response' : 'Post Response'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowRespond(false)
                setResponseText(review.response ?? '')
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function ReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [contractorId, setContractorId] = useState<string | null>(null)
  const [avgRating, setAvgRating] = useState<number>(0)

  const loadReviews = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: contractor } = await supabase
      .from('contractors')
      .select('id, avg_rating')
      .eq('owner_id', user.id)
      .single()

    if (!contractor) return
    setContractorId(contractor.id)
    setAvgRating(contractor.avg_rating ?? 0)

    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('contractor_id', contractor.id)
      .order('created_at', { ascending: false })

    setReviews((data ?? []) as Review[])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadReviews() }, [loadReviews])

  const handleResponse = async (id: string, response: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({
        response,
        response_date: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error) {
      setReviews(prev => prev.map(r =>
        r.id === id
          ? { ...r, response, response_date: new Date().toISOString() }
          : r
      ))
    }
  }

  const filteredReviews = statusFilter === 'all'
    ? reviews
    : reviews.filter(r => r.status === statusFilter)

  const counts: Record<StatusFilter, number> = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
    removed: reviews.filter(r => r.status === 'removed').length,
  }

  const respondedCount = reviews.filter(r => r.response).length
  const pendingResponseCount = reviews.filter(r => !r.response && r.status === 'approved').length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold font-display text-neutral-900">Reviews</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Monitor and respond to customer reviews
        </p>
      </div>

      {/* Summary stats */}
      {!loading && reviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-4 text-center">
            <p className="text-2xl font-semibold font-display text-neutral-900 tabular-nums">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </p>
            <StarRating rating={Math.round(avgRating)} size={13} />
            <p className="text-xs text-neutral-500 mt-1">Avg Rating</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4 text-center">
            <p className="text-2xl font-semibold font-display text-neutral-900">{reviews.length}</p>
            <p className="text-xs text-neutral-500 mt-1">Total Reviews</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4 text-center">
            <p className="text-2xl font-semibold font-display text-neutral-900">{respondedCount}</p>
            <p className="text-xs text-neutral-500 mt-1">Responded To</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4 text-center">
            <p className={`text-2xl font-semibold font-display ${pendingResponseCount > 0 ? 'text-orange-600' : 'text-neutral-900'}`}>
              {pendingResponseCount}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Awaiting Response</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 overflow-x-auto">
          <nav className="flex" aria-label="Filter by review status">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
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

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-2 bg-neutral-50 rounded-xl p-5">
                  <div className="h-4 bg-neutral-200 rounded w-40"/>
                  <div className="h-3 bg-neutral-200 rounded w-24"/>
                  <div className="h-16 bg-neutral-200 rounded"/>
                </div>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-14 text-center">
              <svg className="mx-auto mb-3 text-neutral-300" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <p className="text-sm font-medium text-neutral-600">
                {statusFilter === 'all' ? 'No reviews yet' : `No ${statusFilter} reviews`}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {statusFilter === 'all'
                  ? 'Customer reviews will appear here once they submit feedback'
                  : 'No reviews match this filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onResponse={handleResponse}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
