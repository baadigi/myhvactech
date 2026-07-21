#!/usr/bin/env bash
# Eject one trade's full data slice from the shared MyTech Supabase into a
# self-contained bundle you can load into a brand-new Supabase project (for a sale).
#
# What it does:
#   1. Dumps the public schema (structure, indexes, constraints, RLS, functions).
#   2. Dumps ONLY the chosen trade's rows for every table, following the FK graph
#      (trade -> contractors.id -> children, and trade -> quote_requests.id -> children).
#   3. Copies global reference tables (trades, services, etc.) wholesale.
#   4. Writes a restore.sh + 02-load.sql so the buyer can load it in one shot.
#
# Files (storage/blog images) are handled separately by eject-storage.mjs.
#
# Usage:
#   export SOURCE_DB_URL='postgres://postgres:PW@db.dcxiruohzhbftqwpvhxo.supabase.co:5432/postgres'
#   ./scripts/eject-trade.sh hvac ./eject-hvac
#
# Get SOURCE_DB_URL from: Supabase dashboard -> Project Settings -> Database ->
# Connection string -> URI (use the direct 5432 string, not the pooler, so COPY works).
#
# Needs Postgres client tools. If missing:  brew install libpq && brew link --force libpq
set -euo pipefail

TRADE="${1:-}"
OUT="${2:-./eject-${TRADE}}"

if [[ -z "$TRADE" ]]; then echo "usage: $0 <trade-key> [out-dir]"; exit 1; fi
if [[ -z "${SOURCE_DB_URL:-}" ]]; then echo "ERROR: set SOURCE_DB_URL (see header)"; exit 1; fi
if ! command -v pg_dump >/dev/null || ! command -v psql >/dev/null; then
  echo "ERROR: pg_dump/psql not found.  brew install libpq && brew link --force libpq"; exit 1
fi

DATA="$OUT/data"
mkdir -p "$DATA"
echo ">> ejecting trade '$TRADE' -> $OUT"

# Valid trade key check
if ! psql "$SOURCE_DB_URL" -tAc "select 1 from public.trades where key='$TRADE'" | grep -q 1; then
  echo "ERROR: trade '$TRADE' not found in trades table"; exit 1
fi

# ── 1. Schema ────────────────────────────────────────────────────────────────
echo ">> schema..."
pg_dump "$SOURCE_DB_URL" --schema=public --schema-only --no-owner --no-privileges \
  --no-publications --no-subscriptions --exclude-table=spatial_ref_sys \
  -f "$OUT/01-schema.sql"

# ── 2. Data manifest ─────────────────────────────────────────────────────────
# Each entry: "table|WHERE-clause"  (empty clause = full copy).
# FK-derived filters keep the slice self-consistent.
CONTRACTOR_SLICE="id in (select id from public.contractors where trade='$TRADE')"
QUOTE_SLICE="id in (select id from public.quote_requests where trade='$TRADE')"

MANIFEST=(
  # global reference — copied whole
  "trades|"
  "services|"
  "service_areas|"
  "subscription_plans|"
  "coupons|"
  # trade-tagged tables — direct filter
  "contractors|trade='$TRADE'"
  "quote_requests|trade='$TRADE'"
  "blog_posts|trade='$TRADE'"
  "blog_topics|trade='$TRADE'"
  "leads|trade='$TRADE'"
  "reviews|trade='$TRADE'"
  "claim_requests|trade='$TRADE'"
  "contact_messages|trade='$TRADE'"
  "contractor_candidates|trade='$TRADE'"
  "import_batches|trade='$TRADE'"
  "analytics_events|trade='$TRADE'"
  "listing_events|trade='$TRADE'"
  "scope_requests|trade='$TRADE'"
  # children of contractors
  "contractor_photos|contractor_${CONTRACTOR_SLICE}"
  "contractor_service_areas|contractor_${CONTRACTOR_SLICE}"
  "contractor_services|contractor_${CONTRACTOR_SLICE}"
  "google_reviews|contractor_${CONTRACTOR_SLICE}"
  "market_slots|contractor_${CONTRACTOR_SLICE}"
  "messages|contractor_${CONTRACTOR_SLICE}"
  "sample_projects|contractor_${CONTRACTOR_SLICE}"
  # children of quote_requests
  "quote_responses|quote_request_${QUOTE_SLICE}"
  # children of leads OR quote_requests
  "nurture_events|lead_id in (select id from public.leads where trade='$TRADE') or quote_request_${QUOTE_SLICE}"
)

# ── 3. Dump each table's slice (COPY text format = full type fidelity) ────────
LOAD="$OUT/02-load.sql"
{
  echo "-- Auto-generated. Load into a NEW Supabase project AFTER 01-schema.sql."
  echo "-- Run: psql \"\$TARGET_DB_URL\" -f 01-schema.sql   then   psql \"\$TARGET_DB_URL\" -f 02-load.sql"
  echo "\\set ON_ERROR_STOP on"
  echo "SET session_replication_role = replica;  -- disable FK triggers during load"
} > "$LOAD"

echo ">> data..."
for entry in "${MANIFEST[@]}"; do
  tbl="${entry%%|*}"; where="${entry#*|}"
  q="select * from public.$tbl"
  [[ -n "$where" ]] && q="$q where $where"
  psql "$SOURCE_DB_URL" -c "\copy ($q) TO '$DATA/$tbl.dat'"
  n=$(wc -l < "$DATA/$tbl.dat" | tr -d ' ')
  printf "   %-26s %s rows\n" "$tbl" "$n"
  echo "\\copy public.$tbl FROM 'data/$tbl.dat'" >> "$LOAD"
done

# ── 4. Reset sequences + re-enable FK triggers ───────────────────────────────
cat >> "$LOAD" <<'SQL'
SET session_replication_role = DEFAULT;
-- Bump every sequence to its column max so new inserts don't collide.
DO $$
DECLARE rec record;
BEGIN
  FOR rec IN
    SELECT s.relname AS seq, t.relname AS tbl, a.attname AS col
    FROM pg_class s
    JOIN pg_depend d ON d.objid = s.oid AND d.deptype='a'
    JOIN pg_class t ON t.oid = d.refobjid
    JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=d.refobjsubid
    WHERE s.relkind='S' AND t.relnamespace='public'::regnamespace
  LOOP
    EXECUTE format('SELECT setval(%L, COALESCE((SELECT max(%I) FROM public.%I),1), true)',
                   rec.seq, rec.col, rec.tbl);
  END LOOP;
END$$;
SQL

# ── 5. Convenience restore script ────────────────────────────────────────────
cat > "$OUT/restore.sh" <<'SH'
#!/usr/bin/env bash
# Load this bundle into a NEW, EMPTY Supabase project.
# First enable extensions on the target (SQL editor):
#   create extension if not exists postgis;
#   create extension if not exists pg_trgm;
# Then:  export TARGET_DB_URL='postgres://postgres:PW@db.NEWREF.supabase.co:5432/postgres'
#        ./restore.sh
set -euo pipefail
: "${TARGET_DB_URL:?set TARGET_DB_URL}"
cd "$(dirname "$0")"
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=0 -f 01-schema.sql
psql "$TARGET_DB_URL" -f 02-load.sql
echo ">> done. Now run eject-storage.mjs to copy blog images."
SH
chmod +x "$OUT/restore.sh"

echo ">> DONE. Bundle at: $OUT"
echo "   Next: copy files with  node scripts/eject-storage.mjs $TRADE  (see EJECT-README.md)"
