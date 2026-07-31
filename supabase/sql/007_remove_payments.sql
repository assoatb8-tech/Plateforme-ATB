-- Cotisation feature removed: "suivi des cotisations" is satisfied by the
-- existing ACTIVE/PENDING/BANNED account-validation workflow instead of a
-- dedicated payment ledger. Drops the table, its RLS policies (dropped
-- implicitly with the table), and its enum types.

drop table if exists public.payments cascade;
drop type if exists "PaymentType";
drop type if exists "PaymentStatus";
