import { NextResponse } from 'next/server'
// TODO: Implement CSV bulk import processor
// - Parse CSV (use papaparse or fast-csv)
// - Geocode missing lat/lng (Mapbox Geocoding API)
// - Batch insert into contractors table
// - Track progress in import_batches table

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
