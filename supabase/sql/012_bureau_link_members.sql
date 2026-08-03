-- Re-architects bureau_members from freeform admin-typed rows into a link
-- to an existing member account: admin picks a real adherent/admin (who
-- must already have a completed profile with a photo — enforced in the
-- API, not here) instead of retyping their name/phone/email, and the
-- member's own profile photo is what's shown on the public /bureau page.
--
-- Table is empty in production at the time of this migration (verified),
-- so the column swap can happen directly, no backfill needed. The
-- 'bureau-photos' storage bucket (011_bureau_photo.sql) is now unused —
-- left in place rather than force-dropped, since removing it cleanly
-- requires deleting its one leftover test object through the Storage API
-- first (direct storage.objects deletion is blocked at the DB level).

alter table public.bureau_members
  drop column first_name,
  drop column last_name,
  drop column phone,
  drop column email,
  drop column photo_url,
  add column user_id uuid not null references public.users(id) on delete cascade,
  add constraint bureau_members_user_id_key unique (user_id);
