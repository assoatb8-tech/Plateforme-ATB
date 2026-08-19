-- In-app notifications: one row per recipient (fan-out on write).
--
-- NEW_EVENT rows are inserted by api/events.ts on create, for every ACTIVE
-- member. NEW_MEMBER rows are inserted here, inside handle_new_auth_user
-- itself, because registration never goes through our API — it's a direct
-- supabase.auth.signUp() call from the frontend, so the trigger is the only
-- server-side hook that exists for "a new member joined".

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  type            text not null check (type in ('NEW_EVENT', 'NEW_MEMBER')),
  event_id        uuid references public.events(id) on delete cascade,
  related_user_id uuid references public.users(id) on delete cascade,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Defense-in-depth only: the Prisma client connects directly as the service
-- role and enforces authorization in application code (see api/notifications.ts
-- and the audit_logs table's own migration comment for the same pattern).
-- Regular users get read-only access to their own rows; all writes happen
-- server-side (api/events.ts on create, or this trigger below).
create policy notifications_select_own on public.notifications
  for select
  using (user_id = auth.uid());

-- Extend the existing new-user trigger to also fan out a NEW_MEMBER
-- notification to every current admin, in the same transaction as the new
-- public.users row.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, status, first_name, last_name, updated_at)
  values (
    new.id, new.email, 'USER', 'PENDING',
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    now()
  );

  insert into public.notifications (user_id, type, related_user_id)
  select id, 'NEW_MEMBER', new.id
  from public.users
  where role = 'ADMIN';

  return new;
end;
$$;
