// One-off: generate National LLM-SEO body + FAQ for a batch of HVAC listings and
// emit results JSON (id, slug, description_draft, faq). Writes NOTHING to the DB —
// apply the output via Supabase separately (keeps the service-role key out of here).
//
// Run:  ANTHROPIC_API_KEY=... npx tsx scripts/preview-enrich.ts <input.json> <output.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { fetchWebsiteContent, generateListingContent, type ContractorRow } from '../src/lib/listing-content'

const [inPath, outPath] = process.argv.slice(2)
if (!inPath || !outPath) throw new Error('usage: preview-enrich.ts <input.json> <output.json>')

// Optional direct write: stages into description_draft + qa_snippets + faq (prod-invisible)
// when Supabase creds are in the env (source .vercel/.env.preview.local). Live pages untouched.
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const db = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null

const rows: (ContractorRow & { id: string; slug: string; website?: string | null })[] =
  JSON.parse(readFileSync(inPath, 'utf8'))

async function main() {
  const results: { id: string; slug: string; description_draft: string; qa: unknown[]; faq: unknown[]; words: number }[] = []
  for (const c of rows) {
    const url = c.website || c.google_website || null
    try {
      const site = url ? await fetchWebsiteContent(url) : null
      const gen = await generateListingContent(c, site)
      results.push({
        id: c.id,
        slug: c.slug,
        description_draft: gen.description,
        qa: gen.qa,
        faq: gen.faq,
        words: gen.description.split(/\s+/).length,
      })
      if (db) {
        const { error } = await db
          .from('contractors')
          .update({ description_draft: gen.description, qa_snippets: gen.qa, faq: gen.faq })
          .eq('id', c.id)
        if (error) console.log(`  ⚠ write failed for ${c.slug}: ${error.message}`)
      }
      console.log(`✓ ${c.company_name} — ${gen.qa.length} QA, ${gen.description.split(/\s+/).length}w, ${gen.faq.length} FAQ${site ? '' : ' (no site)'}${db ? ' [staged]' : ''}`)
    } catch (e) {
      console.log(`✗ ${c.company_name} — ${e instanceof Error ? e.message : e}`)
    }
  }
  writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`\nWrote ${results.length}/${rows.length} → ${outPath}`)
}

main()
