-- Row Level Security policies, per DATABASE.md ("Sécurité base de données")
-- and SECURITY.md ("Utilisateur : accès uniquement à ses données. Administrateur :
-- accès contrôlé.").
--
-- Table/column names below match the Prisma schema's @@map/@map output
-- (snake_case).

-- is_admin() is SECURITY DEFINER so it can read public.users without
-- triggering the recursive RLS check that a normal SELECT would hit.
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

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_select_admin" on public.users
  for select using (public.is_admin());

create policy "users_update_admin" on public.users
  for update using (public.is_admin());

-- No client-side INSERT policy: rows are created exclusively by the
-- on_auth_user_created trigger (001_handle_new_user.sql).

-- ---------------------------------------------------------------------------
-- member_profiles
-- ---------------------------------------------------------------------------
alter table public.member_profiles enable row level security;

create policy "member_profiles_select" on public.member_profiles
  for select using (auth.uid() = user_id or public.is_admin());

create policy "member_profiles_insert_own" on public.member_profiles
  for insert with check (auth.uid() = user_id);

create policy "member_profiles_update" on public.member_profiles
  for update using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- events (public read — anyone can browse activities)
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;

create policy "events_select_all" on public.events
  for select using (true);

create policy "events_write_admin" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- event_registrations
-- ---------------------------------------------------------------------------
alter table public.event_registrations enable row level security;

create policy "event_registrations_select" on public.event_registrations
  for select using (auth.uid() = user_id or public.is_admin());

create policy "event_registrations_insert_own" on public.event_registrations
  for insert with check (auth.uid() = user_id);

create policy "event_registrations_update" on public.event_registrations
  for update using (auth.uid() = user_id or public.is_admin());

create policy "event_registrations_delete" on public.event_registrations
  for delete using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- payments (admin-managed: no online payment gateway, cotisations recorded
-- and validated by an administrator per FEATURES.md)
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;

create policy "payments_select" on public.payments
  for select using (auth.uid() = user_id or public.is_admin());

create policy "payments_write_admin" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
alter table public.documents enable row level security;

create policy "documents_select" on public.documents
  for select using (auth.uid() = user_id or public.is_admin());

create policy "documents_insert_own" on public.documents
  for insert with check (auth.uid() = user_id);

create policy "documents_update" on public.documents
  for update using (auth.uid() = user_id or public.is_admin());

create policy "documents_delete" on public.documents
  for delete using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- bans — admin-only visibility and management
-- ---------------------------------------------------------------------------
alter table public.bans enable row level security;

create policy "bans_admin_only" on public.bans
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs — written by backend functions using the service role key,
-- which bypasses RLS entirely. Only expose read access here.
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

create policy "audit_logs_select_admin" on public.audit_logs
  for select using (public.is_admin());
