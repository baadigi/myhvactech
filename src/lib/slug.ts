// Canonical URL-slug helpers. City/state slugs MUST be generated one way so page
// routes, internal links, and the sitemap always agree. A mismatch silently
// noindexes real cities and orphans their contractors — e.g. stored "St. Louis"
// reverse-formatted to "St Louis" never matched an `ilike('city', …)` query.

/** "St. Louis" → "st-louis", "Lee's Summit" → "lees-summit". */
export function citySlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

/** "North Carolina" → "north-carolina". */
export function stateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}
