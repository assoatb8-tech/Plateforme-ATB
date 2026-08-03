-- Bureau (governing board) members shown on the public /bureau page. Same
-- create/delete-only pattern as sponsors (005_sponsors.sql) — admin picks
-- exactly who appears by adding/removing rows, no separate visibility
-- toggle or reorder needed. No photo field, so no storage bucket either.

create table if not exists public.bureau_members (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  phone         text not null,
  email         text not null,
  facebook_url  text not null,
  created_at    timestamptz not null default now()
);

create index if not exists bureau_members_created_at_idx on public.bureau_members (created_at);

alter table public.bureau_members enable row level security;

-- Public read (the Bureau page is visible to logged-out visitors too).
create policy "bureau_members_select_all" on public.bureau_members
  for select using (true);

create policy "bureau_members_insert_admin" on public.bureau_members
  for insert with check ((select public.is_admin()));

create policy "bureau_members_delete_admin" on public.bureau_members
  for delete using ((select public.is_admin()));
