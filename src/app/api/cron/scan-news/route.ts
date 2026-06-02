import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Vercel Cron or manual trigger with secret
function validateCron(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  const vercelCron = request.headers.get('x-vercel-cron')
  if (vercelCron) return true
  return false
}

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callPerplexity(messages: PerplexityMessage[], model = 'sonar-pro'): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not configured')

  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, max_tokens: 4000 }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Perplexity API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
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

// Generate a photoreal hero image (OpenAI gpt-image-1), store it in the public
// `blog-images` bucket, and return its public URL. Returns null on any failure
// so the post still publishes (text-only) rather than breaking the autopilot.
async function generateAndStoreHeroImage(
  db: ReturnType<typeof createAdminClient>,
  title: string,
  slug: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not configured — publishing without hero image')
    return null
  }

  try {
    const prompt = `Professional, photorealistic editorial hero image for a commercial HVAC industry article titled "${title}". Show modern commercial HVAC equipment such as rooftop units (RTUs), chillers, or a clean commercial mechanical room on or inside a commercial building. Bright, well-lit, high quality. No text, no words, no logos, no watermarks, no recognizable faces. Wide 3:2 landscape composition.`

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1536x1024', n: 1 }),
    })

    if (!res.ok) {
      console.error('Image generation failed:', res.status, (await res.text()).slice(0, 300))
      return null
    }

    const data = await res.json()
    const b64 = data?.data?.[0]?.b64_json
    if (!b64) return null

    const buffer = Buffer.from(b64, 'base64')
    const path = `auto/${slug}.png`

    const { error: upErr } = await db.storage
      .from('blog-images')
      .upload(path, buffer, { contentType: 'image/png', upsert: true })

    if (upErr) {
      console.error('Hero image upload failed:', upErr)
      return null
    }

    const { data: pub } = db.storage.from('blog-images').getPublicUrl(path)
    return pub?.publicUrl || null
  } catch (err) {
    console.error('Hero image step error:', err)
    return null
  }
}

interface QA {
  q: string
  a: string
}

// Assemble the final post body in the National LLM-SEO format:
// Section 1: Q&A direct answers (featured snippets / AI Overviews)
// Section 2: E-E-A-T body (HTML from the model)
// Section 3: FAQs + an internal-linking CTA, plus embedded FAQPage JSON-LD
function buildBody(qa: QA[], eeatBodyHtml: string, faqs: QA[]): string {
  const qaHtml = qa.length
    ? `<h2>Quick Answers for Property &amp; Facility Managers</h2>\n` +
      qa.map((p) => `<h3>${escapeHtml(p.q)}</h3>\n<p>${p.a}</p>`).join('\n')
    : ''

  const faqHtml = faqs.length
    ? `<h2>Frequently Asked Questions</h2>\n` +
      faqs.map((f) => `<h3>${escapeHtml(f.q)}</h3>\n<p>${f.a}</p>`).join('\n')
    : ''

  // Guaranteed internal links to hubs that always exist — keyword-rich anchors, no orphan pages.
  const ctaHtml = `<h2>Find a Qualified Commercial HVAC Contractor</h2>
<p>Need help acting on this? Browse vetted <a href="/contractors">commercial HVAC contractors</a> in your area, or explore <a href="/services">commercial HVAC services</a> like preventive maintenance, retrofits, and emergency repair. Are you a contractor? <a href="/for-contractors">List your business on My HVAC Tech</a> to reach property and facility managers actively searching for help.</p>`

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

  return [qaHtml, eeatBodyHtml, faqHtml, ctaHtml, faqSchema].filter(Boolean).join('\n\n')
}

export async function GET(request: NextRequest) {
  if (!validateCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createAdminClient()

    // Existing posts for de-duplication
    const { data: existingPosts } = await db.from('blog_posts').select('slug, source_url')

    const existingSlugs = new Set((existingPosts ?? []).map((p: { slug: string }) => p.slug))
    const existingSourceUrls = new Set(
      (existingPosts ?? []).map((p: { source_url: string | null }) => p.source_url).filter(Boolean)
    )

    // Step 1: Discover recent, real, sourced HVAC news (no fabricated data — Perplexity cites sources)
    const scanPrompt = `You are a commercial HVAC industry news scanner. Find the 5 most important and recent commercial HVAC news stories from the past 7 days.

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

    const scanResult = await callPerplexity([
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

    const articlePrompt = `Write a blog article about this commercial HVAC news story for property managers and facility managers (NOT technicians or homeowners), following a strict 3-section structure for AI search and featured snippets.

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
  "body_html": "<h2>Descriptive heading</h2><p>...</p>... The in-depth E-E-A-T body: 600-900 words, HTML only (h2,h3,p,ul,li,strong). Frame everything as 'what does this mean for building owners and facility managers?'. Reference real bodies (ASHRAE, DOE, EPA) where relevant. Include practical action items, equipment types, tonnage ranges, or building types. Use descriptive, keyword-relevant headings — never generic.",
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

    const articleResult = await callPerplexity([
      {
        role: 'system',
        content:
          'You are a commercial HVAC industry writer for My HVAC Tech, the commercial HVAC marketplace for property and facility managers. Write authoritative, accurate, SEO-optimized content. Never fabricate data. Return only valid JSON.',
      },
      { role: 'user', content: articlePrompt },
    ])

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

    const body = buildBody(article.qa || [], article.body_html || '', article.faqs || [])

    // Step 3: Generate the hero image (gpt-image-1) and store it. Non-fatal if it fails.
    const coverImageUrl = await generateAndStoreHeroImage(db, title, slug)

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
        category: story.category || 'industry-news',
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
