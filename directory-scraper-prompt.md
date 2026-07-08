# Build Prompt: Contractor Directory Prospector

Build a Python tool that discovers and ranks high-value web directories where contractor
businesses (HVAC, plumbing, electrical, roofing, general construction) can get listed for
backlinks + citations. Output a scored, deduped CSV I can work down for link-building outreach.

## Goal
Find directories worth submitting a contractor site to — high authority, topically relevant,
dofollow where possible, real traffic, NOT spam/PBN. Quality over quantity.

## Stack & constraints
- Plain Python, single script + a `directories.csv` output. Keep it simple — this is an ETL
  pipeline, not an agent framework. No n8n.
- Discovery via search: use the Firecrawl API (search + scrape). Read keys from env.
- Enrichment via Ahrefs API v3 (Domain Rating, organic traffic, backlink/refdomain count).
  Batch calls, cache results to a local sqlite or JSON so re-runs don't re-burn API units.
- Dedupe by root domain. Idempotent — safe to re-run, skips already-enriched domains.
- No fabricated metrics. If Ahrefs returns nothing for a domain, leave the field blank, don't guess.

## Step 1 — Discover candidate directories
Run these search footprints (loop the niche word over: hvac, plumbing, electrical, roofing,
contractor, "home services", construction). Collect every result domain:
- `"submit your business" <niche>`
- `"add your listing" <niche>`
- `"add your business" <niche> directory`
- `<niche> contractor directory`
- `inurl:directory <niche>`
- `<niche> association member directory`
- `find a contractor <niche>`
Also seed a hardcoded known-good list to enrich + benchmark against:
  Angi, Houzz, Thumbtack, BuildZoom, Porch, HomeAdvisor, Yelp, BBB, Bing Places, Nextdoor,
  Chamber of Commerce sites, trade orgs (ACCA, PHCC, NATE, ASHRAE), and manufacturer
  "find a dealer/contractor" pages (Carrier, Trane, Lennox, Goodman, Rheem).

## Step 2 — Enrich each unique domain
For every root domain pull/derive:
- `domain_rating` (Ahrefs)
- `organic_traffic` (Ahrefs, monthly)
- `refdomains` count (Ahrefs)
- `niche_relevance` 0–1 — keyword-match the homepage/title (scrape via Firecrawl) against
  {contractor, hvac, plumbing, home services, construction, directory, listing}
- `submission_url` — best-guess "add/submit your business" page (scrape internal links for
  add|submit|list|join|directory)
- `is_paid` — true if the submission page mentions pricing/$/plan/upgrade, else false/unknown
- `dofollow_hint` — check if outbound listing links on a sample listing page are dofollow
- `spam_flag` — true if domain matches junk patterns (.shop link-farms, "seo/rank/backlink"
  in domain, brand-new domain w/ DR but zero real traffic) → exclude these from the shortlist

## Step 3 — Score & rank
`score = (DR * 0.4) + (relevance*100 * 0.35) + (traffic_score * 0.15) + (free?10:0 * 0.1)`,
zero out anything spam_flag=true. Sort desc.

## Output
`directories.csv` columns:
`domain, score, domain_rating, organic_traffic, refdomains, niche_relevance, is_paid,
dofollow_hint, submission_url, spam_flag, source_footprint`
Print a top-25 summary table to console at the end.

## Done =
Re-runnable script that produces a ranked CSV of legit, relevant, high-DR contractor
directories with a submission URL for each, spam excluded.
