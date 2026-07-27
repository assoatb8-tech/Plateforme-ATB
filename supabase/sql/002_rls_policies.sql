-- Row Level Security policies, per DATABASE.md ("Sécurité base de données")
-- and SECURITY.md ("Utilisateur : accès uniquement à ses données. Administrateur :
-- accès contrôlé.").
--
-- Table/column names below match the Prisma schema's @@map/@map output
-- (snake_case).
--
-- Perf note: auth.uid()/public.is_admin() calls are wrapped in `(select ...)`
-- so Postgres evaluates them once per query (initplan) instead of once per
-- row — see https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select.
-- "admin: for all" policies are split into insert/update/delete only so they
-- don't create a second permissive policy on the same SELECT action as the
-- dedicated read policy (Supabase linter: multiple_permissive_policies).

-- is_admin() is SECURITY DEFINER so it can read public.users without
-- triggering the recursive RLS check that a normal SELECT would hit.
-- EXECUTE is revoked from anon/public: this function is only meant to be
-- called from within RLS policy expressions evaluated as `authenticated`,
-- never directly via /rest/v1/rpc/is_admin by an anonymous caller.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'ADMIN'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

create policy "users_select" on public.users
  for select using ((select auth.uid()) = id or (select public.is_admin()));

create policy "users_update_admin" on public.users
  for update using ((select public.is_admin()));

-- No client-side INSERT policy: rows are created exclusively by the
-- on_auth_user_created trigger (001_handle_new_user.sql).

-- ---------------------------------------------------------------------------
-- member_profiles
-- ---------------------------------------------------------------------------
alter table public.member_profiles enable row level security;

create policy "member_profiles_select" on public.member_profiles
  for select using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "member_profiles_insert_own" on public.member_profiles
  for insert with check ((select auth.uid()) = user_id);

create policy "member_profiles_update" on public.member_profiles
  for update using ((select auth.uid()) = user_id or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- events (public read — anyone can browse activities)
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;

create policy "events_select_all" on public.events
  for select using (true);

create policy "events_insert_admin" on public.events
  for insert with check ((select public.is_admin()));

create policy "events_update_admin" on public.events
  for update using ((select public.is_admin()));

create policy "events_delete_admin" on public.events
  for delete using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- event_registrations
-- ---------------------------------------------------------------------------
alter table public.event_registrations enable row level security;

create policy "event_registrations_select" on public.event_registrations
  for select using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "event_registrations_insert_own" on public.event_registrations
  for insert with check ((select auth.uid()) = user_id);

create policy "event_registrations_update" on public.event_registrations
  for update using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "event_registrations_delete" on public.event_registrations
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- payments (admin-managed: no online payment gateway, cotisations recorded
-- and validated by an administrator per FEATURES.md)
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;

create policy "payments_select" on public.payments
  for select using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "payments_insert_admin" on public.payments
  for insert with check ((select public.is_admin()));

create policy "payments_update_admin" on public.payments
  for update using ((select public.is_admin()));

create policy "payments_delete_admin" on public.payments
  for delete using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
alter table public.documents enable row level security;

create policy "documents_select" on public.documents
  for select using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "documents_insert_own" on public.documents
  for insert with check ((select auth.uid()) = user_id);

create policy "documents_update" on public.documents
  for update using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "documents_delete" on public.documents
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- bans — admin-only visibility and management
-- ---------------------------------------------------------------------------
alter table public.bans enable row level security;

create policy "bans_admin_only" on public.bans
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- audit_logs — written by backend functions using the service role key,
-- which bypasses RLS entirely. Only expose read access here.
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

create policy "audit_logs_select_admin" on public.audit_logs
  for select using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- _prisma_migrations — Prisma-internal bookkeeping, never queried by the
-- app. It lives in the public schema so PostgREST auto-exposes it; RLS with
-- zero policies blocks anon/authenticated entirely via the REST API while
-- Prisma's direct (BYPASSRLS) connection is unaffected.
-- ---------------------------------------------------------------------------
alter table public._prisma_migrations enable row level security;

-- ---------------------------------------------------------------------------
-- handle_new_auth_user() must only run via the on_auth_user_created
-- trigger (001_handle_new_user.sql), never as a direct RPC call.
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
