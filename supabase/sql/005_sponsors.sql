-- Sponsor/partner logos shown on the homepage marquee. No edit or reorder
-- support (per product decision) — admin can only create (name + logo) and
-- delete, so display order is just insertion order (created_at).

create table if not exists public.sponsors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  logo_url   text not null,
  created_at timestamptz not null default now()
);

create index if not exists sponsors_created_at_idx on public.sponsors (created_at);

alter table public.sponsors enable row level security;

-- Public read (homepage marquee is visible to logged-out visitors too).
create policy "sponsors_select_all" on public.sponsors
  for select using (true);

create policy "sponsors_insert_admin" on public.sponsors
  for insert with check ((select public.is_admin()));

create policy "sponsors_delete_admin" on public.sponsors
  for delete using ((select public.is_admin()));

-- Public storage bucket — sponsor logos are marketing assets meant to be
-- publicly visible, unlike the private "members" bucket (003_storage.sql).
-- Being public means getPublicUrl() returns a permanent URL with no
-- signed-URL round trip; that URL is stored directly in sponsors.logo_url.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sponsor-logos',
  'sponsor-logos',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- No SELECT policy needed: the bucket is public, so getPublicUrl() serves
-- objects regardless of storage.objects RLS. A broad SELECT policy here
-- would only add the ability to list()/download() via the storage API,
-- which nothing in the app does (Supabase's linter flags this as
-- "public bucket allows listing" if added unnecessarily).

create policy "sponsor_logos_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'sponsor-logos' and (select public.is_admin()));

create policy "sponsor_logos_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'sponsor-logos' and (select public.is_admin()));
