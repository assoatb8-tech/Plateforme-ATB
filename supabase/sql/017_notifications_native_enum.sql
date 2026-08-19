-- Prisma maps `enum NotificationType` to a native Postgres enum and casts
-- insert parameters to it (e.g. $1::"NotificationType") -- 016 created the
-- column as plain text + a CHECK constraint instead, which made every
-- insert (event creation, the new-member trigger) fail with a 500 because
-- the "NotificationType" type didn't exist. Matches the existing "Role" /
-- "EventStatus" native-enum convention already used by every other Prisma
-- enum in this schema.
alter table public.notifications drop constraint if exists notifications_type_check;

create type "NotificationType" as enum ('NEW_EVENT', 'NEW_MEMBER');

alter table public.notifications
  alter column type type "NotificationType" using type::"NotificationType";
