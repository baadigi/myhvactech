import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Vercel Cron or manual trigger with secret
function validateCron(request: NextRequest): boolean {
  // Vercel cron sends this header automatically
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  // Also accept Vercel's built-in cron auth
  const vercelCron = request.headers.get('x-vercel-cron')
  if (vercelCron) return true

  return false
}

export async function GET(request: NextRequest) {
  if (!validateCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createAdminClient()
    const now = new Date().toISOString()

    // Find all draft posts where scheduled_at has passed
    const { data: postsToPublish, error: fetchError } = await db
      .from('blog_posts')
      .select('id, title, slug, scheduled_at')
      .eq('status', 'draft')
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', now)

    if (fetchError) {
      console.error('Fetch scheduled posts error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!postsToPublish || postsToPublish.length === 0) {
      return NextResponse.json({ published: 0, message: 'No posts due for publishing' })
    }

    // Publish each post
    const published = []
    for (const post of postsToPublish) {
      const { error: updateError } = await db
        .from('blog_posts')
        .update({
          status: 'published',
          published_at: post.scheduled_at || now,
          updated_at: now,
        })
        .eq('id', post.id)

      if (!updateError) {
        published.push({ id: post.id, title: post.title, slug: post.slug })
      } else {
        console.error('Failed to publish post:', post.id, updateError)
      }
    }

    return NextResponse.json({
      success: true,
      published: published.length,
      posts: published,
    })
  } catch (err) {
    console.error('Publish scheduled cron error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
