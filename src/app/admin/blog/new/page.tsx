'use client'

import { useState, useEffect, useCallback, useRef, DragEvent, ClipboardEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string
  created_at: string
  updated_at: string
  published_at: string | null
  scheduled_at: string | null
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

// ─── Image Upload Helper ──────────────────────────────────────────────────────

async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Upload failed')
  }
  const data = await res.json()
  return data.url || null
}

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
  const [scheduledAt, setScheduledAt] = useState('')

  // UI state
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')
  const [seoOpen, setSeoOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [insertingImage, setInsertingImage] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const dragCounter = useRef(0)

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
        if (post.scheduled_at) {
          // Convert to local datetime for the input
          const d = new Date(post.scheduled_at)
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          setScheduledAt(local.toISOString().slice(0, 16))
          setScheduleOpen(true)
        }
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

  // ─── Image Insert Helper ────────────────────────────────────────────────

  const insertImageAtCursor = useCallback(async (file: File) => {
    setInsertingImage(true)
    try {
      const url = await uploadImage(file)
      if (url) {
        const imgTag = `\n<img src="${url}" alt="" style="width:100%;border-radius:8px;margin:1rem 0;" />\n`
        const textarea = bodyRef.current
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const newBody = body.substring(0, start) + imgTag + body.substring(end)
          setBody(newBody)
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + imgTag.length
            textarea.focus()
          }, 0)
        } else {
          setBody((prev) => prev + imgTag)
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setInsertingImage(false)
    }
  }, [body])

  // ─── Drag & Drop Handlers ──────────────────────────────────────────────

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(f => f.type.startsWith('image/'))
    if (imageFile) {
      await insertImageAtCursor(imageFile)
    }
  }, [insertImageAtCursor])

  // ─── Paste Handler ─────────────────────────────────────────────────────

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.type.startsWith('image/'))
    if (imageItem) {
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) {
        await insertImageAtCursor(file)
      }
    }
  }, [insertImageAtCursor])

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

    // Convert local datetime to ISO string for the API
    let scheduledAtISO: string | null = null
    if (scheduledAt && saveStatus === 'draft') {
      scheduledAtISO = new Date(scheduledAt).toISOString()
    }

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
      scheduled_at: saveStatus === 'published' ? null : scheduledAtISO,
    }

    try {
      let res: Response

      if (editId) {
        payload.id = editId
        res = await fetch('/api/admin/blog', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
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
        let msg = saveStatus === 'published' ? 'Published!' : 'Saved as draft!'
        if (saveStatus === 'draft' && scheduledAtISO) {
          const d = new Date(scheduledAtISO)
          msg = `Scheduled for ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        }
        setSavedMessage(msg)
        setTimeout(() => setSavedMessage(''), 4000)

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
            <span className={`text-sm font-medium animate-pulse ${savedMessage.startsWith('Scheduled') ? 'text-blue-600' : 'text-green-600'}`}>
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
            {scheduledAt ? 'Schedule' : 'Save Draft'}
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave('published')}
            loading={saving}
          >
            {status === 'published' ? 'Update' : 'Publish Now'}
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
          <div
            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${
              isDragging ? 'border-primary-400 ring-2 ring-primary-100' : 'border-neutral-200'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex items-center border-b border-neutral-200">
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

              {/* Insert Image button */}
              <div className="ml-auto pr-3">
                <label
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                    insertingImage
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      await insertImageAtCursor(file)
                      e.target.value = ''
                    }}
                  />
                  {insertingImage ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                      Insert Image
                    </>
                  )}
                </label>
              </div>
            </div>

            {activeTab === 'write' ? (
              <div className="relative">
                {isDragging && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary-50/90 backdrop-blur-sm">
                    <div className="text-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-primary-500 mb-2" aria-hidden="true">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                      <p className="text-sm font-medium text-primary-700">Drop image to insert</p>
                      <p className="text-xs text-primary-500 mt-0.5">JPEG, PNG, WebP, GIF</p>
                    </div>
                  </div>
                )}
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Write your post content in HTML... (you can also drag & drop or paste images)"
                  className="w-full min-h-[480px] p-4 text-sm text-neutral-800 font-mono leading-relaxed resize-y border-0 outline-none focus:ring-0 placeholder:text-neutral-300"
                />
              </div>
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

          {/* Schedule */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setScheduleOpen(!scheduleOpen)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={scheduledAt ? 'text-blue-500' : 'text-neutral-400'} aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Schedule Post
                </span>
                {scheduledAt && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                    Set
                  </span>
                )}
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-neutral-400 transition-transform ${scheduleOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {scheduleOpen && (
              <div className="px-4 pb-4 border-t border-neutral-100 pt-3">
                <p className="text-[11px] text-neutral-500 mb-2">
                  Set a date and time to auto-publish this post. Leave empty to keep as draft.
                </p>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {scheduledAt && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-blue-600 font-medium">
                      Will auto-publish at this time
                    </p>
                    <button
                      onClick={() => setScheduledAt('')}
                      className="text-[11px] text-red-500 hover:text-red-700 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
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
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Cover Image</label>
            {coverImageUrl ? (
              <div className="relative">
                <div className="rounded-lg overflow-hidden border border-neutral-100">
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
                <button
                  onClick={() => setCoverImageUrl('')}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50 transition-colors"
                  title="Remove image"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" x2="6" y1="6" y2="18"/>
                    <line x1="6" x2="18" y1="6" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                uploading ? 'border-primary-300 bg-primary-50' : 'border-neutral-200 hover:border-primary-400 hover:bg-primary-50/50'
              }`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading(true)
                    try {
                      const url = await uploadImage(file)
                      if (url) {
                        setCoverImageUrl(url)
                      }
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setUploading(false)
                      e.target.value = ''
                    }
                  }}
                />
                {uploading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-primary-500 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span className="text-xs text-primary-600 font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400 mb-1" aria-hidden="true">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                    <span className="text-xs text-neutral-500">Click to upload image</span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">JPEG, PNG, WebP, GIF - max 5MB</span>
                  </>
                )}
              </label>
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
