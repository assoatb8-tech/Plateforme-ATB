const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Every `[id].ts` dynamic-segment table (events, users, payments) has a
// Postgres `uuid` primary key. Passing a malformed value straight to Prisma
// throws inside Postgres, uncaught — Vercel then returns its own
// text/plain platform error page instead of our JSON envelope. Checking
// the format first turns that crash into an ordinary 404.
export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id)
}
