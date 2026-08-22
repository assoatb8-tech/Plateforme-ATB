-- Multi-day events: an event can optionally be made up of several
-- individually-timed "days" (e.g. a 3-day camp with different hours each
-- day), and a member registering picks which of those days they'll
-- attend. A plain single-day event (the default, isMultiDay=false) has no
-- event_days rows at all — startDate/endDate alone describe it, exactly
-- as before this migration.

alter table public.events
  add column if not exists is_multi_day boolean not null default false;

create table if not exists public.event_days (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  start_at   timestamptz not null,
  end_at     timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists event_days_event_id_idx on public.event_days (event_id);

create table if not exists public.event_day_selections (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations(id) on delete cascade,
  event_day_id    uuid not null references public.event_days(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (registration_id, event_day_id)
);

create index if not exists event_day_selections_registration_id_idx
  on public.event_day_selections (registration_id);
create index if not exists event_day_selections_event_day_id_idx
  on public.event_day_selections (event_day_id);

alter table public.event_days enable row level security;
alter table public.event_day_selections enable row level security;

-- Defense-in-depth only (see audit_logs' migration comment) — the Prisma
-- client connects with the service role and enforces authorization in
-- application code. Event days are public info (part of an event's public
-- detail), same as the events table itself.
create policy event_days_select_all on public.event_days
  for select
  using (true);

-- A member's day selections reveal nothing about anyone but themselves and
-- the event's own leader/admins already see everyone's via the app's
-- participants endpoint — but at the RLS layer (bypassed by the app
-- today, kept for defense-in-depth) restrict to the owning registrant.
create policy event_day_selections_select_own on public.event_day_selections
  for select
  using (
    exists (
      select 1 from public.event_registrations r
      where r.id = event_day_selections.registration_id
        and r.user_id = auth.uid()
    )
  );
