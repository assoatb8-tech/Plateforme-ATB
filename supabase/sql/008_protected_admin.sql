-- Protects the primary admin account (assoatb8@gmail.com) from being
-- demoted by any other admin — self-demotion was already blocked by
-- api/users/[id].ts's handleRole (an admin can never change their own
-- role, protected or not). This adds a second, independent guard: nobody
-- else can demote a protected account either.

alter table public.users add column if not exists is_protected boolean not null default false;

update public.users set is_protected = true where email = 'assoatb8@gmail.com';
