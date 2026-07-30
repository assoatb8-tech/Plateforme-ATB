// Defense-in-depth against stored XSS on free-text fields. React already
// escapes on render (no dangerouslySetInnerHTML/innerHTML exists anywhere
// in this codebase, verified during the security audit), so this isn't
// closing a live exploit — it's removing the risk that a future feature
// (rich-text rendering, PDF/CSV export, an admin email digest) accidentally
// reintroduces one by trusting data that was never actually clean.
//
// Deliberately just tag-stripping, not a full HTML parser/allowlist
// library (e.g. sanitize-html) — these fields (names, addresses, event
// descriptions) have no legitimate use for markup at all, so "no tags
// survive" is the correct policy, not "some tags are allowed."
export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim()
}
