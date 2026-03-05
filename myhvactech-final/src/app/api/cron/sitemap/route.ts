import { NextResponse } from 'next/server'
// This route is called by Vercel Cron to trigger sitemap revalidation

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // The sitemap is regenerated automatically via revalidate = 3600 in sitemap.ts
  // This cron can be used for additional cache warming if needed

  return NextResponse.json({ success: true, message: 'Sitemap revalidation triggered' })
}
