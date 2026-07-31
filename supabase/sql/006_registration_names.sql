-- Registration now collects First name / Last name at signup, sent as
-- Supabase Auth user metadata (raw_user_meta_data), synced into
-- public.users at account-creation time by the existing trigger.

alter table public.users add column if not exists first_name text;
alter table public.users add column if not exists last_name text;

-- Role/status stay hardcoded server-side (never trust client input for
-- those two — see SECURITY.md). Only the name fields come from
-- client-supplied signUp() metadata, which is fine since they carry no
-- privilege.
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
  return new;
end;
$$;
