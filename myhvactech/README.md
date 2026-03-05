# My HVAC Tech

Commercial HVAC contractor directory — like Yelp/Angi for commercial heating, ventilation, and air conditioning.

**Domain:** [www.myhvactech.com](https://www.myhvactech.com)

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL + PostGIS + RLS)
- **Auth:** Supabase Auth
- **Payments:** Stripe (subscriptions + billing portal)
- **CSS:** Tailwind CSS v4
- **Hosting:** Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
# Fill in your Supabase, Stripe, and other keys
```

### 3. Set up the database

Run the migration in your Supabase project:

```bash
# Via Supabase Dashboard → SQL Editor
# Paste contents of supabase/migrations/001_initial_schema.sql

# Then seed sample data:
# Paste contents of supabase/seed.sql
```

Or if using the Supabase CLI:

```bash
supabase db push
supabase db seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── contractors/[slug]/ # Contractor profile pages (ISR)
│   ├── search/             # Search results (SSR)
│   ├── [state]/[city]/[service]/ # SEO landing pages (SSG)
│   ├── services/           # Service category pages
│   ├── for-contractors/    # Contractor acquisition pages
│   ├── dashboard/          # Contractor portal (protected)
│   ├── admin/              # Admin panel (protected)
│   └── api/                # API routes
│       ├── leads/          # Lead submission
│       ├── webhooks/stripe/ # Stripe webhook handler
│       ├── analytics/track/ # Event tracking
│       ├── search/         # Search API
│       └── ai/chat/        # AI chatbot
├── components/
│   └── ui/                 # Shared UI components
└── lib/
    ├── supabase/           # Supabase client helpers
    ├── types.ts            # TypeScript interfaces
    ├── constants.ts        # App constants (tiers, services, states)
    └── utils.ts            # Utility functions

supabase/
├── migrations/
│   └── 001_initial_schema.sql  # Full DB schema
└── seed.sql                    # Sample data
```

## Database Schema

Key tables:
- `contractors` — Business listings with PostGIS location
- `services` — HVAC service types
- `contractor_services` — Junction: which contractors offer what
- `service_areas` — Cities/regions served
- `reviews` — Verified customer reviews
- `leads` — Contact inquiries
- `analytics_events` — Profile views, clicks, calls
- `subscription_plans` — Tier configuration

## Subscription Tiers

| Tier | Price | Key Features |
|------|-------|-------------|
| Free | $0/mo | Basic listing, 3 photos, 1 service area |
| Bronze | $49/mo | 10 photos, 3 areas, SMS notifications |
| Silver | $149/mo | Priority listing, verified badge, analytics |
| Gold | $349/mo | Featured placement, unlimited photos, AI priority |

## Deployment

Deploy to Vercel:

```bash
vercel --prod
```

Set all environment variables from `.env.local.example` in Vercel project settings.

Add the Stripe webhook endpoint: `https://www.myhvactech.com/api/webhooks/stripe`
