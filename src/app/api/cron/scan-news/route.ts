import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    .slice(0, 80)
}

export async function GET(request: NextRequest) {
  if (!validateCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = createAdminClient()

    // Get existing post slugs to avoid duplicates
    const { data: existingPosts } = await db
      .from('blog_posts')
      .select('slug, source_url')

    const existingSlugs = new Set((existingPosts ?? []).map((p: { slug: string }) => p.slug))
    const existingSourceUrls = new Set(
      (existingPosts ?? []).map((p: { source_url: string | null }) => p.source_url).filter(Boolean)
    )

    // Step 1: Discover news
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
        return NextResponse.json({ success: true, message: 'No parseable results', drafts_created: 0 })
      }
      stories = JSON.parse(jsonMatch[0])
    } catch {
      console.error('Failed to parse Perplexity news scan:', scanResult.slice(0, 500))
      return NextResponse.json({ success: true, message: 'Parse error', drafts_created: 0 })
    }

    // Filter out duplicates
    const newStories = stories.filter(s => {
      const slug = generateSlug(s.headline)
      return !existingSlugs.has(slug) && (!s.source_url || !existingSourceUrls.has(s.source_url))
    })

    if (newStories.length === 0) {
      return NextResponse.json({ success: true, message: 'No new stories found', drafts_created: 0 })
    }

    // Step 2: Generate full articles
    const inserted = []
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

        const slug = generateSlug(article.title || story.headline)
        if (existingSlugs.has(slug)) continue

        const { data, error } = await db
          .from('blog_posts')
          .insert({
            title: article.title || story.headline,
            slug,
            excerpt: article.excerpt || story.summary,
            body: article.body || '',
            category: story.category || 'industry-news',
            tags: article.tags || story.tags || [],
            status: 'draft',
            is_auto_generated: true,
            source_url: story.source_url,
            source_name: story.source_name,
            author_name: 'My HVAC Tech',
            author_email: 'info@myhvac.tech',
            meta_description: article.meta_description || (article.excerpt ? article.excerpt.slice(0, 160) : null),
          })
          .select('id, title, slug, status')
          .single()

        if (!error && data) {
          inserted.push(data)
          existingSlugs.add(slug)
        }
      } catch (err) {
        console.error('Failed to generate article for:', story.headline, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${inserted.length} draft article(s)`,
      drafts_created: inserted.length,
      posts: inserted,
    })
  } catch (err) {
    console.error('Cron news scan error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
