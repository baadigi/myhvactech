import fs from 'node:fs'
import path from 'node:path'

// Server-only: which service slugs have a real photo tile in /public/images/services.
// Read once at module load. Missing files simply fall back to the branded gradient tile,
// so a tile is never blank/black. When ejecting to another trade, drop new images in the
// same folder (matching {slug}.png/.webp) and they light up automatically.
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'services')
const EXTS = ['.webp', '.png', '.jpg', '.jpeg']

let cached: Map<string, string> | null = null

function load(): Map<string, string> {
  // Cache only in production (files are static after build). In dev, re-read every
  // time so newly-added images appear without a server restart.
  if (cached && process.env.NODE_ENV === 'production') return cached
  const map = new Map<string, string>()
  try {
    for (const file of fs.readdirSync(IMAGE_DIR)) {
      const ext = path.extname(file).toLowerCase()
      if (!EXTS.includes(ext)) continue
      const slug = path.basename(file, ext)
      // Prefer webp when both exist (EXTS order puts webp first).
      if (!map.has(slug)) map.set(slug, `/images/services/${file}`)
    }
  } catch {
    // Folder may not exist yet — that's fine, everything falls back to gradient tiles.
  }
  cached = map
  return map
}

/** Returns the public image path for a service slug, or null if none exists. */
export function serviceImage(slug: string): string | null {
  return load().get(slug) ?? null
}
