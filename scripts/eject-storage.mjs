// Copy the blog-images storage bucket from the shared MyTech Supabase to a
// buyer's new project. Run AFTER eject-trade.sh + restore.sh.
//
// By default copies the WHOLE bucket (only ~62MB / ~212 files) — simplest and
// safe: unused cross-trade images just sit there, harmless. Pass --referenced-only
// to best-effort copy just files whose name matches one of the trade's post slugs
// (plus shared author/* assets).
//
//   SOURCE_URL=https://dcxiruohzhbftqwpvhxo.supabase.co \
//   SOURCE_SERVICE_KEY=... \
//   TARGET_URL=https://NEWREF.supabase.co \
//   TARGET_SERVICE_KEY=... \
//   node scripts/eject-storage.mjs hvac [--referenced-only]
//
// Service keys: Supabase dashboard -> Project Settings -> API -> service_role key.
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'blog-images'
const TRADE = process.argv[2]
const REFERENCED_ONLY = process.argv.includes('--referenced-only')

const { SOURCE_URL, SOURCE_SERVICE_KEY, TARGET_URL, TARGET_SERVICE_KEY } = process.env
if (!TRADE || !SOURCE_URL || !SOURCE_SERVICE_KEY || !TARGET_URL || !TARGET_SERVICE_KEY) {
  console.error('usage: node scripts/eject-storage.mjs <trade> [--referenced-only]')
  console.error('needs env: SOURCE_URL SOURCE_SERVICE_KEY TARGET_URL TARGET_SERVICE_KEY')
  process.exit(1)
}

const src = createClient(SOURCE_URL, SOURCE_SERVICE_KEY)
const dst = createClient(TARGET_URL, TARGET_SERVICE_KEY)

// Recursively list every object path under a prefix.
async function listAll(client, prefix = '') {
  const out = []
  let offset = 0
  for (;;) {
    const { data, error } = await client.storage.from(BUCKET).list(prefix, {
      limit: 100, offset, sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    if (!data.length) break
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) out.push(...await listAll(client, path)) // folder
      else out.push(path)
    }
    if (data.length < 100) break
    offset += 100
  }
  return out
}

// Optional filter: keep files referenced by this trade's blog posts.
async function referencedPaths() {
  const { data, error } = await src.from('blog_posts').select('slug').eq('trade', TRADE)
  if (error) throw error
  const slugs = data.map(r => r.slug).filter(Boolean)
  return (path) => {
    if (path.startsWith('author/')) return true          // shared assets
    const base = path.replace(/^auto\//, '')
    // filenames are slug-prefixed (possibly truncated), so match on the longest slug that fits
    return slugs.some(s => base.startsWith(s.slice(0, Math.min(s.length, 40))))
  }
}

async function main() {
  console.log(`>> ensuring target bucket '${BUCKET}'...`)
  await dst.storage.createBucket(BUCKET, { public: true }).catch(() => {}) // ignore "already exists"

  let paths = await listAll(src)
  console.log(`>> ${paths.length} objects in source bucket`)
  if (REFERENCED_ONLY) {
    const keep = await referencedPaths()
    const before = paths.length
    paths = paths.filter(keep)
    console.log(`>> --referenced-only: keeping ${paths.length}/${before} (matched to '${TRADE}' posts + shared)`)
  }

  let ok = 0, fail = 0
  for (const path of paths) {
    try {
      const { data: blob, error: dlErr } = await src.storage.from(BUCKET).download(path)
      if (dlErr) throw dlErr
      const buf = Buffer.from(await blob.arrayBuffer())
      const { error: upErr } = await dst.storage.from(BUCKET).upload(path, buf, {
        contentType: blob.type || 'image/webp', upsert: true,
      })
      if (upErr) throw upErr
      ok++
      if (ok % 25 === 0) console.log(`   ...${ok} copied`)
    } catch (e) {
      fail++
      console.error(`   FAIL ${path}: ${e.message}`)
    }
  }
  console.log(`>> done. ${ok} copied, ${fail} failed.`)
  if (fail) process.exit(1)
}

main().catch(e => { console.error(e); process.exit(1) })
