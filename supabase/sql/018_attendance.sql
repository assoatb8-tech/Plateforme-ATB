-- Attendance tracking: an admin or an event's leader ("chef de groupe")
-- can mark each REGISTERED participant present or absent once the event
-- has ended. Nullable until then. Native Postgres enum, matching every
-- other Prisma enum's convention in this schema (see 017's fix for why
-- text+CHECK breaks Prisma's parameter casting).
create type "AttendanceStatus" as enum ('PRESENT', 'ABSENT');

alter table public.event_registrations
  add column if not exists attendance_status "AttendanceStatus";
