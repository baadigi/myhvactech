import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// One run does up to 2 Perplexity calls + 4 image generations sequentially,
// so give the function plenty of headroom (Vercel Pro allows up to 300s).
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Vercel Cron or manual trigger with secret.
// Vercel's scheduler does NOT send an Authorization header unless CRON_SECRET
// is set, so we also accept its x-vercel-cron header and vercel-cron user-agent.
function validateCron(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  if (request.headers.get('x-vercel-cron')) return true
  if ((request.headers.get('user-agent') || '').toLowerCase().includes('vercel-cron')) return true
  return false
}

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callPerplexity(
  messages: PerplexityMessage[],
  model = 'sonar-pro',
  maxTokens = 4000
): Promise<{ content: string; citations: string[] }> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not configured')

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Perplexity API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  // Perplexity returns the real sources it used (top-level `citations`, or
  // `search_results[].url` on newer responses). We render these as outbound links.
  const citations: string[] = Array.isArray(data.citations)
    ? data.citations
    : Array.isArray(data.search_results)
      ? data.search_results.map((r: { url?: string }) => r.url).filter(Boolean)
      : []
  return { content, citations }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^(.{0,80})-.*$/, '$1')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Photoreal subjects rotated so in-body images stay varied (no fabricated charts/data).
const HVAC_IMAGE_SUBJECTS = [
  'a row of rooftop packaged HVAC units (RTUs) on a flat commercial building roof under a clear sky',
  'the interior of a commercial mechanical room with large water-cooled chillers and insulated piping',
  'a building automation system control panel and smart HVAC controls in a modern commercial building',
  'large commercial air handling units and sheet-metal ductwork in a mechanical penthouse',
  'a commercial office tower exterior with visible rooftop HVAC equipment, daytime',
  'a commercial HVAC service technician in PPE inspecting rooftop condenser units',
]

function imagePrompt(subject: string, title: string): string {
  return `Professional, photorealistic editorial photograph of ${subject}. Context: a commercial HVAC article titled "${title}" for property and facility managers. Bright, well-lit, sharp, realistic. No text, no words, no logos, no watermarks, no charts or graphs, no recognizable faces. Wide 3:2 landscape composition.`
}

// Generate one gpt-image-1 image, store it in the public `blog-images` bucket,
// and return its public URL. Returns null on any failure so the post still
// publishes (without that image) rather than breaking the autopilot.
async function generateAndStoreImage(
  db: ReturnType<typeof createAdminClient>,
  prompt: string,
  path: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  // Serve WebP, not PNG: gpt-image-1 can emit WebP directly (~70% smaller than
  // the default PNG), which is the whole point of the image-optimization pass.
  const webpPath = path.replace(/\.png$/i, '.webp')

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1536x1024',
        n: 1,
        output_format: 'webp',
        output_compression: 80,
      }),
    })

    if (!res.ok) {
      console.error('Image generation failed:', res.status, (await res.text()).slice(0, 300))
      return null
    }

    const data = await res.json()
    const b64 = data?.data?.[0]?.b64_json
    if (!b64) return null

    const buffer = Buffer.from(b64, 'base64')
    const { error: upErr } = await db.storage
      .from('blog-images')
      .upload(webpPath, buffer, { contentType: 'image/webp', upsert: true })

    if (upErr) {
      console.error('Image upload failed:', upErr)
      return null
    }

    const { data: pub } = db.storage.from('blog-images').getPublicUrl(webpPath)
    return pub?.publicUrl || null
  } catch (err) {
    console.error('Image step error:', err)
    return null
  }
}

function figureHtml(url: string, alt: string): string {
  return `<figure class="my-8"><img src="${url}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" width="1536" height="1024" class="w-full h-auto rounded-lg" /></figure>`
}

// Insert up to `maxImages` photoreal images between the <h2> sections of the
// E-E-A-T body, after every 2nd section, to break up the text on every post.
async function insertInlineImages(
  db: ReturnType<typeof createAdminClient>,
  bodyHtml: string,
  slug: string,
  title: string,
  maxImages: number
): Promise<string> {
  if (!process.env.OPENAI_API_KEY || !bodyHtml) return bodyHtml

  const sections = bodyHtml.split(/(?=<h2)/i).filter((s) => s.trim())
  if (sections.length < 3) return bodyHtml

  const out: string[] = []
  let made = 0
  for (let i = 0; i < sections.length; i++) {
    out.push(sections[i])
    const afterSection = i + 1
    if (made < maxImages && afterSection >= 2 && afterSection % 2 === 0 && i < sections.length - 1) {
      const subject = HVAC_IMAGE_SUBJECTS[made % HVAC_IMAGE_SUBJECTS.length]
      const url = await generateAndStoreImage(
        db,
        imagePrompt(subject, title),
        `auto/${slug}-inline-${made + 1}.png`
      )
      if (url) {
        out.push(figureHtml(url, `${subject} — commercial HVAC`))
        made++
      }
    }
  }
  return out.join('\n')
}

interface QA {
  q: string
  a: string
}

// Assemble the final post body in the National LLM-SEO format:
// Section 1: Q&A direct answers (featured snippets / AI Overviews)
// Section 2: E-E-A-T body (HTML from the model)
// Section 3: FAQs + an internal-linking CTA, plus embedded FAQPage JSON-LD
function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'source'
  }
}

function buildBody(
  qa: QA[],
  eeatBodyHtml: string,
  faqs: QA[],
  sources: string[],
  relatedLinks: { slug: string; title: string }[],
  locationLink: { path: string; city: string } | null = null
): string {
  const qaHtml = qa.length
    ? `<h2>Quick Answers for Property &amp; Facility Managers</h2>\n` +
      qa.map((p) => `<h3>${escapeHtml(p.q)}</h3>\n<p>${p.a}</p>`).join('\n')
    : ''

  // FAQs as native <details>/<summary> accordions — collapsible UX, but the answer
  // text stays in the served HTML so crawlers + AI engines still read it.
  const faqHtml = faqs.length
    ? `<h2>Frequently Asked Questions</h2>\n` +
      faqs
        .map(
          (f) =>
            `<details class="faq-item border-b border-neutral-200 py-3"><summary class="font-semibold cursor-pointer">${escapeHtml(
              f.q
            )}</summary><div class="mt-2 text-neutral-700"><p>${f.a}</p></div></details>`
        )
        .join('\n')
    : ''

  // Contextual internal links to other posts (pillar/cluster, keyword-rich anchors).
  const relatedHtml = relatedLinks.length
    ? `<h2>Related Reading on My HVAC Tech</h2>\n<ul>\n` +
      relatedLinks
        .map((r) => `<li><a href="/blog/${r.slug}">${escapeHtml(r.title)}</a></li>`)
        .join('\n') +
      `\n</ul>`
    : ''

  // Guaranteed internal links to hubs that always exist — keyword-rich anchors, no orphan pages.
  // City posts also link directly to their /[state]/[city] location page (the cluster).
  const ctaHtml = locationLink
    ? `<h2>Find a Qualified Commercial HVAC Contractor in ${escapeHtml(locationLink.city)}</h2>
<p>Looking for help in ${escapeHtml(locationLink.city)}? See <a href="${locationLink.path}">commercial HVAC contractors in ${escapeHtml(
        locationLink.city
      )}</a>. You can also browse <a href="/contractors">all commercial HVAC contractors</a>, explore <a href="/services">commercial HVAC services</a> like preventive maintenance, retrofits, and emergency repair, or — if you're a contractor — <a href="/for-contractors">list your business on My HVAC Tech</a>.</p>`
    : `<h2>Find a Qualified Commercial HVAC Contractor</h2>
<p>Need help acting on this? Browse vetted <a href="/contractors">commercial HVAC contractors</a> in your area, or explore <a href="/services">commercial HVAC services</a> like preventive maintenance, retrofits, and emergency repair. Are you a contractor? <a href="/for-contractors">List your business on My HVAC Tech</a> to reach property and facility managers actively searching for help.</p>`

  // Real outbound source links from Perplexity's citations (deduped, nofollow).
  const uniqueSources = Array.from(new Set(sources.filter(Boolean))).slice(0, 6)
  const sourcesHtml = uniqueSources.length
    ? `<h2>Sources</h2>\n<ol>\n` +
      uniqueSources
        .map(
          (u) =>
            `<li><a href="${u}" target="_blank" rel="nofollow noopener">${escapeHtml(
              hostnameOf(u)
            )}</a></li>`
        )
        .join('\n') +
      `\n</ol>`
    : ''

  // FAQPage JSON-LD embedded in the body so it ships in the served HTML (crawler-readable).
  const faqSchema = faqs.length
    ? `<script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: stripHtml(f.q),
          acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.a) },
        })),
      })}</script>`
    : ''

  return [qaHtml, eeatBodyHtml, faqHtml, relatedHtml, ctaHtml, sourcesHtml, faqSchema]
    .filter(Boolean)
    .join('\n\n')
}

// Every post is written for this audience — commercial only.
const AUDIENCE = 'property managers, facility managers, and building owners'

const CATEGORY_GUIDANCE: Record<string, string> = {
  tips: 'Write a practical, in-depth how-to guide. Include checklists, step-by-step processes, concrete action items, equipment specifics (rooftop units, chillers, VRF), tonnage ranges (50-500+ tons), and cost/ROI context.',
  regulations:
    'Explain the regulation or standard clearly: what it is, who it applies to, key requirements, deadlines, penalties for non-compliance, and a step-by-step compliance roadmap. Reference the actual regulatory bodies (ASHRAE, DOE, EPA, the AIM Act, relevant state/local laws).',
  'industry-news':
    'Cover the current state, trends, and recent developments, framed around what they mean for the audience.',
  'company-updates':
    'Cover recent manufacturer and company developments (Carrier, Trane, Daikin, Lennox, Johnson Controls, etc.) and what they mean for the audience.',
}

const ARTICLE_JSON_SHAPE = `Return ONLY valid JSON in this exact shape:
{
  "title": "SEO-optimized H1 title with the primary keyword",
  "meta_title": "Under 60 chars, primary keyword first",
  "meta_description": "Under 160 chars, compelling, includes primary keyword",
  "excerpt": "2-3 sentence excerpt for card display",
  "qa": [
    { "q": "The core highest-volume question the audience would ask", "a": "Direct 40-60 word answer optimized for a featured snippet. May include <strong> tags." },
    { "q": "A second authority/friction-reducing question", "a": "Direct 40-60 word answer." }
  ],
  "body_html": "<h2>Descriptive heading</h2><p>...</p>... 900-1200 words across 5-7 <h2> sections with descriptive, keyword-relevant headings (never generic). HTML only (h2,h3,p,ul,li,strong). Include practical action items, equipment types, tonnage ranges, or building types.",
  "faqs": [
    { "q": "Expert FAQ targeting national search / AI follow-up", "a": "50-100 word authoritative answer covering cost/ROI, compliance, risks, or buyer criteria." }
  ],
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

Requirements:
- 2-3 items in "qa", 4-6 items in "faqs". All headings descriptive and keyword-relevant.
- Audience is ${AUDIENCE} of COMMERCIAL buildings (offices, retail, healthcare, warehouses) — NOT homeowners or technicians. Frame everything as "what does this mean for ${AUDIENCE}?".
- Authoritative, accurate, conversion-aware. Never invent statistics. Output JSON only, no markdown fences.`

function keywordArticlePrompt(keyword: string, category: string, targetCity: string | null): string {
  const cityLine = targetCity
    ? `\nLocalize for ${targetCity}: reference the local market naturally, but do NOT fabricate local statistics.`
    : ''
  return `Write an authoritative, SEO-optimized ${category} article for My HVAC Tech (the commercial HVAC marketplace) targeting the search keyword "${keyword}".
Research the topic with current, accurate information and cite real sources.
${CATEGORY_GUIDANCE[category] || ''}${cityLine}
Use "${keyword}" naturally in the title, at least one heading, and throughout the body.

${ARTICLE_JSON_SHAPE}`
}

// Keyword queue takes priority over fresh news. Picks the highest-priority queued
// topic, writes a keyword-targeted post, publishes it, and marks the topic done.
// Returns a result object, or null if the queue is empty (caller falls back to news).
async function tryGenerateFromQueue(
  db: ReturnType<typeof createAdminClient>,
  category: string | null = null
): Promise<Record<string, unknown> | null> {
  let q = db
    .from('blog_topics')
    .select('id, primary_keyword, category, target_city, location_page_path')
    .eq('status', 'queued')
  if (category) q = q.eq('category', category)
  const { data: topicRows } = await q
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
  const topic = topicRows?.[0] as
    | { id: string; primary_keyword: string; category: string; target_city: string | null; location_page_path: string | null }
    | undefined
  if (!topic) return null

  const now = new Date().toISOString()
  await db.from('blog_topics').update({ status: 'generating', updated_at: now }).eq('id', topic.id)
  const revert = async () => {
    await db.from('blog_topics').update({ status: 'queued', updated_at: new Date().toISOString() }).eq('id', topic.id)
  }

  try {
    const { content: articleResult, citations } = await callPerplexity(
      [
        {
          role: 'system',
          content: `You are a commercial HVAC industry writer for My HVAC Tech. Audience: ${AUDIENCE}. Write authoritative, accurate, SEO-optimized content. Never fabricate data. Return only valid JSON.`,
        },
        { role: 'user', content: keywordArticlePrompt(topic.primary_keyword, topic.category, topic.target_city) },
      ],
      'sonar-pro',
      6000
    )

    const m = articleResult.match(/\{[\s\S]*\}/)
    if (!m) {
      await revert()
      return { success: true, message: 'Keyword generation returned no JSON', published: 0 }
    }
    let article: {
      title?: string
      meta_title?: string
      meta_description?: string
      excerpt?: string
      qa?: QA[]
      body_html?: string
      faqs?: QA[]
      tags?: string[]
    }
    try {
      article = JSON.parse(m[0])
    } catch {
      await revert()
      return { success: true, message: 'Keyword article parse error', published: 0 }
    }

    const title = article.title || topic.primary_keyword
    const slug = generateSlug(title)
    const { data: dup } = await db.from('blog_posts').select('id').eq('slug', slug).maybeSingle()
    if (dup) {
      await revert()
      return { success: true, message: 'Duplicate slug, skipped', published: 0 }
    }

    const coverImageUrl = await generateAndStoreImage(
      db,
      imagePrompt('a clean wide establishing view of commercial HVAC equipment', title),
      `auto/${slug}.png`
    )
    const bodyWithImages = await insertInlineImages(db, article.body_html || '', slug, title, 3)
    const { data: relatedRows } = await db
      .from('blog_posts')
      .select('slug, title')
      .eq('status', 'published')
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(2)
    const relatedLinks = (relatedRows || []) as { slug: string; title: string }[]
    const locationLink =
      topic.location_page_path && topic.target_city
        ? { path: topic.location_page_path, city: topic.target_city }
        : null
    const body = buildBody(article.qa || [], bodyWithImages, article.faqs || [], citations, relatedLinks, locationLink)

    const { data, error } = await db
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt: article.excerpt || '',
        body,
        cover_image_url: coverImageUrl,
        category: topic.category || 'industry-news',
        tags: article.tags || [],
        status: 'published',
        published_at: now,
        is_auto_generated: true,
        author_name: 'My HVAC Tech',
        author_email: 'info@myhvac.tech',
        meta_title: article.meta_title || title,
        meta_description: article.meta_description || (article.excerpt ? article.excerpt.slice(0, 160) : null),
      })
      .select('id, title, slug, status')
      .single()

    if (error) {
      await revert()
      console.error('Failed to publish keyword article:', error)
      return { error: error.message }
    }

    await db
      .from('blog_topics')
      .update({ status: 'published', published_post_id: data.id, published_at: now, updated_at: now })
      .eq('id', topic.id)

    return {
      success: true,
      message: 'Published 1 article from keyword queue',
      published: 1,
      mode: 'keyword',
      keyword: topic.primary_keyword,
      post: data,
    }
  } catch (err) {
    await revert()
    console.error('Queue generation error:', err)
    return { error: 'Queue generation failed' }
  }
}

export async function GET(request: NextRequest) {
  if (!validateCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createAdminClient()

    // Weekly category rotation (cron runs Mon-Sat): Mon News, Tue Tips, Wed Regs,
    // Thu Company, Fri Tips, Sat News  => News 2 / Tips 2 / Regs 1 / Company 1.
    // Tips & Regulations come from the keyword queue; News & Company from the live scan.
    const CATEGORY_BY_DAY: Record<number, string> = {
      1: 'industry-news', 2: 'tips', 3: 'regulations', 4: 'company-updates', 5: 'tips', 6: 'industry-news', 0: 'tips',
    }
    const target = CATEGORY_BY_DAY[new Date().getUTCDay()] || 'tips'

    if (target === 'tips' || target === 'regulations') {
      // Prefer the targeted category; if its queue is empty, take any queued topic.
      const queued = (await tryGenerateFromQueue(db, target)) || (await tryGenerateFromQueue(db, null))
      if (queued) return NextResponse.json(queued)
      // Nothing queued at all → fall through to the news scan below.
    }
    const newsFocus =
      target === 'company-updates'
        ? '\nPRIORITIZE manufacturer and company news: product launches, acquisitions, partnerships, earnings, leadership changes, and recalls from Carrier, Trane, Daikin, Lennox, York, Mitsubishi, Johnson Controls, Rheem, and Bosch.'
        : ''

    // Existing posts for de-duplication
    const { data: existingPosts } = await db.from('blog_posts').select('slug, source_url')

    const existingSlugs = new Set((existingPosts ?? []).map((p: { slug: string }) => p.slug))
    const existingSourceUrls = new Set(
      (existingPosts ?? []).map((p: { source_url: string | null }) => p.source_url).filter(Boolean)
    )

    // Step 1: Discover recent, real, sourced HVAC news (no fabricated data — Perplexity cites sources)
    const scanPrompt = `You are a commercial HVAC industry news scanner. Find the 5 most important and recent commercial HVAC news stories from the past 7 days.${newsFocus}

Focus on:
- Product recalls affecting commercial equipment
- New regulations or code changes for commercial buildings
- Refrigerant phaseout updates (R-410A, HFC regulations)
- Major manufacturer announcements (Carrier, Trane, Daikin, Lennox, York, Mitsubishi, Johnson Controls)
- Energy efficiency standard changes (ASHRAE, DOE, EPA)
- Supply chain issues affecting commercial HVAC
- Notable industry acquisitions or partnerships
- New commercial HVAC technology or products

For each story, provide in this exact JSON format:
[
  {
    "headline": "exact headline",
    "summary": "2-3 sentence summary",
    "source_url": "url of the original article if available, or null",
    "source_name": "publication name",
    "category": "one of: industry-news, regulations, tips, company-updates",
    "tags": ["tag1", "tag2", "tag3"]
  }
]

Only return the JSON array, nothing else. Only include stories from the last 7 days. If you can't find 5 recent stories, return fewer.`

    const { content: scanResult } = await callPerplexity([
      { role: 'system', content: 'You are a commercial HVAC industry news analyst. Return only valid JSON.' },
      { role: 'user', content: scanPrompt },
    ])

    let stories: {
      headline: string
      summary: string
      source_url: string | null
      source_name: string | null
      category: string
      tags: string[]
    }[]

    try {
      const jsonMatch = scanResult.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return NextResponse.json({ success: true, message: 'No parseable results', published: 0 })
      }
      stories = JSON.parse(jsonMatch[0])
    } catch {
      console.error('Failed to parse Perplexity news scan:', scanResult.slice(0, 500))
      return NextResponse.json({ success: true, message: 'Parse error', published: 0 })
    }

    // De-dupe against what we already have
    const newStories = stories.filter((s) => {
      const slug = generateSlug(s.headline)
      return !existingSlugs.has(slug) && (!s.source_url || !existingSourceUrls.has(s.source_url))
    })

    if (newStories.length === 0) {
      return NextResponse.json({ success: true, message: 'No new stories found', published: 0 })
    }

    // Step 2: Generate ONE article per run (cadence handles frequency), in the National LLM-SEO format.
    const story = newStories[0]

    const articlePrompt = `Write a blog article about this commercial HVAC news story for ${AUDIENCE} (NOT technicians or homeowners), following a strict 3-section structure for AI search and featured snippets.

HEADLINE: ${story.headline}
SUMMARY: ${story.summary}
SOURCE: ${story.source_name || 'Industry reports'}

Return ONLY valid JSON in this exact shape:
{
  "title": "SEO-optimized H1 title with the primary keyword",
  "meta_title": "Under 60 chars, primary keyword first",
  "meta_description": "Under 160 chars, compelling, includes primary keyword",
  "excerpt": "2-3 sentence excerpt for card display",
  "qa": [
    { "q": "The core highest-volume question a property manager would ask", "a": "Direct 40-60 word answer optimized for a featured snippet. May include <strong> tags." },
    { "q": "A second authority/friction-reducing question", "a": "Direct 40-60 word answer." }
  ],
  "body_html": "<h2>Descriptive heading</h2><p>...</p>... The in-depth E-E-A-T body: 900-1200 words across 5-7 <h2> sections with descriptive, keyword-relevant headings (never generic). HTML only (h2,h3,p,ul,li,strong). Frame everything as 'what does this mean for building owners and facility managers?'. Reference real bodies (ASHRAE, DOE, EPA) where relevant. Include practical action items, equipment types, tonnage ranges, or building types.",
  "faqs": [
    { "q": "Expert FAQ targeting a national search / AI follow-up", "a": "50-100 word authoritative answer covering cost/ROI, compliance, risks, or buyer criteria." }
  ],
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

Requirements:
- Provide 2-3 items in "qa" and 4-6 items in "faqs".
- All headings descriptive and keyword-relevant.
- Authoritative, accurate, conversion-aware tone. Do not invent statistics — only state facts supported by the source or well-established industry standards.
- Output JSON only, no markdown fences.`

    const { content: articleResult, citations: articleCitations } = await callPerplexity([
      {
        role: 'system',
        content:
          'You are a commercial HVAC industry writer for My HVAC Tech, the commercial HVAC marketplace for property and facility managers. Write authoritative, accurate, SEO-optimized content. Never fabricate data. Return only valid JSON.',
      },
      { role: 'user', content: articlePrompt },
    ], 'sonar-pro', 6000)

    const jsonMatch = articleResult.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ success: true, message: 'Article generation returned no JSON', published: 0 })
    }

    let article: {
      title?: string
      meta_title?: string
      meta_description?: string
      excerpt?: string
      qa?: QA[]
      body_html?: string
      faqs?: QA[]
      tags?: string[]
    }
    try {
      article = JSON.parse(jsonMatch[0])
    } catch {
      console.error('Failed to parse generated article:', articleResult.slice(0, 500))
      return NextResponse.json({ success: true, message: 'Article parse error', published: 0 })
    }

    const title = article.title || story.headline
    const slug = generateSlug(title)
    if (existingSlugs.has(slug)) {
      return NextResponse.json({ success: true, message: 'Duplicate slug, skipped', published: 0 })
    }

    // Step 3: Generate the hero image + 2-3 photoreal in-body images. All non-fatal.
    const coverImageUrl = await generateAndStoreImage(
      db,
      imagePrompt('a clean wide establishing view of commercial HVAC equipment', title),
      `auto/${slug}.png`
    )
    const bodyWithImages = await insertInlineImages(db, article.body_html || '', slug, title, 3)

    // Internal links: pull 2 recent published posts (excluding this one) for a
    // related-reading cluster with keyword-rich anchors.
    const { data: relatedRows } = await db
      .from('blog_posts')
      .select('slug, title')
      .eq('status', 'published')
      .neq('slug', slug)
      .order('published_at', { ascending: false })
      .limit(2)
    const relatedLinks = (relatedRows || []) as { slug: string; title: string }[]

    const body = buildBody(article.qa || [], bodyWithImages, article.faqs || [], articleCitations, relatedLinks)

    const now = new Date().toISOString()

    // Step 4: Auto-publish (status='published') — this is the autopilot.
    const { data, error } = await db
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt: article.excerpt || story.summary,
        body,
        cover_image_url: coverImageUrl,
        category: target === 'company-updates' ? 'company-updates' : story.category || 'industry-news',
        tags: article.tags || story.tags || [],
        status: 'published',
        published_at: now,
        is_auto_generated: true,
        source_url: story.source_url,
        source_name: story.source_name,
        author_name: 'My HVAC Tech',
        author_email: 'info@myhvac.tech',
        meta_title: article.meta_title || title,
        meta_description:
          article.meta_description || (article.excerpt ? article.excerpt.slice(0, 160) : null),
      })
      .select('id, title, slug, status')
      .single()

    if (error) {
      console.error('Failed to publish article:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Published 1 article',
      published: 1,
      post: data,
    })
  } catch (err) {
    console.error('Scan-news cron error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
