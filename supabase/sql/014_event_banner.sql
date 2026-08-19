-- Optional banner image per event, shown on the public events pages.
-- Same public-bucket pattern as sponsor logos / Bureau photos
-- (005_sponsors.sql) — banners are marketing assets, not private data.

alter table public.events add column if not exists banner_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-banners',
  'event-banners',
  true,
  2097152, -- 2 MB (uploads are pre-compressed client-side to a small JPEG)
  array['image/jpeg']
)
on conflict (id) do nothing;

-- No SELECT policy needed — public bucket, getPublicUrl() serves objects
-- regardless of storage.objects RLS (same reasoning as 005_sponsors.sql).

create policy "event_banners_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-banners' and (select public.is_admin()));

create policy "event_banners_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-banners' and (select public.is_admin()));
