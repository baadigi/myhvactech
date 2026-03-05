import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function validateAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.email !== ADMIN_EMAIL) {
    return null
  }
  return user
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── GET /api/admin/blog ──────────────────────────────────────────────────────
// List all posts with search, category, status filter, pagination, sorting

export async function GET(request: NextRequest) {
  try {
    const admin = await validateAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || ''
    const status = url.searchParams.get('status') || ''
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const sort = url.searchParams.get('sort') || 'created_at'
    const order = url.searchParams.get('order') || 'desc'
    const offset = (page - 1) * limit

    const db = createAdminClient()

    let query = db
      .from('blog_posts')
      .select('*', { count: 'exact' })

    // Filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,body.ilike.%${search}%`)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Sorting
    const validSortFields = ['created_at', 'published_at', 'view_count', 'updated_at', 'title']
    const sortField = validSortFields.includes(sort) ? sort : 'created_at'
    const ascending = order === 'asc'

    query = query
      .order(sortField, { ascending, nullsFirst: false })
      .range(offset, offset + limit - 1)

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Admin blog fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      posts: posts || [],
      total: count ?? 0,
      page,
      limit,
    })
  } catch (err) {
    console.error('Admin blog GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/admin/blog ─────────────────────────────────────────────────────
// Create a new blog post

export async function POST(request: NextRequest) {
  try {
    const admin = await validateAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const {
      title,
      body: postBody,
      excerpt,
      category = 'industry-news',
      tags = [],
      cover_image_url,
      status = 'draft',
      source_url,
      source_name,
      is_auto_generated = false,
      author_name = 'My HVAC Tech',
      meta_title,
      meta_description,
    } = body as {
      title: string
      body?: string
      excerpt?: string
      category?: string
      tags?: string[]
      cover_image_url?: string
      status?: string
      source_url?: string
      source_name?: string
      is_auto_generated?: boolean
      author_name?: string
      meta_title?: string
      meta_description?: string
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 422 })
    }

    // Generate slug from title
    let slug = generateSlug(title)

    // De-duplicate slug
    const db = createAdminClient()
    const { data: existing } = await db
      .from('blog_posts')
      .select('slug')
      .like('slug', `${slug}%`)

    if (existing && existing.length > 0) {
      const existingSlugs = new Set(existing.map((p: { slug: string }) => p.slug))
      if (existingSlugs.has(slug)) {
        let counter = 2
        while (existingSlugs.has(`${slug}-${counter}`)) {
          counter++
        }
        slug = `${slug}-${counter}`
      }
    }

    // Auto-generate SEO fields if not provided
    const finalMetaTitle = meta_title || `${title} | My HVAC Tech Blog`
    const excerptText = excerpt || (typeof postBody === 'string' ? postBody.replace(/<[^>]*>/g, '').slice(0, 300) : '')
    const finalMetaDescription = meta_description || excerptText.slice(0, 160)

    const now = new Date().toISOString()

    const insertData: Record<string, unknown> = {
      title: title.trim(),
      slug,
      body: postBody || '',
      excerpt: excerpt || '',
      category,
      tags: Array.isArray(tags) ? tags : [],
      cover_image_url: cover_image_url || null,
      status,
      source_url: source_url || null,
      source_name: source_name || null,
      is_auto_generated,
      author_name,
      author_email: admin.email,
      meta_title: finalMetaTitle,
      meta_description: finalMetaDescription,
      published_at: status === 'published' ? now : null,
      updated_at: now,
    }

    const { data: post, error } = await db
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Admin blog create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (err) {
    console.error('Admin blog POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/blog ────────────────────────────────────────────────────
// Update an existing blog post

export async function PATCH(request: NextRequest) {
  try {
    const admin = await validateAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { id, ...updates } = body
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 422 })
    }

    const db = createAdminClient()

    // If status is changing to published, check if published_at needs to be set
    if (updates.status === 'published') {
      const { data: existingPost } = await db
        .from('blog_posts')
        .select('published_at')
        .eq('id', id)
        .single()

      if (existingPost && !existingPost.published_at) {
        updates.published_at = new Date().toISOString()
      }
    }

    // Always update the updated_at timestamp
    updates.updated_at = new Date().toISOString()

    // Allowed fields for update
    const allowedFields = [
      'title', 'slug', 'body', 'excerpt', 'category', 'tags',
      'cover_image_url', 'status', 'source_url', 'source_name',
      'is_auto_generated', 'author_name', 'meta_title', 'meta_description',
      'published_at', 'updated_at',
    ]

    const sanitized: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in updates) {
        sanitized[key] = updates[key]
      }
    }

    const { data: post, error } = await db
      .from('blog_posts')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Admin blog update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post })
  } catch (err) {
    console.error('Admin blog PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/admin/blog ───────────────────────────────────────────────────
// Delete a blog post by id

export async function DELETE(request: NextRequest) {
  try {
    const admin = await validateAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { id: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 422 })
    }

    const db = createAdminClient()

    const { error } = await db
      .from('blog_posts')
      .delete()
      .eq('id', body.id)

    if (error) {
      console.error('Admin blog delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin blog DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
