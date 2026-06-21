import { createAdminClient } from '@/lib/supabase/admin'

type AdminDb = ReturnType<typeof createAdminClient>

// Photoreal subjects rotated so blog images stay varied (no fabricated charts/data).
export const HVAC_IMAGE_SUBJECTS = [
  'a row of rooftop packaged HVAC units (RTUs) on a flat commercial building roof under a clear sky',
  'the interior of a commercial mechanical room with large water-cooled chillers and insulated piping',
  'a building automation system control panel and smart HVAC controls in a modern commercial building',
  'large commercial air handling units and sheet-metal ductwork in a mechanical penthouse',
  'a commercial office tower exterior with visible rooftop HVAC equipment, daytime',
  'a commercial HVAC service technician in PPE inspecting rooftop condenser units',
  'a bank of outdoor VRF/VRV condensing units mounted beside a modern commercial building',
  'a large rooftop cooling tower at a commercial facility, late afternoon light',
  'a commercial boiler room with industrial gas boilers and insulated piping',
  'a technician using refrigerant gauges to service a commercial rooftop unit',
  'ceiling-mounted ductwork and VAV boxes above an open commercial office ceiling',
  'rooftop HVAC units on a big-box retail store at dusk with warm sky',
]

// Deterministic per-post subject pick so each article gets a different hero image
// (was: every cover used one identical prompt → all posts looked the same).
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function pickSubject(slug: string, offset: number): string {
  return HVAC_IMAGE_SUBJECTS[(hashStr(slug) + offset) % HVAC_IMAGE_SUBJECTS.length]
}

export function imagePrompt(subject: string, title: string): string {
  return `Professional, photorealistic editorial photograph of ${subject}. Context: a commercial HVAC article titled "${title}" for property and facility managers. Bright, well-lit, sharp, realistic. No text, no words, no logos, no watermarks, no charts or graphs, no recognizable faces. Wide 3:2 landscape composition.`
}

// Generate one gpt-image-1 image, store it in the public `blog-images` bucket,
// and return its public URL. Returns null on any failure so callers can degrade
// gracefully rather than breaking the autopilot.
export async function generateAndStoreImage(
  db: AdminDb,
  prompt: string,
  path: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  // Serve WebP, not PNG: gpt-image-1 can emit WebP directly (~70% smaller).
  const webpPath = path.replace(/\.png$/i, '.webp')

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1536x1024',
        n: 1,
        output_format: 'webp',
        output_compression: 80,
      }),
    })

    if (!res.ok) {
      console.error('Image generation failed:', res.status, (await res.text()).slice(0, 300))
      return null
    }

    const data = await res.json()
    const b64 = data?.data?.[0]?.b64_json
    if (!b64) return null

    const buffer = Buffer.from(b64, 'base64')
    const { error: upErr } = await db.storage
      .from('blog-images')
      .upload(webpPath, buffer, { contentType: 'image/webp', upsert: true })

    if (upErr) {
      console.error('Image upload failed:', upErr)
      return null
    }

    const { data: pub } = db.storage.from('blog-images').getPublicUrl(webpPath)
    return pub?.publicUrl || null
  } catch (err) {
    console.error('Image step error:', err)
    return null
  }
}
