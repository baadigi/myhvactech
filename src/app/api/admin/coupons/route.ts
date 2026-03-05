import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

// GET — List all coupons
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ coupons: data })
}

// POST — Create a new coupon
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { code, discount_type, discount_value, valid_from, valid_until, max_uses } = body

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json(
        { error: 'Code, discount_type, and discount_value are required' },
        { status: 400 }
      )
    }

    if (!['percent', 'fixed'].includes(discount_type)) {
      return NextResponse.json(
        { error: 'discount_type must be "percent" or "fixed"' },
        { status: 400 }
      )
    }

    if (discount_type === 'percent' && (discount_value < 1 || discount_value > 100)) {
      return NextResponse.json(
        { error: 'Percent discount must be between 1 and 100' },
        { status: 400 }
      )
    }

    const db = createAdminClient()

    const { data, error } = await db.from('coupons').insert({
      code: code.toUpperCase().trim(),
      discount_type,
      discount_value: Number(discount_value),
      valid_from: valid_from || new Date().toISOString(),
      valid_until: valid_until || null,
      max_uses: max_uses ? Number(max_uses) : null,
      is_active: true,
    }).select().single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, coupon: data })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// PATCH — Update a coupon (toggle active, edit fields)
export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Coupon id is required' }, { status: 400 })
    }

    // Only allow safe fields to be updated
    const allowed: Record<string, unknown> = {}
    if ('is_active' in updates) allowed.is_active = updates.is_active
    if ('discount_type' in updates) allowed.discount_type = updates.discount_type
    if ('discount_value' in updates) allowed.discount_value = Number(updates.discount_value)
    if ('valid_until' in updates) allowed.valid_until = updates.valid_until || null
    if ('max_uses' in updates) allowed.max_uses = updates.max_uses ? Number(updates.max_uses) : null
    if ('code' in updates) allowed.code = updates.code.toUpperCase().trim()

    const db = createAdminClient()
    const { data, error } = await db
      .from('coupons')
      .update(allowed)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, coupon: data })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE — Delete a coupon
export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Coupon id is required' }, { status: 400 })
    }

    const db = createAdminClient()
    const { error } = await db.from('coupons').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
