import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ponytail: in-memory per-instance rate limit — fine for one lambda/regional
// instance; move to Upstash/KV if the agent ever gets real abuse traffic.
// quote-requests is limited too: a scope_agent lead can trigger outbound
// contractor emails, so it must not be free to hammer.
const RATE_LIMITED_PATHS: Record<string, number> = {
  '/api/ai/chat': 20,        // per IP per window
  '/api/quote-requests': 10,
}
const RATE_WINDOW_MS = 10 * 60 * 1000
const hits = new Map<string, number[]>()

export async function middleware(request: NextRequest) {
  const limit = RATE_LIMITED_PATHS[request.nextUrl.pathname]
  if (limit && request.method === 'POST') {
    const key = `${request.nextUrl.pathname}:${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'}`
    const now = Date.now()
    const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS)
    if (recent.length >= limit) {
      return NextResponse.json({ error: 'Too many requests — try again later.' }, { status: 429 })
    }
    recent.push(now)
    hits.set(key, recent)
    if (hits.size > 5000) hits.clear() // ponytail: crude memory cap
  }

  // Forward the current pathname so server components can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  // Skip Supabase session refresh if env vars aren't configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const response = await updateSession(request)
  // Preserve x-pathname on the response so it reaches server components
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
