# myhvac.tech — Full SEO Audit Report
**Date:** March 14, 2026
**Business Type:** Commercial HVAC contractor directory / marketplace

---

## SEO Health Score: 62/100

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 55 | 13.8 |
| Content Quality | 25% | 72 | 18.0 |
| On-Page SEO | 20% | 58 | 11.6 |
| Schema / Structured Data | 10% | 80 | 8.0 |
| Performance (CWV) | 10% | 65 | 6.5 |
| Images | 5% | 50 | 2.5 |
| AI Search Readiness | 5% | 60 | 3.0 |
| **Total** | | | **63.4** |

---

## Executive Summary

### Top 5 Critical Issues
1. **Duplicate title tags** — `| My HVAC Tech | My HVAC Tech` appears on services, state, and contractor pages (double suffix)
2. **Contact page missing unique title + meta description** — inherits homepage defaults
3. **50 state pages in sitemap use wrong URL pattern** — sitemap lists `/states/california` but actual URL is `/california` (or vice versa — needs verification)
4. **No `<link rel="canonical">` tags** on most pages — risks duplicate content signals
5. **Only 2 blog posts** — massive content gap for a 751-URL site

### Top 5 Quick Wins
1. Fix the double `| My HVAC Tech` title suffix (template bug)
2. Add unique title/meta description to contact page
3. Add canonical tags site-wide
4. Add `og:image` tags (none detected on any page)
5. Mark contractor registration + lead forms as GA4 key events (already done)

---

## Technical SEO

### Crawlability ✅ Good
- **robots.txt:** Clean, blocks `/admin/`, `/dashboard/`, `/api/`, `/_next/`
- **Sitemap:** 751 URLs, properly generated from Supabase data
- **Sitemap reference:** Correctly listed in robots.txt

### Indexability ⚠️ Issues Found
- **No canonical tags** detected on homepage, contractor pages, service pages, or state pages
- **Sitemap URL mismatch risk:** State pages in sitemap use format `/{state-name}` — need to verify all 50 resolve correctly
- **City+service pages** generate potentially thousands of URLs (e.g., `/alabama/birmingham/commercial-ac-repair`) — risk of thin content / index bloat

### Security Headers ✅ Good
- HSTS enabled with preload
- X-Content-Type-Options: nosniff
- CSP configured (though overly strict — blocked map embeds)
- X-Frame-Options: SAMEORIGIN

### URL Structure ✅ Good
- Clean slug-based URLs
- Logical hierarchy: `/state/city/service`
- Contractor pages: `/contractors/{slug}`

---

## On-Page SEO

### Title Tags ⚠️ Multiple Issues

| Page | Title | Issue |
|------|-------|-------|
| Homepage | `My HVAC Tech — Find Commercial HVAC Contractors` | ✅ Good |
| Contact | `My HVAC Tech — Find Commercial HVAC Contractors` | ❌ Uses homepage default |
| Services index | `Commercial HVAC Services \| My HVAC Tech \| My HVAC Tech` | ❌ Double suffix |
| Service page | `Commercial AC Repair Contractors \| My HVAC Tech \| My HVAC Tech` | ❌ Double suffix |
| State page | `Commercial HVAC Contractors in California \| My HVAC Tech \| My HVAC Tech` | ❌ Double suffix |
| City page | `Best Commercial HVAC Contractors in Birmingham, AL \| My HVAC Tech` | ✅ Good |
| Contractor | `Fuse — San Jose, CA \| My HVAC Tech \| My HVAC Tech` | ❌ Double suffix |
| Blog index | `HVAC Industry News & Insights \| My HVAC Tech` | ✅ Good |
| Get Quotes | `Get Free Quotes from Vetted Commercial HVAC Contractors \| My HVAC Tech` | ✅ Good |
| For Contractors | (Not extracted — may be missing) | ⚠️ Check |

**Root cause:** The `metadata.title.template` in layout.tsx is `%s | My HVAC Tech`, but some pages are already appending `| My HVAC Tech` in their own title, causing duplication.

### Meta Descriptions

| Page | Description | Assessment |
|------|-------------|------------|
| Homepage | ✅ Unique, keyword-rich, 155 chars | Good |
| Contact | ❌ Uses homepage default | Missing |
| Services index | ✅ Unique | Good |
| Service pages | ✅ Unique per service | Good |
| State pages | ✅ Unique per state | Good |
| City pages | ✅ Unique per city | Good |
| Contractor pages | ✅ Unique per contractor | Good |
| Get Quotes | ✅ Unique | Good |
| Blog | ✅ Unique | Good |

### Heading Structure

| Page | H1 | Assessment |
|------|-----|------------|
| Homepage | `Find Vetted Commercial HVAC Contractors for Your Facility` | ✅ Good |
| Contact | Missing H1 (has H2 "Get in Touch") | ❌ Fix |
| Services | `Commercial HVAC Services` | ✅ Good |
| State pages | `Commercial HVAC Contractors in {State}` | ✅ Good |
| City pages | `Best Commercial HVAC Contractors in {City}, {State}` | ✅ Good |
| Contractor | Just company name (e.g., `Fuse`) | ⚠️ Could be more descriptive |
| Get Quotes | ✅ Good | Good |

### Open Graph Tags ⚠️
- `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale`, `og:type` present on homepage
- **Missing `og:image` across all pages** — no social sharing images
- Twitter card set to `summary_large_image` but no image provided

---

## Content Quality

### Homepage ✅ Strong (3,000+ words)
- Clear value proposition targeting facility/property managers
- "How It Works" section with 3 steps
- Featured contractors with real reviews
- Testimonials section
- Service browsing section
- City browsing section
- Strong CTA at bottom

### Service Pages ✅ Good (1,200 words)
- Detailed descriptions of what's included
- FAQ schema with 4 Q&As
- Contractor listings by city
- Related services linking
- Good E-E-A-T signals (certifications, system types mentioned)

### State Pages ✅ Good
- FAQPage schema
- BreadcrumbList
- City drill-down links
- Service category links
- Contractor cards

### City Pages ✅ Strong
- 19 contractors shown (Birmingham example)
- Service links
- Nearby cities
- FAQ section
- Trust badges

### Contractor Profiles ✅ Good (1,200+ words)
- Detailed about section
- Operating hours
- Google reviews integration
- Service area info
- Similar contractors
- Claim listing CTA

### Blog ❌ Critical Gap
- **Only 2 blog posts** for a 751-page site
- Topics are timely but need much more volume
- No author bylines visible
- No publish dates prominent

### Thin Content Risk ⚠️
- **City + service combination pages** (e.g., `/alabama/birmingham/commercial-ac-repair`) — potentially hundreds of pages that may have thin/duplicate content
- **Get Quotes page** ~280 words (mostly form) — acceptable for conversion page

---

## Schema / Structured Data ✅ Strong

### Implemented Schema Types
| Type | Where | Status |
|------|-------|--------|
| WebSite + SearchAction | All pages | ✅ |
| Organization | All pages | ✅ |
| HVACBusiness | Contractor profiles | ✅ Excellent |
| FAQPage | State + city + service pages | ✅ |
| BreadcrumbList | State, city, contractor, service pages | ✅ |
| Service | Service pages | ✅ |

### Missing Schema Opportunities
- **BlogPosting** schema on blog posts
- **LocalBusiness** aggregate on directory pages
- **Review/AggregateRating** on contractor pages (data exists, schema may not)
- **HowTo** schema on homepage "How It Works" section
- **ItemList** schema on contractor listing pages

---

## Performance

- GA4 loaded with `strategy="lazyOnload"` ✅
- DNS prefetch + preconnect for Google + Supabase ✅
- Next.js Image optimization configured (AVIF + WebP) ✅
- 30-day image cache TTL ✅
- No excessive third-party scripts ✅

### Concerns
- CSP blocking some resources (maps issue)
- `force-dynamic` on sitemap means it re-generates on every request (could cache)

---

## Images

- `img-src` allows all HTTPS sources ✅
- Next.js `<Image>` component used for optimization ✅
- **No OG images set** — critical for social sharing
- Alt text quality unknown (needs page-by-page check)

---

## AI Search Readiness

### Strengths
- Clear, structured content answerable by AI
- FAQ sections on key pages
- Specific data points (ratings, response times, service areas)
- SearchAction schema enables sitelinks search box

### Weaknesses
- No author/expert attribution on content
- No "About the data" or methodology section
- Limited blog content for topical authority
- No structured how-to or comparison content

---

## Priority Action Plan

### Critical (Fix Immediately)
1. **Fix double title tag suffix** — Pages are outputting `Page Title | My HVAC Tech | My HVAC Tech`. Remove the `| My HVAC Tech` from individual page titles since `layout.tsx` template already appends it.
2. **Add unique title + meta description to contact page** — Currently inherits homepage defaults.
3. **Add canonical tags** — Add `<link rel="canonical">` to all pages via layout or per-page metadata.

### High (Fix Within 1 Week)
4. **Add og:image** — Create a default social sharing image and set it in layout.tsx metadata. Add page-specific images for contractor profiles.
5. **Fix contact page H1** — Add proper H1 heading.
6. **Audit city+service pages for thin content** — Check if `/alabama/birmingham/commercial-ac-repair` pages have enough unique content or if they're near-duplicates. Consider noindexing if thin.
7. **Add BlogPosting schema** to blog post pages.

### Medium (Fix Within 1 Month)
8. **Scale blog content** — Target 2 posts/week. Topics: city-specific HVAC guides, seasonal maintenance, regulatory updates, cost guides.
9. **Add AggregateRating schema** to contractor profiles with review data.
10. **Improve contractor H1** — Change from just company name to `{Company Name} — Commercial HVAC in {City}, {State}`.
11. **Add HowTo schema** to homepage "How It Works" section.
12. **Add author pages/bylines** to blog for E-E-A-T signals.
13. **Create OG images per page type** — contractor photos, service illustrations, city skylines.

### Low (Backlog)
14. Cache sitemap (remove `force-dynamic` or use ISR).
15. Add ItemList schema to directory listing pages.
16. Add "About Our Data" page explaining how contractors are vetted.
17. Consider adding video content for service pages.
18. Set up Google Search Console and submit sitemap.
