-- Splits member_profiles.full_name into separate French/Arabic first+last
-- name pairs, and adds a photo_url column (path into the existing private
-- "members" storage bucket, see 003_storage.sql).
--
-- Backfill is best-effort: rows whose full_name is written in Arabic script
-- go into the Arabic pair, everything else into the French pair. The other
-- language's pair is left as an empty string (not null, so the NOT NULL
-- constraint below still holds) — existing members fill it in the next time
-- they edit their profile, since both languages are now mandatory going
-- forward. photo_url has no backfill possible (no photos exist yet) and
-- stays nullable at the DB level; the app enforces it as required for new
-- submissions/edits.

alter table public.member_profiles
  add column if not exists first_name_fr text,
  add column if not exists last_name_fr text,
  add column if not exists first_name_ar text,
  add column if not exists last_name_ar text,
  add column if not exists photo_url text;

update public.member_profiles
set
  first_name_ar = case
    when full_name ~ '[؀-ۿ]' then split_part(full_name, ' ', 1)
    else ''
  end,
  last_name_ar = case
    when full_name ~ '[؀-ۿ]' then trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1))
    else ''
  end,
  first_name_fr = case
    when full_name ~ '[؀-ۿ]' then ''
    else split_part(full_name, ' ', 1)
  end,
  last_name_fr = case
    when full_name ~ '[؀-ۿ]' then ''
    else trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1))
  end
where first_name_fr is null;

alter table public.member_profiles
  alter column first_name_fr set not null,
  alter column last_name_fr set not null,
  alter column first_name_ar set not null,
  alter column last_name_ar set not null;

alter table public.member_profiles drop column full_name;
