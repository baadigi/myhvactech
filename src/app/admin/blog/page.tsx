'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string
  created_at: string
  updated_at: string
  published_at: string | null
  title: string
  slug: string
  excerpt: string | null
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  is_auto_generated: boolean
  view_count: number
  author_name: string
  cover_image_url: string | null
}

type StatusFilter = '' | 'published' | 'draft' | 'archived'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'archived', label: 'Archived' },
]

const STATUS_BADGE_CLASSES: Record<string, string> = {
  published: 'bg-green-50 text-green-700 border border-green-200',
  draft: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  archived: 'bg-neutral-100 text-neutral-500 border border-neutral-200',
}

const CATEGORY_LABELS: Record<string, string> = {
  'industry-news': 'Industry News',
  'tips': 'Tips & Guides',
  'regulations': 'Regulations',
  'company-updates': 'Company Updates',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  // Stats
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, views: 0 })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: 'created_at',
        order: 'desc',
      })
      if (statusFilter) params.set('status', statusFilter)
      if (searchDebounced) params.set('search', searchDebounced)

      const res = await fetch(`/api/admin/blog?${params}`)
      if (!res.ok) throw new Error('Failed to fetch posts')
      const data = await res.json()
      setPosts(data.posts || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Fetch posts error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchDebounced])

  // Fetch stats (all posts, no filter)
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blog?limit=10000')
      if (!res.ok) return
      const data = await res.json()
      const allPosts: BlogPost[] = data.posts || []
      setStats({
        total: data.total || 0,
        published: allPosts.filter((p) => p.status === 'published').length,
        drafts: allPosts.filter((p) => p.status === 'draft').length,
        views: allPosts.reduce((sum, p) => sum + (p.view_count || 0), 0),
      })
    } catch {
      // Ignore stats error
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [statusFilter, searchDebounced])

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      if (data.success && data.post) {
        router.push(`/admin/blog/new?id=${data.post.id}`)
      }
    } catch (err) {
      console.error('Generate article error:', err)
      alert('Failed to generate article. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setTotal((prev) => prev - 1)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      fetchStats()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete post.')
    }
  }

  const handleToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Update failed')
      const data = await res.json()
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, ...data.post } : p))
      )
      fetchStats()
    } catch (err) {
      console.error('Toggle status error:', err)
    }
  }

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)

    if (action === 'delete') {
      if (!confirm(`Delete ${ids.length} post(s)? This cannot be undone.`)) return
    }

    setBulkLoading(true)
    try {
      if (action === 'delete') {
        await Promise.all(
          ids.map((id) =>
            fetch('/api/admin/blog', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id }),
            })
          )
        )
      } else {
        const status = action === 'publish' ? 'published' : 'archived'
        await Promise.all(
          ids.map((id) =>
            fetch('/api/admin/blog', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, status }),
            })
          )
        )
      }
      setSelectedIds(new Set())
      fetchPosts()
      fetchStats()
    } catch (err) {
      console.error('Bulk action error:', err)
      alert('Some operations failed. Please refresh.')
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)))
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 font-display">Blog Management</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Create, edit, and manage blog posts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            loading={generating}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v3m6.36-.64l-2.12 2.12M21 12h-3M18.36 18.36l-2.12-2.12M12 18v3M7.76 16.24l-2.12 2.12M6 12H3M7.76 7.76L5.64 5.64"/>
            </svg>
            Generate Article
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/admin/blog/new')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" x2="12" y1="5" y2="19"/>
              <line x1="5" x2="19" y1="12" y2="12"/>
            </svg>
            New Post
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Posts', value: stats.total, color: 'text-neutral-900' },
          { label: 'Published', value: stats.published, color: 'text-green-600' },
          { label: 'Drafts', value: stats.drafts, color: 'text-yellow-600' },
          { label: 'Total Views', value: stats.views.toLocaleString(), color: 'text-primary-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-neutral-200 shadow-sm px-4 py-3">
            <p className="text-xs text-neutral-500 mb-0.5">{stat.label}</p>
            <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {/* Status tabs */}
        <div className="flex items-center gap-1 border-b border-neutral-200 sm:border-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={[
                'px-3 py-2 text-sm font-medium transition-colors rounded-lg',
                statusFilter === tab.key
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 sm:max-w-xs ml-auto">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" x2="16.65" y1="21" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-primary-50 rounded-lg border border-primary-100">
          <span className="text-sm font-medium text-primary-700 px-2">
            {selectedIds.size} selected
          </span>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('publish')} loading={bulkLoading} className="!h-7 text-xs">
            Publish
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')} loading={bulkLoading} className="!h-7 text-xs">
            Archive
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')} loading={bulkLoading} className="!h-7 text-xs">
            Delete
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-primary-600 hover:text-primary-800 px-2">
            Clear
          </button>
        </div>
      )}

      {/* Posts Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 w-4 bg-neutral-100 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-2/3" />
                  <div className="h-3 bg-neutral-100 rounded w-1/3" />
                </div>
                <div className="h-6 w-16 bg-neutral-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-neutral-300 mb-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto" aria-hidden="true">
                <path d="M12 20h9"/>
                <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z"/>
              </svg>
            </div>
            <p className="text-sm text-neutral-400 mb-3">No blog posts yet</p>
            <Button size="sm" onClick={() => router.push('/admin/blog/new')}>
              Create your first post
            </Button>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="hidden sm:grid sm:grid-cols-[32px_1fr_120px_100px_80px_80px_120px] gap-3 px-4 py-2.5 border-b border-neutral-100 bg-neutral-50 text-xs font-medium text-neutral-500 uppercase tracking-wide">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.size === posts.length && posts.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-neutral-300"
                />
              </div>
              <div>Title</div>
              <div>Category</div>
              <div>Status</div>
              <div>Views</div>
              <div>Date</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Rows */}
            {posts.map((post) => (
              <div
                key={post.id}
                className={[
                  'grid grid-cols-1 sm:grid-cols-[32px_1fr_120px_100px_80px_80px_120px] gap-3 px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 transition-colors items-center',
                  selectedIds.has(post.id) ? 'bg-primary-50/50' : '',
                ].join(' ')}
              >
                {/* Checkbox */}
                <div className="hidden sm:flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(post.id)}
                    onChange={() => toggleSelect(post.id)}
                    className="rounded border-neutral-300"
                  />
                </div>

                {/* Title */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/admin/blog/new?id=${post.id}`}
                      className="text-sm font-medium text-neutral-900 hover:text-primary-600 truncate transition-colors"
                    >
                      {post.title}
                    </a>
                    {post.is_auto_generated && (
                      <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-600 border border-purple-100" title="Auto-generated">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">/{post.slug}</p>
                </div>

                {/* Category */}
                <div>
                  <Badge variant="service" className="text-[10px]">
                    {CATEGORY_LABELS[post.category] || post.category}
                  </Badge>
                </div>

                {/* Status */}
                <div>
                  <button
                    onClick={() => handleToggleStatus(post)}
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${STATUS_BADGE_CLASSES[post.status] || STATUS_BADGE_CLASSES.draft}`}
                    title={`Click to ${post.status === 'published' ? 'unpublish' : 'publish'}`}
                  >
                    {post.status}
                  </button>
                </div>

                {/* Views */}
                <div className="text-sm text-neutral-600 tabular-nums">
                  {(post.view_count || 0).toLocaleString()}
                </div>

                {/* Date */}
                <div className="text-xs text-neutral-400">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => router.push(`/admin/blog/new?id=${post.id}`)}
                    className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                    title="Edit"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9"/>
                      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z"/>
                    </svg>
                  </button>
                  {post.status === 'published' && (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                      title="Preview"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" x2="21" y1="14" y2="3"/>
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Showing {(page - 1) * limit + 1}&ndash;{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 text-sm rounded border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-neutral-600 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
