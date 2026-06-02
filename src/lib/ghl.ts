// Pushes inbound leads into GoHighLevel as contacts, tagged so they land in the
// right Smart List. Two streams:
//   • 'directory-contractor' — businesses registering/claiming a listing
//   • 'directory-lead'        — customers requesting quotes / contacting
// Fire-and-forget: never blocks or fails the user's form submission.

const GHL_BASE = 'https://services.leadconnectorhq.com'
const GHL_VERSION = '2021-07-28'

export interface GhlLead {
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  companyName?: string | null
  source?: string
  tags: string[]
  city?: string | null
  state?: string | null
}

function splitName(full?: string | null): { firstName: string; lastName: string } {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

/**
 * Upsert a contact into GHL (dedupes by email/phone). Returns true on success.
 * Swallows all errors — lead capture must never fail because GHL is down.
 */
export async function pushLeadToGHL(lead: GhlLead): Promise<boolean> {
  const token = process.env.GHL_API_TOKEN
  const locationId = process.env.GHL_LOCATION_ID
  if (!token || !locationId) {
    console.warn('GHL not configured — skipping lead push')
    return false
  }
  if (!lead.email && !lead.phone) return false // need at least one identifier

  const { firstName, lastName } = lead.firstName
    ? { firstName: lead.firstName, lastName: lead.lastName || '' }
    : splitName(lead.name)

  try {
    const res = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Version: GHL_VERSION,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        companyName: lead.companyName || undefined,
        city: lead.city || undefined,
        state: lead.state || undefined,
        source: lead.source || 'myhvac.tech',
        tags: lead.tags,
      }),
    })
    if (!res.ok) {
      console.error('GHL lead push failed:', res.status, (await res.text()).slice(0, 200))
      return false
    }
    return true
  } catch (err) {
    console.error('GHL lead push error:', err)
    return false
  }
}
