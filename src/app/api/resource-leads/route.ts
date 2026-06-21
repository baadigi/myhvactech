import { NextResponse } from 'next/server'
import { pushLeadToGHL } from '@/lib/ghl'

// Top-of-funnel lead capture for the /resources tools (checklist/RFP download,
// maintenance-plan builder). Pushes straight to GoHighLevel as a tagged contact —
// does NOT route to contractors (these are earlier-funnel than a quote request).
export async function POST(request: Request) {
  let body: {
    name?: string
    email?: string
    phone?: string
    city?: string
    state?: string
    source?: string
    note?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { name, email, phone, city, state, source = 'resource', note } = body
  if (!email && !phone) {
    return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 })
  }

  await pushLeadToGHL({
    name: name ?? null,
    email: email ?? null,
    phone: phone ?? null,
    city: city ?? null,
    state: state ?? null,
    source,
    tags: ['directory-lead', 'resource', source],
    note: note ?? null,
  })

  return NextResponse.json({ success: true })
}
