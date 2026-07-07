import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TRADE_KEY } from '@/lib/trade-scope'
import {
  type ContractorRow,
  type FaqItem,
  fetchWebsiteContent,
  generateListingContent,
  generateFallback,
} from '@/lib/listing-content'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}

// Build a ContractorRow from inline form data (Add page — no DB record yet)
function formDataToContractorRow(form: Record<string, unknown>): ContractorRow {
  return {
    company_name: (form.company_name as string) || 'Unknown',
    city: (form.city as string) || '',
    state: (form.state as string) || '',
    year_established: form.year_established ? Number(form.year_established) : null,
    system_types: (form.system_types as string[]) || [],
    building_types_served: (form.building_types_served as string[]) || [],
    brands_serviced: (form.brands_serviced as string[]) || [],
    emergency_response_minutes: form.emergency_response_minutes ? Number(form.emergency_response_minutes) : null,
    offers_24_7: !!form.offers_24_7,
    multi_site_coverage: !!form.multi_site_coverage,
    max_sites_supported: form.max_sites_supported ? Number(form.max_sites_supported) : null,
    num_technicians: form.num_technicians ? Number(form.num_technicians) : null,
    num_nate_certified: form.num_nate_certified ? Number(form.num_nate_certified) : null,
    years_commercial_experience: form.years_commercial_experience ? Number(form.years_commercial_experience) : null,
    offers_service_agreements: !!form.offers_service_agreements,
    service_agreement_types: (form.service_agreement_types as string[]) || [],
    sla_summary: (form.sla_summary as string) || null,
    google_rating: form.google_rating ? Number(form.google_rating) : null,
    google_review_count: form.google_review_count ? Number(form.google_review_count) : null,
    google_editorial_summary: (form.google_editorial_summary as string) || null,
    google_formatted_address: (form.google_formatted_address as string) || null,
    google_phone: (form.google_phone as string) || null,
    google_website: (form.google_website as string) || null,
    google_reviews: (form.google_reviews as ContractorRow['google_reviews']) || null,
    tonnage_range_min: form.tonnage_range_min ? Number(form.tonnage_range_min) : null,
    tonnage_range_max: form.tonnage_range_max ? Number(form.tonnage_range_max) : null,
    service_radius_miles: form.service_radius_miles ? Number(form.service_radius_miles) : 50,
    license_number: (form.license_number as string) || null,
    insurance_verified: !!form.insurance_verified,
    uses_gps_tracking: !!form.uses_gps_tracking,
    dispatch_crm: (form.dispatch_crm as string) || null,
    description: (form.description as string) || null,
  }
}

// POST — Generate a National LLM-SEO listing (About body + FAQ) for a contractor.
// Body: { contractor_id: string, save?: boolean }  OR  { form_data: {...}, save?: false }
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { contractor_id, save, form_data } = body

    if (!contractor_id && !form_data) {
      return NextResponse.json({ error: 'contractor_id or form_data is required' }, { status: 400 })
    }

    const db = createAdminClient()
    let c: ContractorRow

    if (contractor_id) {
      const { data: contractor, error } = await db
        .from('contractors')
        .select('*')
        .eq('trade', TRADE_KEY)
        .eq('id', contractor_id)
        .single()
      if (error || !contractor) {
        return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
      }
      c = contractor as unknown as ContractorRow
    } else {
      c = formDataToContractorRow(form_data)
    }

    const websiteUrl = c.google_website || (form_data?.website as string) || null
    const websiteText = websiteUrl ? await fetchWebsiteContent(websiteUrl) : null

    let description: string
    let shortDescription = ''
    let metaDescription = ''
    let qa: FaqItem[] = []
    let faq: FaqItem[] = []
    let source: 'claude' | 'template'

    try {
      const gen = await generateListingContent(c, websiteText)
      description = gen.description
      shortDescription = gen.short
      metaDescription = gen.meta
      qa = gen.qa
      faq = gen.faq
      source = 'claude'
    } catch (aiErr) {
      console.error('Claude generation failed, using template fallback:', aiErr)
      description = generateFallback(c)
      source = 'template'
    }

    // Backfill short/meta if the model left them thin.
    if (!shortDescription || shortDescription.length < 100) {
      const rating = c.google_rating ? ` ${c.google_rating}★ rated.` : ''
      shortDescription = `Commercial HVAC contractor in ${c.city}, ${c.state}.${rating} Verified reviews, free quotes.`.slice(0, 160)
    }
    if (!metaDescription || metaDescription.length < 100) {
      metaDescription = `${c.company_name} — commercial HVAC contractor in ${c.city}, ${c.state}. Read verified reviews, compare services, and request free quotes.`.slice(0, 160)
    }

    if (save && contractor_id) {
      const { error: updateError } = await db
        .from('contractors')
        .update({
          description,
          short_description: shortDescription,
          meta_description: metaDescription,
          ...(qa.length > 0 ? { qa_snippets: qa } : {}),
          ...(faq.length > 0 ? { faq } : {}),
        })
        .eq('id', contractor_id)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      description,
      short_description: shortDescription,
      meta_description: metaDescription,
      qa_snippets: qa,
      faq,
      source,
      saved: !!(save && contractor_id),
      word_count: description.split(/\s+/).length,
      website_fetched: !!websiteText,
    })
  } catch (err) {
    console.error('Generate description error:', err)
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 })
  }
}
