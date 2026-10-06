-- 018 — Listing approval gate
--
-- Self-registered listings used to go live (and into the sitemap) the moment the
-- form was submitted, and the owner UPDATE policy let an owner rewrite any column
-- on their own row (is_verified, is_featured, subscription_tier, trade…) by calling
-- Supabase directly. Out-of-trade businesses were signing up purely for the link.
--
-- This migration enforces review in the database so it holds for every site and
-- every code path (the directory runs from more than one repo):
--
--   * contractors.listing_status: 'pending' | 'approved' | 'rejected'.
--     Existing rows default to 'approved'.
--   * Anything not 'approved' is forced to subscription_status = 'cancelled' — the
--     one "hidden" switch every public query, RPC, sitemap and RLS policy already
--     honors — so no read path needs to know about listing_status.
--   * Rows written by end users (anon/authenticated) always start 'pending' with no
--     trust flags, and owners can only edit profile content afterwards.
--   * Pointing an approved listing at a different domain sends it back to review.
--
-- Admin/service-role/cron writes are not restricted.

alter table public.contractors
  add column if not exists listing_status text not null default 'approved'
    check (listing_status in ('pending', 'approved', 'rejected')),
  add column if not exists listing_review jsonb;

comment on column public.contractors.listing_status is
  'Review state. Non-approved rows are forced to subscription_status=cancelled (hidden) by contractors_listing_guard.';
comment on column public.contractors.listing_review is
  'Review metadata: automated trade screen at signup, plus who approved/rejected and why.';

create index if not exists contractors_listing_review_queue_idx
  on public.contractors (trade, created_at desc)
  where listing_status <> 'approved';

-- Bare domain of a website value, for "did the outbound link change" checks.
create or replace function public.website_domain(w text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(
    regexp_replace(
      regexp_replace(coalesce(w, ''), '^\s*(https?://)?(www\.)?', '', 'i'),
      '[/?#\s].*$', ''
    )
  )
$$;

create or replace function public.contractors_listing_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  -- PostgREST runs end-user requests as anon/authenticated; the service key,
  -- crons and migrations run as other roles and are trusted.
  is_end_user boolean := current_user in ('anon', 'authenticated');
begin
  if tg_op = 'INSERT' then
    if is_end_user then
      new.listing_status := 'pending';
      new.listing_review := null;
      new.is_verified := false;
      new.is_featured := false;
      new.commercial_verified := false;
      new.commercial_verified_at := null;
      new.insurance_verified := false;
      new.subscription_tier := 'free';
      new.slot_tier := null;
      new.stripe_customer_id := null;
      new.stripe_subscription_id := null;
      new.avg_rating := 0;
      new.review_count := 0;
      new.profile_views := 0;
      new.google_place_id := null;
      new.google_rating := null;
      new.google_review_count := 0;
      new.google_reviews := '[]'::jsonb;
      new.google_business_url := null;
      new.google_website := null;
      new.google_photos := '[]'::jsonb;
      new.google_editorial_summary := null;
      new.faq := null;
      new.qa_snippets := null;
      new.meta_title := null;
      new.meta_description := null;
    end if;

  elsif tg_op = 'UPDATE' then
    if is_end_user then
      -- Owners edit profile content only; everything below keeps its stored value.
      new.id := old.id;
      new.created_at := old.created_at;
      new.owner_id := old.owner_id;
      new.trade := old.trade;
      new.slug := old.slug;
      new.listing_status := old.listing_status;
      new.listing_review := old.listing_review;
      new.subscription_status := old.subscription_status;
      new.subscription_tier := old.subscription_tier;
      new.slot_tier := old.slot_tier;
      new.stripe_customer_id := old.stripe_customer_id;
      new.stripe_subscription_id := old.stripe_subscription_id;
      new.is_verified := old.is_verified;
      new.is_claimed := old.is_claimed;
      new.is_featured := old.is_featured;
      new.commercial_verified := old.commercial_verified;
      new.commercial_verified_at := old.commercial_verified_at;
      new.insurance_verified := old.insurance_verified;
      new.avg_rating := old.avg_rating;
      new.review_count := old.review_count;
      new.profile_views := old.profile_views;
      new.google_place_id := old.google_place_id;
      new.google_rating := old.google_rating;
      new.google_review_count := old.google_review_count;
      new.google_reviews := old.google_reviews;
      new.google_business_url := old.google_business_url;
      new.google_website := old.google_website;
      new.google_photos := old.google_photos;
      new.google_editorial_summary := old.google_editorial_summary;
      new.faq := old.faq;
      new.qa_snippets := old.qa_snippets;
      new.meta_title := old.meta_title;
      new.meta_description := old.meta_description;

      -- A new outbound domain on a live listing needs a fresh look.
      if old.listing_status = 'approved'
         and public.website_domain(new.website) <> ''
         and public.website_domain(new.website) <> public.website_domain(old.website) then
        new.listing_status := 'pending';
        new.listing_review := coalesce(old.listing_review, '{}'::jsonb) || jsonb_build_object(
          'resubmitted_at', now(),
          'resubmitted_reason', 'website changed',
          'previous_website', old.website
        );
      end if;
    end if;

    -- Approving a hidden listing puts it back on the site.
    if old.listing_status <> 'approved'
       and new.listing_status = 'approved'
       and new.subscription_status = 'cancelled' then
      new.subscription_status := 'active';
    end if;
  end if;

  if new.listing_status <> 'approved' then
    new.subscription_status := 'cancelled';
  end if;

  return new;
end;
$$;

drop trigger if exists contractors_listing_guard on public.contractors;
create trigger contractors_listing_guard
  before insert or update on public.contractors
  for each row execute function public.contractors_listing_guard();

-- Hidden rows fail the public read policy (subscription_status <> 'cancelled'),
-- so owners need their own read path or the dashboard can't see a pending listing.
drop policy if exists "Owners can read own listing" on public.contractors;
create policy "Owners can read own listing"
  on public.contractors
  for select
  to authenticated
  using (owner_id = (select auth.uid()));
