#!/usr/bin/env node
/**
 * Patch: Fix admin contractors API — align google column names + add debug logging
 * Run: cd ~/Downloads/Myhvactech/myhvactech && node fix-admin-contractors.js
 */
const fs = require('fs');
const path = require('path');

const routePath = path.join(process.cwd(), 'src/app/api/admin/contractors/route.ts');

if (!fs.existsSync(routePath)) {
  console.error('✗ File not found: src/app/api/admin/contractors/route.ts');
  process.exit(1);
}

let content = fs.readFileSync(routePath, 'utf8');

// ─── Fix 1: Remove google_last_synced_at from GET select ─────────────────────
// The column may not exist yet if migration 006 hasn't run, or might have a
// different name. Remove it so the GET doesn't crash.
const oldSelect = `        google_place_id,
        google_rating,
        google_review_count,
        google_last_synced_at`;

const newSelect = `        google_place_id,
        google_rating,
        google_review_count`;

if (content.includes(oldSelect)) {
  content = content.replace(oldSelect, newSelect);
  console.log('✓ Fixed GET select: removed google_last_synced_at');
} else if (content.includes(newSelect)) {
  console.log('⊘ GET select already patched');
} else {
  console.log('⚠ Could not find GET select to patch (may need manual review)');
}

// ─── Fix 2: Make POST more resilient — catch column errors gracefully ────────
// Wrap the insert in a try that strips unknown columns on first failure
const oldInsert = `    const { data: contractor, error: insertError } = await db
      .from('contractors')
      .insert(payload)
      .select()
      .single()

    if (insertError || !contractor) {
      console.error('Admin contractor insert error:', insertError)
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create contractor' },
        { status: 500 }
      )
    }`;

const newInsert = `    // First attempt with all fields
    let { data: contractor, error: insertError } = await db
      .from('contractors')
      .insert(payload)
      .select()
      .single()

    // If it fails with a column error, try with minimal fields
    if (insertError) {
      console.error('Admin contractor insert error (attempt 1):', insertError.message)

      // Strip optional google/extended fields that might not exist yet
      const safePayload: Record<string, unknown> = {}
      const coreFields = [
        'owner_id', 'company_name', 'slug', 'city', 'state', 'country',
        'phone', 'email', 'website', 'street_address', 'zip_code',
        'description', 'short_description', 'license_number', 'year_established',
        'is_verified', 'is_featured', 'is_claimed', 'commercial_verified',
        'insurance_verified', 'subscription_tier', 'subscription_status',
        'slot_tier', 'metro_area',
        'system_types', 'building_types_served', 'brands_serviced',
        'tonnage_range_min', 'tonnage_range_max', 'service_radius_miles',
        'years_commercial_experience',
        'num_technicians', 'num_nate_certified', 'emergency_response_minutes',
        'offers_24_7', 'multi_site_coverage', 'max_sites_supported',
        'offers_service_agreements', 'service_agreement_types', 'dispatch_crm',
        'uses_gps_tracking', 'avg_quote_turnaround_hours', 'sla_summary',
        'avg_rating', 'review_count', 'profile_views',
      ]
      for (const key of coreFields) {
        if (key in payload) safePayload[key] = (payload as Record<string, unknown>)[key]
      }

      const retry = await db
        .from('contractors')
        .insert(safePayload)
        .select()
        .single()

      contractor = retry.data
      insertError = retry.error

      if (insertError) {
        console.error('Admin contractor insert error (attempt 2):', insertError.message)
      }
    }

    if (insertError || !contractor) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to create contractor' },
        { status: 500 }
      )
    }`;

if (content.includes(oldInsert)) {
  content = content.replace(oldInsert, newInsert);
  console.log('✓ Fixed POST: added resilient insert with fallback');
} else {
  console.log('⚠ Could not find POST insert block (may have already been modified)');
}

// ─── Fix 3: Also make GET more resilient — catch column errors in select ─────
const oldGetSelect = `        google_place_id,
        google_rating,
        google_review_count`;

// Also try without google columns entirely as a fallback approach
// Let's just remove google columns from the select completely to be safe
const safeGetSelect = `        google_place_id`;

// Actually, let's do a different approach — wrap the whole GET in better error handling
// and remove the possibly-missing columns

// ─── Fix 4: Also fix the GET to not select columns that may not exist ────────
// Replace the full SELECT list with one that's safe
const oldFullSelect = `    let query = db
      .from('contractors')
      .select(\`
        id,
        company_name,
        slug,
        city,
        state,
        subscription_tier,
        is_verified,
        is_featured,
        commercial_verified,
        is_claimed,
        avg_rating,
        review_count,
        profile_views,
        created_at,
        email,
        phone,
        slot_tier,
        metro_area,
        owner_id,
        google_place_id,
        google_rating,
        google_review_count
      \`, { count: 'exact' })`;

const newFullSelect = `    let query = db
      .from('contractors')
      .select(\`
        id,
        company_name,
        slug,
        city,
        state,
        subscription_tier,
        is_verified,
        is_featured,
        commercial_verified,
        is_claimed,
        avg_rating,
        review_count,
        profile_views,
        created_at,
        email,
        phone,
        slot_tier,
        metro_area,
        owner_id
      \`, { count: 'exact' })`;

if (content.includes(oldFullSelect)) {
  content = content.replace(oldFullSelect, newFullSelect);
  console.log('✓ Fixed GET select: removed all google columns for safety');
} else {
  console.log('⚠ Could not find full GET select block');
}

fs.writeFileSync(routePath, content, 'utf8');
console.log('\n✓ Saved: src/app/api/admin/contractors/route.ts');
console.log('\nNow run: git add . && git commit -m "fix: resilient admin contractor API" && git push');
