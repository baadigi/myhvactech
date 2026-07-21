# Ejecting one trade site (for a sale)

The MyTech sites share ONE Supabase project (`dcxiruohzhbftqwpvhxo`), partitioned by
a `trade` column. Selling one site = extracting that trade's slice into a fresh,
standalone Supabase project the buyer owns. These scripts do that cleanly.

Trades: `accesscontrol electrical fire hvac maintenance msp plumbing roofing unclassified`

## One-time setup
```bash
brew install libpq && brew link --force libpq   # gives you pg_dump + psql
```

## Step 1 — buyer creates an empty Supabase project
Then in its SQL editor, enable the extensions our schema uses:
```sql
create extension if not exists postgis;
create extension if not exists pg_trgm;
```

## Step 2 — export the trade slice (from the shared DB)
```bash
export SOURCE_DB_URL='postgres://postgres:PW@db.dcxiruohzhbftqwpvhxo.supabase.co:5432/postgres'
./scripts/eject-trade.sh hvac ./eject-hvac
```
Get `SOURCE_DB_URL` from: shared project → Settings → Database → Connection string → URI
(the **direct** 5432 string, not the pooler — `\copy` needs it). Prints a per-table row count.

Produces `./eject-hvac/` with `01-schema.sql`, `data/*.dat`, `02-load.sql`, `restore.sh`.

## Step 3 — load into the buyer's project
```bash
cd eject-hvac
export TARGET_DB_URL='postgres://postgres:PW@db.NEWREF.supabase.co:5432/postgres'
./restore.sh
```

## Step 4 — copy blog images
```bash
SOURCE_URL=https://dcxiruohzhbftqwpvhxo.supabase.co SOURCE_SERVICE_KEY=... \
TARGET_URL=https://NEWREF.supabase.co TARGET_SERVICE_KEY=... \
node scripts/eject-storage.mjs hvac
```
Copies the whole `blog-images` bucket (~62MB). Add `--referenced-only` to copy just this
trade's images. (Contractor photos are external Google URLs — nothing to move.)

## Step 5 — hand over the app
The site already deploys from a per-trade repo/fork. Point its env vars
(`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, anon key) at the buyer's project,
transfer the Vercel project + domain, and it runs standalone.

---

## Manual checks before you hand it off (not automated — they need judgment)
- **Claimed listings**: `contractors.owner_id` points at `auth.users` (shared across all
  sites). If any listings are claimed by real accounts, export those auth users too
  (Supabase Auth admin API / dashboard) or the buyer's claim logins break. Check:
  `select count(*) from contractors where trade='hvac' and owner_id is not null;`
- **Billing**: paid listings link to Stripe via `subscription_status`/`subscription_tier`.
  Money doesn't migrate itself — coordinate Stripe (transfer or cancel+rebill on buyer side).
- **Sequences**: handled automatically by `02-load.sql`. UUID-keyed tables need nothing.
- **RLS**: policies come across in `01-schema.sql`. Spot-check anon reads work after load.

## What this does NOT touch
The shared DB is left completely unchanged — this is a read-only export. Deleting the
sold trade's rows from the shared DB (if you want it gone after the sale) is a separate,
deliberate step; do it only once the buyer's copy is verified live.
