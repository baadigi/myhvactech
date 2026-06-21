// ─────────────────────────────────────────────────────────────────────────────
// Trade scoping for the shared "MyBuilding" Supabase.
//
// This Supabase project is shared across multiple trade directories (HVAC,
// roofing, electrical, …); rows are partitioned by a `trade` column. This
// deployment serves the trade in NEXT_PUBLIC_TRADE (defaults to 'hvac', this
// directory's trade). Read queries filter by TRADE_KEY; inserts stamp it.
//
//   READ:   query.eq('trade', TRADE_KEY)            // or scopeTrade(query)
//   WRITE:  supabase.from('leads').insert(withTrade(payload))
//
// IMPORTANT: requires migration 011 (the `trade` column). Deploy this patch
// only AFTER that migration is applied to the shared DB.
// ─────────────────────────────────────────────────────────────────────────────

export const TRADE_KEY = process.env.NEXT_PUBLIC_TRADE || 'hvac'

/** Apply the active trade filter to a Supabase query builder. */
export function scopeTrade<Q extends { eq: (col: string, val: unknown) => Q }>(query: Q): Q {
  return query.eq('trade', TRADE_KEY)
}

/** Stamp the active trade onto an insert/upsert payload (object or array). */
export function withTrade<T extends Record<string, unknown>>(payload: T): T & { trade: string }
export function withTrade<T extends Record<string, unknown>>(payload: T[]): (T & { trade: string })[]
export function withTrade<T extends Record<string, unknown>>(
  payload: T | T[],
): (T & { trade: string }) | (T & { trade: string })[] {
  if (Array.isArray(payload)) return payload.map((p) => ({ ...p, trade: TRADE_KEY }))
  return { ...payload, trade: TRADE_KEY }
}
