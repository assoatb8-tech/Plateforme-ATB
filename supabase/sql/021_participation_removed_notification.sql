-- New notification type for when an admin or the event's own leader
-- ("chef de groupe") removes a participant from an event — the removed
-- member is notified. Additive only — existing notification types and
-- behavior are unaffected.
alter type "NotificationType" add value 'PARTICIPATION_REMOVED';
