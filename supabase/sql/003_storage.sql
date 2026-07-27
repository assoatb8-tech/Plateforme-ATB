-- Private storage bucket for member documents (CIN copies, certificates,
-- profile photos). MUST stay private — MEMBER_FORM.md's confidentiality
-- section requires these never be publicly exposed. The frontend
-- (src/services/storageService.ts) uploads here and reads via short-lived
-- signed URLs (createSignedUrl), never getPublicUrl.
--
-- Path convention: {userId}/{cin|certificates|profile}/{filename}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'members',
  'members',
  false,
  5242880, -- 5 MB, matches SECURITY.md's upload size expectations
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do nothing;

-- The first path segment must match the authenticated caller's own id, or
-- the caller must be an admin. Same initplan optimization as 002_rls_policies.sql.

create policy "members_bucket_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'members'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "members_bucket_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'members'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

create policy "members_bucket_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'members'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

create policy "members_bucket_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'members'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
