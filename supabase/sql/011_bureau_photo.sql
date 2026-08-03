-- Adds a mandatory photo to each Bureau member, shown on the public /bureau
-- page. Same public-bucket pattern as sponsor-logos (005_sponsors.sql):
-- Bureau photos are public-facing (unlike member profile photos, which stay
-- in the private "members" bucket), so a public bucket + getPublicUrl is
-- the right fit — no signed URLs needed.
--
-- Table is empty in production at the time of this migration (verified),
-- so photo_url can go straight to NOT NULL without a backfill step.

alter table public.bureau_members add column if not exists photo_url text;
update public.bureau_members set photo_url = '' where photo_url is null;
alter table public.bureau_members alter column photo_url set not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bureau-photos',
  'bureau-photos',
  true,
  2097152, -- 2 MB, matches sponsor-logos' limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "bureau_photos_bucket_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bureau-photos' and (select public.is_admin()));

create policy "bureau_photos_bucket_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bureau-photos' and (select public.is_admin()));
