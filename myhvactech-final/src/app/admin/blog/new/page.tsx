'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string
  created_at: string
  updated_at: string
  published_at: string | null
  title: string
  slug: string
  body: string
  excerpt: string | null
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  cover_image_url: string | null
  author_name: string
  source_url: string | null
  source_name: string | null
  is_auto_generated: boolean
  meta_title: string | null
  meta_description: string | null
  view_count: number
}

const CATEGORIES = [
  { value: 'industry-news', label: 'Industry News' },
  { value: 'tips', label: 'Tips & Guides' },
  { value: 'regulations', label: 'Regulations' },
  { value: 'company-updates', label: 'Company Updates' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function BlogEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [loading, setLoading] = useState(!!editId)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [body, setBody] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState('industry-news')
  const [tagsInput, setTagsInput] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [authorName, setAuthorName] = useState('My HVAC Tech')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // UI state
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [seoOpen, setSeoOpen] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited && title) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      setSlug(generated)
    }
  }, [title, slugEdited])

  // Load existing post for editing
  const loadPost = useCallback(async () => {
    if (!editId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/blog?search=&limit=1000`)
      if (!res.ok) throw new Error('Failed to fetch posts')
      const data = await res.json()
      const post: BlogPost | undefined = data.posts?.find((p: BlogPost) => p.id === editId)
      if (post) {
        setTitle(post.title)
        setSlug(post.slug)
        setSlugEdited(true)
        setBody(post.body || '')
        setExcerpt(post.excerpt || '')
        setCategory(post.category || 'industry-news')
        setTagsInput((post.tags || []).join(', '))
        setStatus(post.status === 'published' ? 'published' : 'draft')
        setCoverImageUrl(post.cover_image_url || '')
        setAuthorName(post.author_name || 'My HVAC Tech')
        setSourceUrl(post.source_url || '')
        setSourceName(post.source_name || '')
        setMetaTitle(post.meta_title || '')
        setMetaDescription(post.meta_description || '')
      }
    } catch (err) {
      console.error('Load post error:', err)
    } finally {
      setLoading(false)
    }
  }, [editId])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  // ─── Save / Publish ────────────────────────────────────────────────────────

  const handleSave = async (saveStatus: 'draft' | 'published') => {
    if (!title.trim()) {
      alert('Title is required.')
      return
    }

    setSaving(true)
    setSavedMessage('')

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload: Record<string, unknown> = {
      title: title.trim(),
      slug: slug.trim(),
      body,
      excerpt: excerpt.trim(),
      category,
      tags,
      status: saveStatus,
      cover_image_url: coverImageUrl.trim() || null,
      author_name: authorName.trim() || 'My HVAC Tech',
      source_url: sourceUrl.trim() || null,
      source_name: sourceName.trim() || null,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDescription.trim() || null,
    }

    try {
      let res: Response

      if (editId) {
        // Update existing
        payload.id = editId
        res = await fetch('/api/admin/blog', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new
        res = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }

      const data = await res.json()

      if (data.success) {
        setSavedMessage(saveStatus === 'published' ? 'Published!' : 'Saved as draft!')
        setTimeout(() => setSavedMessage(''), 3000)

        // If creating new, redirect to edit mode
        if (!editId && data.post?.id) {
          router.replace(`/admin/blog/new?id=${data.post.id}`)
        }
      }
    } catch (err) {
      console.error('Save error:', err)
      alert(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-100 rounded w-1/3" />
          <div className="h-12 bg-neutral-100 rounded" />
          <div className="h-64 bg-neutral-100 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/blog')}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Back to blog list"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-neutral-900 font-display">
            {editId ? 'Edit Post' : 'New Post'}
          </h2>
          {savedMessage && (
            <span className="text-sm font-medium text-green-600 animate-pulse">
              {savedMessage}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            loading={saving}
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave('published')}
            loading={saving}
          >
            {status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* ─── Main Content ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-semibold text-neutral-900 placeholder:text-neutral-300 bg-transparent border-0 outline-none focus:ring-0 font-display"
          />

          {/* Slug */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-400 flex-shrink-0">/blog/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugEdited(true)
              }}
              className="flex-1 text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Body Editor Tabs */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-neutral-200">
              <button
                onClick={() => setActiveTab('write')}
                className={[
                  'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === 'write'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800',
                ].join(' ')}
              >
                Write
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={[
                  'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === 'preview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800',
                ].join(' ')}
              >
                Preview
              </button>
            </div>

            {activeTab === 'write' ? (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your post content in HTML..."
                className="w-full min-h-[480px] p-4 text-sm text-neutral-800 font-mono leading-relaxed resize-y border-0 outline-none focus:ring-0 placeholder:text-neutral-300"
              />
            ) : (
              <div className="min-h-[480px] p-6">
                {body ? (
                  <div
                    className="blog-content prose prose-sm max-w-none text-neutral-800"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                ) : (
                  <p className="text-sm text-neutral-400 italic">Nothing to preview yet. Start writing in the Write tab.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Sidebar ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Tags</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="energy-efficiency, regulations, tips"
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-[11px] text-neutral-400 mt-1">Comma-separated</p>
            {tagsInput && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tagsInput
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary-700"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Excerpt</label>
              <span className={`text-[11px] ${excerpt.length > 300 ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                {excerpt.length}/300
              </span>
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value.slice(0, 300))}
              placeholder="Brief summary of the post..."
              rows={3}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Cover Image URL</label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {coverImageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Author */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Author Name</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="My HVAC Tech"
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Source */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Source (for curated articles)</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Source URL"
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
            />
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="Source name (e.g., ACHR News)"
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* SEO Section (collapsible) */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setSeoOpen(!seoOpen)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
            >
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">SEO Settings</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-neutral-400 transition-transform ${seoOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {seoOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-neutral-100 pt-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-neutral-500">Meta Title</label>
                    <span className={`text-[11px] ${metaTitle.length > 60 ? 'text-red-500' : 'text-neutral-400'}`}>
                      {metaTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Auto-generated from title if empty"
                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-neutral-500">Meta Description</label>
                    <span className={`text-[11px] ${metaDescription.length > 160 ? 'text-red-500' : 'text-neutral-400'}`}>
                      {metaDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Auto-generated from excerpt if empty"
                    rows={3}
                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white placeholder:text-neutral-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
