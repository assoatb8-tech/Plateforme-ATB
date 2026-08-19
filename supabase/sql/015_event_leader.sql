-- Lets an admin designate one confirmed (REGISTERED) participant as an
-- event's leader from the participants list. Nullable FK on events, not a
-- flag on event_registrations — an event has at most one leader by
-- construction, no partial-unique-index trickery needed. Set null (not
-- cascade delete) if the leader's account is ever removed, since deleting
-- their account shouldn't be blocked by them having led an event.

alter table public.events
  add column if not exists leader_id uuid references public.users(id) on delete set null;
