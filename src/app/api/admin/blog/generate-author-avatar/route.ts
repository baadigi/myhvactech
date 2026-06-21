import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAndStoreImage } from '@/lib/blog-images'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

export const maxDuration = 120

const AVATAR_PROMPT =
  'Professional, photorealistic square headshot portrait of a friendly commercial HVAC service technician, ' +
  'mid-30s, wearing a plain navy-blue work cap and matching work shirt (no readable text or logos), ' +
  'neutral light-gray studio background, soft warm natural lighting, approachable confident smile, looking ' +
  'at the camera. Clean, trustworthy, editorial brand-portrait style. No text, no words, no logos, no ' +
  'watermarks, no badges with writing. Centered 1:1 composition suitable for a circular avatar crop.'

// POST — Generate the brand author avatar once and store it at a fixed path.
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  const db = createAdminClient()
  const url = await generateAndStoreImage(db, AVATAR_PROMPT, 'author/avatar.png', '1024x1024')

  if (!url) {
    return NextResponse.json({ error: 'Avatar generation failed (check OPENAI_API_KEY / logs)' }, { status: 500 })
  }
  return NextResponse.json({ success: true, url })
}
