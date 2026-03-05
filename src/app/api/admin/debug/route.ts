import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const results: Record<string, unknown> = {}

  try {
    const db = createAdminClient()
    results.adminClientOk = true

    // Test basic select
    const { data: test1, error: err1 } = await db
      .from('contractors')
      .select('id, company_name, city, state')
      .limit(1)
    results.basicSelect = err1 ? 'ERROR: ' + err1.message : 'OK: ' + (test1?.length ?? 0) + ' rows'

    // Test migration 002 columns
    const { data: test2, error: err2 } = await db
      .from('contractors')
      .select('system_types, building_types_served, commercial_verified')
      .limit(1)
    results.migration002 = err2 ? 'ERROR: ' + err2.message : 'OK'

    // Test migration 006 columns one by one
    const m006cols = ['google_place_id', 'google_rating', 'google_review_count', 'google_reviews', 'google_business_url', 'google_last_synced_at']
    for (const col of m006cols) {
      const { error } = await db.from('contractors').select(col).limit(1)
      results['col_' + col] = error ? 'MISSING: ' + error.message : 'EXISTS'
    }

    // Test claim_requests table
    const { error: err4 } = await db.from('claim_requests').select('id').limit(1)
    results.claimRequestsTable = err4 ? 'ERROR: ' + err4.message : 'OK'

    // Test a real insert + delete
    const testPayload = {
      company_name: '__debug_test__',
      slug: '__debug-test-' + Date.now(),
      city: 'Test',
      state: 'TX',
      country: 'US',
      subscription_tier: 'free',
      subscription_status: 'active',
      avg_rating: 0,
      review_count: 0,
      profile_views: 0,
      system_types: [] as string[],
      building_types_served: [] as string[],
      brands_serviced: [] as string[],
      service_agreement_types: [] as string[],
      is_verified: false,
      is_featured: false,
      is_claimed: false,
      commercial_verified: false,
      insurance_verified: false,
      offers_24_7: false,
      multi_site_coverage: false,
      offers_service_agreements: false,
      uses_gps_tracking: false,
      service_radius_miles: 50,
    }

    const { data: inserted, error: insertErr } = await db
      .from('contractors')
      .insert(testPayload)
      .select('id')
      .single()

    if (insertErr) {
      results.testInsert = 'ERROR: ' + insertErr.message + ' | code: ' + insertErr.code + ' | details: ' + JSON.stringify(insertErr.details)
    } else {
      results.testInsert = 'OK'
      if (inserted?.id) {
        await db.from('contractors').delete().eq('id', inserted.id)
        results.testCleanup = 'deleted'
      }
    }
  } catch (err: unknown) {
    results.uncaughtError = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } })
}
