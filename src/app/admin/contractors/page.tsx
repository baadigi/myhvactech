'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const TIER_BADGE: Record<string, string> = {
  free: 'bg-neutral-100 text-neutral-600',
  bronze: 'bg-amber-50 text-amber-700 border border-amber-200',
  silver: 'bg-neutral-100 text-neutral-600 border border-neutral-300',
  gold: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
}

const SLOT_BADGE: Record<string, string> = {
  standard: 'bg-blue-50 text-blue-700',
  preferred: 'bg-purple-50 text-purple-700',
  exclusive: 'bg-red-50 text-red-700',
}

interface ContractorRow {
  id: string
  company_name: string
  slug: string
  city: string
  state: string
  subscription_tier: string
  is_verified: boolean
  is_featured: boolean
  commercial_verified: boolean
  is_claimed: boolean
  avg_rating: number
  review_count: number
  leads_count: number
  created_at: string
  slot_tier: string | null
  metro_area: string | null
  google_place_id: string | null
  google_rating: number | null
  google_review_count: number
  google_last_synced_at: string | null
}

type SortField = 'company_name' | 'avg_rating' | 'review_count' | 'created_at' | 'profile_views'

export default function AdminContractorsPage() {
  const [contractors, setContractors] = useState<ContractorRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncAllLoading, setSyncAllLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const limit = 50

  const fetchContractors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        tier: tierFilter,
        verified: verifiedFilter,
        sort: sortField,
        order: sortOrder,
        page: String(page),
        limit: String(limit),
      })
      const res = await fetch(`/api/admin/contractors?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setContractors(data.contractors || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Fetch contractors error:', err)
    } finally {
      setLoading(false)
    }
  }, [search, tierFilter, verifiedFilter, sortField, sortOrder, page])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContractors()
    }, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchContractors, search])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [search, tierFilter, verifiedFilter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-300" aria-hidden="true">
          <line x1="12" x2="12" y1="2" y2="22"/>
          <polyline points="17 7 12 2 7 7"/>
          <polyline points="7 17 12 22 17 17"/>
        </svg>
      )
    }
    return sortOrder === 'asc' ? (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600" aria-hidden="true">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    ) : (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    )
  }

  const patchContractor = async (id: string, updates: Record<string, unknown>) => {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/contractors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (!res.ok) throw new Error('Update failed')
      // Optimistically update local state
      setContractors(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    } catch (err) {
      console.error('Patch contractor error:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleChangeTier = async (id: string, tier: string) => {
    await patchContractor(id, { subscription_tier: tier })
  }

  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === contractors.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(contractors.map(c => c.id)))
    }
  }

  const bulkVerify = async () => {
    if (selected.size === 0) return
    setBulkActionLoading(true)
    try {
      for (const id of selected) {
        await fetch('/api/admin/contractors', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_verified: true }),
        })
      }
      setContractors(prev => prev.map(c => selected.has(c.id) ? { ...c, is_verified: true } : c))
      setSelected(new Set())
    } finally {
      setBulkActionLoading(false)
    }
  }

  const bulkFeature = async () => {
    if (selected.size === 0) return
    setBulkActionLoading(true)
    try {
      for (const id of selected) {
        await fetch('/api/admin/contractors', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_featured: true }),
        })
      }
      setContractors(prev => prev.map(c => selected.has(c.id) ? { ...c, is_featured: true } : c))
      setSelected(new Set())
    } finally {
      setBulkActionLoading(false)
    }
  }

  const syncSingle = async (id: string) => {
    setSyncingId(id)
    setSyncMessage(null)
    try {
      // Step 1: Sync Google data
      const res = await fetch('/api/admin/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractor_id: id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSyncMessage(data.error || 'Sync failed')
        return
      }

      setSyncMessage(`Synced: ${data.data?.rating ?? '\u2014'}\u2605 (${data.data?.review_count ?? 0} reviews) \u2014 generating description...`)

      // Step 2: Auto-generate AI description
      try {
        const descRes = await fetch('/api/admin/generate-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractor_id: id, save: true }),
        })
        const descData = await descRes.json()
        if (descRes.ok) {
          setSyncMessage(`Synced: ${data.data?.rating ?? '\u2014'}\u2605 (${data.data?.review_count ?? 0} reviews) + About written via ${descData.source} (${descData.word_count} words)`)
        } else {
          setSyncMessage(`Synced Google data \u2014 but description failed: ${descData.error}`)
        }
      } catch {
        setSyncMessage(`Synced Google data \u2014 but description generation failed`)
      }

      fetchContractors()
    } catch (err) {
      setSyncMessage(`Sync failed: ${err instanceof Error ? err.message : 'network error'}`)
    } finally {
      setSyncingId(null)
    }
  }

  const syncAll = async () => {
    setSyncAllLoading(true)
    setSyncMessage(null)
    try {
      const res = await fetch('/api/admin/google-sync', { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) {
        setSyncMessage(data.error || 'Batch sync failed')
        return
      }
      setSyncMessage(`Batch sync: ${data.synced}/${data.total} contractors synced`)
      fetchContractors()
    } catch (err) {
      setSyncMessage(`Batch sync failed: ${err instanceof Error ? err.message : 'network error'}`)
    } finally {
      setSyncAllLoading(false)
    }
  }

  const generateDescription = async (id: string) => {
    setGeneratingId(id)
    setSyncMessage(null)
    try {
      const res = await fetch('/api/admin/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractor_id: id, save: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSyncMessage(data.error || 'Generation failed')
        return
      }
      setSyncMessage(`About generated via ${data.source} (${data.word_count} words) \u2014 saved`)
    } catch {
      setSyncMessage('Description generation failed')
    } finally {
      setGeneratingId(null)
    }
  }

  const deleteContractor = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This removes all reviews, leads, photos, and projects. This cannot be undone.`)) {
      return
    }
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/contractors?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Delete failed')
        return
      }
      setContractors(prev => prev.filter(c => c.id !== id))
      setTotal(prev => prev - 1)
      setSyncMessage(`Deleted "${name}"`)
    } catch {
      alert('Delete failed \u2014 network error')
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Contractors</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{total.toLocaleString()} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={syncAll}
            loading={syncAllLoading}
            disabled={syncAllLoading}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Sync Google Reviews
          </Button>
          <Link href="/admin/contractors/add">
            <Button size="sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" x2="12" y1="5" y2="19"/>
                <line x1="5" x2="19" y1="12" y2="12"/>
              </svg>
              Add Contractor
            </Button>
          </Link>
        </div>
      </div>

      {/* Sync message */}
      {syncMessage && (
        <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-blue-400 hover:text-blue-600 ml-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" x2="16.65" y1="21" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search by company name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Tier filter */}
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="h-9 pl-3 pr-8 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          <option value="all">All Tiers</option>
          <option value="free">Free</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
        </select>

        {/* Verified filter */}
        <select
          value={verifiedFilter}
          onChange={e => setVerifiedFilter(e.target.value)}
          className="h-9 pl-3 pr-8 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
          <option value="all">All Verified</option>
          <option value="yes">Verified</option>
          <option value="no">Unverified</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-lg">
          <span className="text-sm font-medium text-primary-700">{selected.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            onClick={bulkVerify}
            loading={bulkActionLoading}
            className="!h-7 text-xs"
          >
            Verify Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={bulkFeature}
            loading={bulkActionLoading}
            className="!h-7 text-xs"
          >
            Feature Selected
          </Button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-neutral-500 hover:text-neutral-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === contractors.length && contractors.length > 0}
                    onChange={toggleAll}
                    className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('company_name')}
                    className="flex items-center gap-1.5 font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    Company <SortIcon field="company_name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Location</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Tier</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('avg_rating')}
                    className="flex items-center gap-1.5 font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    Rating <SortIcon field="avg_rating" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('review_count')}
                    className="flex items-center gap-1.5 font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    Reviews <SortIcon field="review_count" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Google</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Leads</th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center gap-1.5 font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    Joined <SortIcon field="created_at" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 w-4 bg-neutral-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-neutral-100 rounded w-40" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-neutral-100 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-5 bg-neutral-100 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-neutral-100 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-neutral-100 rounded w-12" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-neutral-100 rounded w-10" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-neutral-100 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-neutral-100 rounded w-10" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-neutral-100 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-neutral-100 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : contractors.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-sm text-neutral-400">
                    No contractors found
                  </td>
                </tr>
              ) : (
                contractors.map((c) => {
                  const isLoading = actionLoading === c.id
                  return (
                    <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleSelected(c.id)}
                          className="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                          aria-label={`Select ${c.company_name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900 max-w-[200px] truncate">{c.company_name}</div>
                        {c.slot_tier && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${SLOT_BADGE[c.slot_tier] || ''}`}>
                            {c.slot_tier}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                        {c.city}, {c.state}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={c.subscription_tier}
                          onChange={e => handleChangeTier(c.id, e.target.value)}
                          disabled={isLoading}
                          className={`text-xs font-semibold rounded px-2 py-1 border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 ${TIER_BADGE[c.subscription_tier] || 'bg-neutral-100 text-neutral-600'}`}
                          aria-label="Change tier"
                        >
                          <option value="free">Free</option>
                          <option value="bronze">Bronze</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.is_verified && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Verified
                            </span>
                          )}
                          {c.is_featured && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-50 text-yellow-700">
                              ★ Featured
                            </span>
                          )}
                          {c.commercial_verified && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                              Comm.
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {c.avg_rating > 0 ? (
                          <span className="flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400" aria-hidden="true">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            {c.avg_rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{c.review_count}</td>
                      <td className="px-4 py-3">
                        {c.google_place_id ? (
                          <div className="flex items-center gap-1">
                            {c.google_rating ? (
                              <span className="flex items-center gap-0.5 text-xs">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400" aria-hidden="true">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                                <span className="font-medium text-neutral-700">{c.google_rating}</span>
                                <span className="text-neutral-400">({c.google_review_count})</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400">ID set</span>
                            )}
                            <button
                              onClick={() => syncSingle(c.id)}
                              disabled={syncingId === c.id}
                              title="Sync Google reviews"
                              className="p-1 rounded text-neutral-300 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={syncingId === c.id ? 'animate-spin' : ''} aria-hidden="true">
                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{c.leads_count}</td>
                      <td className="px-4 py-3 text-neutral-400 whitespace-nowrap text-xs">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle verified */}
                          <button
                            onClick={() => patchContractor(c.id, { is_verified: !c.is_verified })}
                            disabled={isLoading}
                            title={c.is_verified ? 'Unverify' : 'Verify'}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 ${c.is_verified ? 'text-success hover:bg-green-50' : 'text-neutral-300 hover:text-success hover:bg-green-50'}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                              <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                          </button>

                          {/* Toggle featured */}
                          <button
                            onClick={() => patchContractor(c.id, { is_featured: !c.is_featured })}
                            disabled={isLoading}
                            title={c.is_featured ? 'Unfeature' : 'Feature'}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 ${c.is_featured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-neutral-300 hover:text-yellow-500 hover:bg-yellow-50'}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={c.is_featured ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          </button>

                          {/* Toggle commercial verified */}
                          <button
                            onClick={() => patchContractor(c.id, { commercial_verified: !c.commercial_verified })}
                            disabled={isLoading}
                            title={c.commercial_verified ? 'Remove Commercial Verified' : 'Mark Commercial Verified'}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 ${c.commercial_verified ? 'text-blue-600 hover:bg-blue-50' : 'text-neutral-300 hover:text-blue-600 hover:bg-blue-50'}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect width="20" height="14" x="2" y="5" rx="2"/>
                              <line x1="2" x2="22" y1="10" y2="10"/>
                            </svg>
                          </button>

                          {/* Generate AI About */}
                          <button
                            onClick={() => generateDescription(c.id)}
                            disabled={generatingId === c.id}
                            title="Generate AI About Us"
                            className="p-1.5 rounded text-neutral-300 hover:text-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={generatingId === c.id ? 'animate-pulse' : ''} aria-hidden="true">
                              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.4 5.7 21l2.3-7L2 9.4h7.6z"/>
                            </svg>
                          </button>

                          {/* View listing */}
                          <Link
                            href={`/contractors/${c.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded text-neutral-300 hover:text-primary-500 hover:bg-primary-50 transition-colors"
                            title="View public listing"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                              <polyline points="15 3 21 3 21 9"/>
                              <line x1="10" x2="21" y1="14" y2="3"/>
                            </svg>
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => deleteContractor(c.id, c.company_name)}
                            disabled={actionLoading === c.id}
                            title="Delete contractor"
                            className="p-1.5 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              <line x1="10" x2="10" y1="11" y2="17"/>
                              <line x1="14" x2="14" y1="11" y2="17"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 w-7 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span className="text-xs text-neutral-600 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 w-7 flex items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
