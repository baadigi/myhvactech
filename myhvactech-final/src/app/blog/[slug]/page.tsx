import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Calendar, Clock, User, Tag, ExternalLink, Newspaper } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  'industry-news': 'Industry News',
  tips: 'Tips & Guides',
  regulations: 'Regulations',
  'company-updates': 'Company Updates',
}

function estimateReadTime(body: string | null): number {
  if (!body) return 1
  const text = body.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 225))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string | null
  cover_image_url: string | null
  category: string
  author_name: string
  published_at: string
  tags: string[] | null
  meta_title: string | null
  meta_description: string | null
  source_url: string | null
  source_name: string | null
  view_count: number
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, meta_title, meta_description, cover_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      type: 'article',
      ...(post.cover_image_url ? { images: [{ url: post.cover_image_url }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    notFound()
  }

  const typedPost = post as BlogPost

  const readTime = estimateReadTime(typedPost.body)

  // Fetch related posts (same category, excluding current post)
  const { data: relatedPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, category, author_name, published_at, body')
    .eq('status', 'published')
    .eq('category', typedPost.category)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(3)

  const headingFont = {
    fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)',
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* Cover Image */}
        {typedPost.cover_image_url && (
          <div className="relative w-full max-h-96 rounded-xl overflow-hidden mb-8">
            <img
              src={typedPost.cover_image_url}
              alt={typedPost.title}
              className="w-full h-full max-h-96 object-cover"
            />
          </div>
        )}

        {/* Post Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
            {CATEGORY_LABELS[typedPost.category] || typedPost.category}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(typedPost.published_at)}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
            <Clock className="w-3.5 h-3.5" />
            {readTime} min read
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
            <User className="w-3.5 h-3.5" />
            {typedPost.author_name || 'My HVAC Tech'}
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight mb-8"
          style={headingFont}
        >
          {typedPost.title}
        </h1>

        {/* Article Body */}
        {typedPost.body && (
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: typedPost.body }}
          />
        )}

        {/* Source Attribution */}
        {typedPost.source_url && (
          <div className="mt-10 pt-6 border-t border-neutral-200">
            <p className="text-sm text-neutral-500 flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" />
              Originally sourced from{' '}
              <a
                href={typedPost.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline underline-offset-2 hover:text-primary-700"
              >
                {typedPost.source_name || 'external source'}
              </a>
            </p>
          </div>
        )}

        {/* Tags */}
        {typedPost.tags && typedPost.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-neutral-400" />
            {typedPost.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* View Counter Script */}
        <ViewCounter slug={slug} />
      </article>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="border-t border-neutral-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <h2
              className="text-xl font-bold text-neutral-900 mb-6"
              style={headingFont}
            >
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map(
                (related: {
                  id: string
                  title: string
                  slug: string
                  excerpt: string | null
                  cover_image_url: string | null
                  category: string
                  author_name: string
                  published_at: string
                  body: string | null
                }) => {
                  const relatedReadTime = estimateReadTime(related.body)
                  return (
                    <Link
                      key={related.id}
                      href={`/blog/${related.slug}`}
                      className="group bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
                    >
                      <div className="relative h-36 overflow-hidden">
                        {related.cover_image_url ? (
                          <img
                            src={related.cover_image_url}
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary-100 via-primary-50 to-sky-100 flex items-center justify-center">
                            <Newspaper className="w-8 h-8 text-primary-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <h3
                          className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2"
                          style={headingFont}
                        >
                          {related.title}
                        </h3>
                        <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                          <span>{formatDate(related.published_at)}</span>
                          <span>{relatedReadTime} min read</span>
                        </div>
                      </div>
                    </Link>
                  )
                }
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function ViewCounter({ slug }: { slug: string }) {
  // Using a script tag to fire the view count increment client-side
  const script = `
    (function() {
      fetch('/api/blog/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: '${slug.replace(/'/g, "\\'")}' }),
      }).catch(function() {});
    })();
  `
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
