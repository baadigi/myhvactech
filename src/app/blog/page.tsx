import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, User, ArrowRight, Newspaper } from 'lucide-react'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'HVAC Industry News & Insights',
  description:
    'Stay informed on commercial HVAC industry news, tips, regulations, and best practices for property and facility managers.',
  alternates: { canonical: `${SITE_URL}/blog` },
}

const CATEGORIES = [
  { slug: 'all', label: 'All' },
  { slug: 'industry-news', label: 'Industry News' },
  { slug: 'tips', label: 'Tips & Guides' },
  { slug: 'regulations', label: 'Regulations' },
  { slug: 'company-updates', label: 'Company Updates' },
] as const

const CATEGORY_LABELS: Record<string, string> = {
  'industry-news': 'Industry News',
  tips: 'Tips & Guides',
  regulations: 'Regulations',
  'company-updates': 'Company Updates',
}

const POSTS_PER_PAGE = 12

function estimateReadTime(body: string | null): number {
  if (!body) return 1
  const text = body.replace(/<[^>]*>/g, '')
  const words = text.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 225))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
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
}

export default async function BlogListingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const params = await searchParams
  const activeCategory = params.category || 'all'
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))

  const supabase = await createClient()

  let query = supabase
    .from('blog_posts')
    .select(
      'id, title, slug, excerpt, body, cover_image_url, category, author_name, published_at, tags',
      { count: 'exact' }
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (activeCategory !== 'all') {
    query = query.eq('category', activeCategory)
  }

  const from = (currentPage - 1) * POSTS_PER_PAGE
  const to = from + POSTS_PER_PAGE - 1

  const { data: posts, count } = await query.range(from, to)

  const totalPages = count ? Math.ceil(count / POSTS_PER_PAGE) : 0

  const headingFont = {
    fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)',
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-3xl">
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight"
              style={headingFont}
            >
              HVAC Industry News &amp; Insights
            </h1>
            <p className="mt-4 text-lg text-primary-100 leading-relaxed">
              Stay informed on commercial HVAC trends, maintenance tips,
              regulatory updates, and expert insights for property and facility
              managers.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto py-1 -mb-px" aria-label="Blog categories">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.slug
              const href =
                cat.slug === 'all' ? '/blog' : `/blog?category=${cat.slug}`
              return (
                <Link
                  key={cat.slug}
                  href={href}
                  className={`
                    whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150
                    ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }
                  `}
                >
                  {cat.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Blog Post Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {!posts || posts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-400 mb-6">
              <Newspaper className="w-8 h-8" />
            </div>
            <h2
              className="text-xl font-semibold text-neutral-900 mb-3"
              style={headingFont}
            >
              No articles published yet
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              Check back soon for commercial HVAC industry news, tips, and
              insights.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: BlogPost) => {
                const readTime = estimateReadTime(post.body)
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
                  >
                    {/* Cover Image or Gradient Placeholder */}
                    <div className="relative h-48 overflow-hidden">
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-100 via-primary-50 to-sky-100 flex items-center justify-center">
                          <Newspaper className="w-10 h-10 text-primary-300" />
                        </div>
                      )}
                      {/* Category Badge */}
                      <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-primary-700">
                        {CATEGORY_LABELS[post.category] || post.category}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-col flex-1 p-5">
                      <h3
                        className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors duration-150 line-clamp-2"
                        style={headingFont}
                      >
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 text-sm text-neutral-600 line-clamp-2 flex-1">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {post.author_name || 'My HVAC Tech'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(post.published_at)}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {readTime} min
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className="flex items-center justify-center gap-2 mt-12"
                aria-label="Blog pagination"
              >
                {currentPage > 1 && (
                  <Link
                    href={`/blog?${activeCategory !== 'all' ? `category=${activeCategory}&` : ''}page=${currentPage - 1}`}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Previous
                  </Link>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 2
                  )
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push('...')
                    }
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, idx) =>
                    typeof item === 'string' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-neutral-400"
                      >
                        ...
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={`/blog?${activeCategory !== 'all' ? `category=${activeCategory}&` : ''}page=${item}`}
                        className={`inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                          item === currentPage
                            ? 'bg-primary-500 text-white'
                            : 'text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                {currentPage < totalPages && (
                  <Link
                    href={`/blog?${activeCategory !== 'all' ? `category=${activeCategory}&` : ''}page=${currentPage + 1}`}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  )
}
