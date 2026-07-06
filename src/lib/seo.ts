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
