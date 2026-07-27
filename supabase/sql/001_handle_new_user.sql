-- Auto-provision a public.users row whenever Supabase Auth creates a new user.
--
-- Runs as SECURITY DEFINER so role/status are always forced server-side to
-- USER/PENDING, regardless of what the client sent as signUp metadata.
-- Never derive role from client input — see SECURITY.md ("Jamais faire
-- confiance au frontend").

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, status)
  values (new.id, new.email, 'USER', 'PENDING');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
