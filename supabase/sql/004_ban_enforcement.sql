-- Closes the gap where a banned user's still-valid Supabase JWT could be
-- used to call the Supabase REST API directly (bypassing our own api/*.ts
-- handlers, which already reject BANNED accounts server-side — see
-- api/_lib/middlewares/auth.ts). This is defense-in-depth: the app itself
-- never talks to Supabase's REST API for mutations, only through our own
-- backend, but RLS is the only thing standing between a leaked/replayed
-- token and the database if that assumption is ever violated.
--
-- Mirrors public.is_admin()'s pattern (SECURITY DEFINER to read
-- public.users without recursing into this table's own RLS).
create or replace function public.is_active()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and status <> 'BANNED'
  );
$$;

revoke execute on function public.is_active() from public, anon;
grant execute on function public.is_active() to authenticated;

-- member_profiles: a banned user can no longer create or edit their own
-- profile (admins are unaffected — they never go through the "own row"
-- branch of these policies).
drop policy if exists "member_profiles_insert_own" on public.member_profiles;
create policy "member_profiles_insert_own" on public.member_profiles
  for insert with check ((select auth.uid()) = user_id and (select public.is_active()));

drop policy if exists "member_profiles_update" on public.member_profiles;
create policy "member_profiles_update" on public.member_profiles
  for update using (
    ((select auth.uid()) = user_id and (select public.is_active()))
    or (select public.is_admin())
  );

-- event_registrations: a banned user can no longer register, cancel, or
-- modify their own registrations.
drop policy if exists "event_registrations_insert_own" on public.event_registrations;
create policy "event_registrations_insert_own" on public.event_registrations
  for insert with check ((select auth.uid()) = user_id and (select public.is_active()));

drop policy if exists "event_registrations_update" on public.event_registrations;
create policy "event_registrations_update" on public.event_registrations
  for update using (
    ((select auth.uid()) = user_id and (select public.is_active()))
    or (select public.is_admin())
  );

drop policy if exists "event_registrations_delete" on public.event_registrations;
create policy "event_registrations_delete" on public.event_registrations
  for delete using (
    ((select auth.uid()) = user_id and (select public.is_active()))
    or (select public.is_admin())
  );

-- documents: a banned user can no longer upload, replace, or delete their
-- own documents.
drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
  for insert with check ((select auth.uid()) = user_id and (select public.is_active()));

drop policy if exists "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update using (
    ((select auth.uid()) = user_id and (select public.is_active()))
    or (select public.is_admin())
  );

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete using (
    ((select auth.uid()) = user_id and (select public.is_active()))
    or (select public.is_admin())
  );
