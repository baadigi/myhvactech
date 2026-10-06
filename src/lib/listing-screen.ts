import { isIP } from 'node:net'
import { externalUrl } from '@/lib/utils'
import { tradeFit } from '@/lib/trade-guard'

// Automated first look at a self-registered listing: does this business's own
// website read like the trade this directory covers? The result is advice for the
// admin review queue — a person still approves or rejects every listing.

export interface ListingScreen {
  verdict: 'match' | 'mismatch' | 'unknown'
  reason: string
  site_title: string | null
  checked_at: string
}

const FETCH_TIMEOUT_MS = 6000
const MAX_HTML_CHARS = 300_000
const MAX_REDIRECTS = 4

// The URL comes from a signup form, so only fetch ordinary public web hosts.
function publicHttpUrl(website: string | null | undefined): URL | null {
  const normalized = externalUrl(website)
  if (!normalized) return null
  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  const host = url.hostname.toLowerCase()
  if (isIP(host.replace(/^\[|\]$/g, ''))) return null
  if (!host.includes('.') || /\.(local|internal|localhost)$/.test(host)) return null
  return url
}

function visibleText(html: string): { title: string | null; text: string } {
  const rawTitle = html.match(/<title[^>]*>([^<]{0,200})/i)?.[1] ?? ''
  const title = rawTitle.replace(/&amp;/g, '&').replace(/&#0?39;|&#x27;/g, "'").replace(/\s+/g, ' ').trim() || null
  const metaDescription = html.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0]
    ?.match(/content=["']([^"']{0,400})/i)?.[1] ?? ''
  const body = html
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
  return { title, text: `${title ?? ''} ${metaDescription} ${body}` }
}

async function fetchSiteText(start: URL): Promise<{ title: string | null; text: string } | null> {
  try {
    const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
    let url = start
    // Follow redirects by hand so every hop gets the same public-host check.
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await fetch(url, {
        signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DirectoryListingCheck/1.0)',
          Accept: 'text/html',
        },
      })
      if (res.status >= 300 && res.status < 400) {
        const next = publicHttpUrl(new URL(res.headers.get('location') ?? '', url).toString())
        if (!next) return null
        url = next
        continue
      }
      if (!res.ok) return null
      const html = (await res.text()).slice(0, MAX_HTML_CHARS)
      return visibleText(html)
    }
    return null
  } catch {
    return null
  }
}

export async function screenListing(input: {
  company_name: string
  website?: string | null
}): Promise<ListingScreen> {
  const checked_at = new Date().toISOString()
  const url = publicHttpUrl(input.website)
  const site = url ? await fetchSiteText(url) : null

  // The website is the best evidence; the name is the fallback when it can't be read.
  if (site) {
    const fit = tradeFit(site.text)
    if (fit.verdict === 'match') {
      return { verdict: 'match', reason: 'Website mentions this trade', site_title: site.title, checked_at }
    }
    if (fit.verdict === 'mismatch') {
      return {
        verdict: 'mismatch',
        reason: `Website reads as ${fit.otherTrade}, with no mention of this trade`,
        site_title: site.title,
        checked_at,
      }
    }
  }

  const nameFit = tradeFit(input.company_name)
  const siteNote = !input.website
    ? 'No website given'
    : site
      ? 'Website does not mention this trade'
      : 'Website could not be read'
  if (nameFit.verdict === 'mismatch') {
    return {
      verdict: 'mismatch',
      reason: `${siteNote}; company name reads as ${nameFit.otherTrade}`,
      site_title: site?.title ?? null,
      checked_at,
    }
  }
  const nameNote = nameFit.verdict === 'match' ? '; company name mentions this trade' : ''
  return { verdict: 'unknown', reason: `${siteNote}${nameNote}`, site_title: site?.title ?? null, checked_at }
}
