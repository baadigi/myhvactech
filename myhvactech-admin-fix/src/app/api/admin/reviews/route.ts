import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function validateAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.email !== ADMIN_EMAIL) {
    return null
  }
  return user
}

// ─── GET /api/admin/reviews ───────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await validateAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'all'
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

    const db = createAdminClient()

    let query = db
      .from('reviews')
      .select(`
        id,
        created_at,
        contractor_id,
        reviewer_id,
        reviewer_name,
        reviewer_company,
        reviewer_title,
        rating,
        title,
        body,
        is_verified,
        response,
        response_date,
        status,
        project_type,
        building_type,
        contractors (
          id,
          company_name,
          slug,
          city,
          state
        )
      `, { count: 'exact' })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Admin reviews fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count by status
    const { data: statusCounts } = await db
      .from('reviews')
      .select('status')

    const counts = { all: 0, pending: 0, approved: 0, flagged: 0, removed: 0 }
    if (statusCounts) {
      counts.all = statusCounts.length
      for (const row of statusCounts as { status: string }[]) {
        if (row.status in counts) {
          counts[row.status as keyof typeof counts]++
        }
      }
    }

    return NextResponse.json({
      reviews: reviews || [],
      total: count ?? 0,
      page,
      limit,
      counts,
    })
  } catch (err) {
    console.error('Admin reviews GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/reviews ─────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = await validateAdmin(supabase)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { id: string; status: string; ids?: string[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const validStatuses = ['pending', 'approved', 'flagged', 'removed']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 422 })
    }

    const db = createAdminClient()

    // Support single update or bulk update
    if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
      const { error } = await db
        .from('reviews')
        .update({ status: body.status })
        .in('id', body.ids)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, updated: body.ids.length })
    }

    if (!body.id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 422 })
    }

    const { data: review, error: updateError } = await db
      .from('reviews')
      .update({ status: body.status })
      .eq('id', body.id)
      .select()
      .single()

    if (updateError || !review) {
      return NextResponse.json(
        { error: updateError?.message || 'Failed to update review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, review })
  } catch (err) {
    console.error('Admin reviews PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
