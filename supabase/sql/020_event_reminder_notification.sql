-- New notification type for the day-before event reminder sent by the
-- ?action=send-reminders cron endpoint in api/notifications.ts. Additive
-- only — existing NEW_EVENT/NEW_MEMBER rows and behavior are unaffected.
alter type "NotificationType" add value 'EVENT_REMINDER';
