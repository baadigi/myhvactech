import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export async function GET() {
  const db = createAdminClient()

  const { data: posts } = await db
    .from('blog_posts')
    .select('title, slug, excerpt, body, author_name, author_email, category, published_at, cover_image_url, tags, updated_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(50)

  const items = (posts ?? []).map((post) => {
    const pubDate = new Date(post.published_at).toUTCString()
    const description = post.excerpt || (post.body ? stripHtml(post.body).slice(0, 300) + '...' : '')
    const link = `${SITE_URL}/blog/${post.slug}`
    const guid = link

    // Category tags
    const categoryTags = post.tags?.length
      ? post.tags.map((t: string) => `      <category>${escapeXml(t)}</category>`).join('\n')
      : post.category
        ? `      <category>${escapeXml(post.category)}</category>`
        : ''

    // Cover image as enclosure
    const enclosure = post.cover_image_url
      ? `      <enclosure url="${escapeXml(post.cover_image_url)}" type="image/jpeg" />`
      : ''

    // Media content for podcast/aggregator compatibility
    const mediaContent = post.cover_image_url
      ? `      <media:content url="${escapeXml(post.cover_image_url)}" medium="image" />`
      : ''

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
${post.body ? `      <content:encoded><![CDATA[${post.body}]]></content:encoded>` : ''}
      <author>${post.author_email ? escapeXml(post.author_email) : 'info@myhvac.tech'} (${escapeXml(post.author_name)})</author>
${categoryTags}
${enclosure}
${mediaContent}
    </item>`
  }).join('\n')

  const lastBuildDate = posts?.[0]?.published_at
    ? new Date(posts[0].published_at).toUTCString()
    : new Date().toUTCString()

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <channel>
    <title>${escapeXml(SITE_NAME)} — Commercial HVAC Industry News</title>
    <link>${SITE_URL}/blog</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${SITE_URL}</link>
    </image>
    <managingEditor>info@myhvac.tech (${escapeXml(SITE_NAME)})</managingEditor>
    <webMaster>info@myhvac.tech (${escapeXml(SITE_NAME)})</webMaster>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(SITE_NAME)}. All rights reserved.</copyright>
    <ttl>60</ttl>
    <category>Commercial HVAC</category>
    <category>Facility Management</category>
    <category>Property Management</category>
${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
