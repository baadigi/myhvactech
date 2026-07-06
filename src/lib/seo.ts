// Word-boundary-safe clamps so page <title>/meta description stay within the
// lengths Google renders (~60 chars / ~160 chars). Applied in the money-page
// generateMetadata()s; a no-op on already-short strings.

export function clampTitle(title: string, max = 60): string {
  const t = title.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim()
}

export function clampDescription(desc: string, max = 160): string {
  const d = desc.trim()
  if (d.length <= max) return d
  const cut = d.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

// Cleans a blog body's inline <img> tags before they're rendered raw:
//  1. Routes raster (png/jpg) images through the weserv proxy as width-capped
//     WebP — kills the oversized-image issue without re-uploading anything.
//  2. Guarantees every <img> has an alt (falls back to the post title).
export function optimizeBlogBody(html: string, altFallback: string): string {
  const alt = altFallback.replace(/"/g, '&quot;')
  return html
    .replace(
      /(<img\b[^>]*\bsrc=")(https?:\/\/[^"]+\.(?:png|jpe?g))(?:\?[^"]*)?"/gi,
      (_m, pre, url) =>
        `${pre}https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=1200&output=webp&q=82"`,
    )
    .replace(/<img(?![^>]*\salt=)/gi, `<img alt="${alt}"`)
}
