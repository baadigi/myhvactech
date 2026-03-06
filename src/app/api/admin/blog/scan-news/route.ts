import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'ryan@baadigi.com'

async function validateAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || user.email !== ADMIN_EMAIL) return null
  return user
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

// ─── Perplexity API ─────────────────────────────────────────────────────────

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
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Perplexity API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ─── News Discovery ─────────────────────────────────────────────────────────

const SCAN_TOPICS = [
  'commercial HVAC product recalls 2026',
  'commercial HVAC industry news this week',
  'new HVAC regulations commercial buildings 2026',
  'HVAC refrigerant phaseout updates',
  'commercial HVAC technology innovations',
  'HVAC manufacturer announcements Carrier Trane Daikin Lennox',
  'building energy efficiency standards updates 2026',
  'commercial HVAC equipment shortages supply chain',
]

async function discoverNews(existingSlugs: Set<string>): Promise<{
  title: string
  excerpt: string
  body: string
  category: string
  tags: string[]
  source_url: string | null
  source_name: string | null
}[]> {
  // Step 1: Ask Perplexity to find recent HVAC news
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

  // Parse the discovered news
  let stories: {
    headline: string
    summary: string
    source_url: string | null
    source_name: string | null
    category: string
    tags: string[]
  }[]

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = scanResult.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    stories = JSON.parse(jsonMatch[0])
  } catch {
    console.error('Failed to parse Perplexity news scan:', scanResult.slice(0, 500))
    return []
  }

  // Step 2: Filter out stories we've already covered (by slug similarity)
  const newStories = stories.filter(s => {
    const slug = generateSlug(s.headline)
    return !existingSlugs.has(slug)
  })

  if (newStories.length === 0) return []

  // Step 3: For each new story, generate a full blog post
  const articles = []

  for (const story of newStories.slice(0, 3)) {
    try {
      const articlePrompt = `Write a comprehensive blog article about this commercial HVAC news story for an audience of property managers and facility managers (NOT technicians or homeowners).

HEADLINE: ${story.headline}
SUMMARY: ${story.summary}
SOURCE: ${story.source_name || 'Industry reports'}

Requirements:
- Title should be SEO-optimized and include relevant keywords
- Write 600-1000 words
- Use HTML formatting (h2, h3, p, ul, li, strong tags)
- Frame everything through the lens of "what does this mean for building owners and facility managers?"
- Include practical action items or recommendations
- Mention specific equipment types, tonnage ranges, or building types where relevant
- End with a call-to-action directing readers to find qualified commercial HVAC contractors
- Include a meta description (under 160 characters) for SEO
- Write a short excerpt (2-3 sentences)

Return in this exact JSON format:
{
  "title": "SEO-optimized title",
  "excerpt": "2-3 sentence excerpt for card display",
  "meta_description": "Under 160 chars for SEO",
  "body": "<h2>...</h2><p>...</p>...",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

Only return the JSON, nothing else.`

      const articleResult = await callPerplexity([
        {
          role: 'system',
          content: 'You are a commercial HVAC industry writer for My HVAC Tech, the commercial HVAC marketplace for property and facility managers. Write authoritative, SEO-optimized content. Return only valid JSON.',
        },
        { role: 'user', content: articlePrompt },
      ])

      const jsonMatch = articleResult.match(/\{[\s\S]*\}/)
      if (!jsonMatch) continue
      const article = JSON.parse(jsonMatch[0])

      articles.push({
        title: article.title || story.headline,
        excerpt: article.excerpt || story.summary,
        body: article.body || '',
        category: story.category || 'industry-news',
        tags: article.tags || story.tags || [],
        source_url: story.source_url,
        source_name: story.source_name,
      })
    } catch (err) {
      console.error('Failed to generate article for:', story.headline, err)
    }
  }

  return articles
}

// ─── POST Handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await validateAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createAdminClient()

    // Get existing post slugs to avoid duplicates
    const { data: existingPosts } = await db
      .from('blog_posts')
      .select('slug, source_url')

    const existingSlugs = new Set((existingPosts ?? []).map(p => p.slug))
    const existingSourceUrls = new Set(
      (existingPosts ?? []).map(p => p.source_url).filter(Boolean)
    )

    // Discover and generate news articles
    const articles = await discoverNews(existingSlugs)

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new stories found',
        drafts_created: 0,
      })
    }

    // Filter by source_url to avoid exact duplicates
    const uniqueArticles = articles.filter(a =>
      !a.source_url || !existingSourceUrls.has(a.source_url)
    )

    // Insert as drafts
    const inserted = []
    for (const article of uniqueArticles) {
      const slug = generateSlug(article.title)

      // Double-check slug uniqueness
      if (existingSlugs.has(slug)) continue

      const { data, error } = await db
        .from('blog_posts')
        .insert({
          title: article.title,
          slug,
          excerpt: article.excerpt,
          body: article.body,
          category: article.category,
          tags: article.tags,
          status: 'draft',
          is_auto_generated: true,
          source_url: article.source_url,
          source_name: article.source_name,
          author_name: 'My HVAC Tech',
          author_email: 'info@myhvac.tech',
          meta_description: article.excerpt?.slice(0, 160) || null,
        })
        .select('id, title, slug, status')
        .single()

      if (!error && data) {
        inserted.push(data)
        existingSlugs.add(slug)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${inserted.length} draft article(s)`,
      drafts_created: inserted.length,
      posts: inserted,
    })
  } catch (err) {
    console.error('News scan error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'News scan failed' },
      { status: 500 }
    )
  }
}
