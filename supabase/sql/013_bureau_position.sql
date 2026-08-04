-- Adds a bilingual "position" (e.g. Président / رئيس) to each Bureau
-- member, shown on the public /bureau page.
--
-- Nullable at the DB level — 2 real entries already exist (Bureau only
-- supports create/delete, no edit) and can't be backfilled with an
-- invented position. The app enforces it as required for all NEW
-- entries via Zod; the 2 existing rows will show no position until an
-- admin deletes and re-adds them.

alter table public.bureau_members
  add column position_fr text,
  add column position_ar text;
