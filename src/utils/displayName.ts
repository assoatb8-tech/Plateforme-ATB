interface BilingualName {
  firstNameFr: string | null
  lastNameFr: string | null
  firstNameAr: string | null
  lastNameAr: string | null
}

// Same "pick by active UI language, fall back to the other one" pattern
// already used for bilingual event titles (titleFr/titleAr) — a member's
// name is stored in both scripts, and whichever one the current interface
// language doesn't cover, the other still displays something instead of
// a blank cell.
export function resolveMemberDisplayName(name: BilingualName, language: string): string {
  const isArabic = language === 'ar'
  const primary = isArabic
    ? [name.firstNameAr, name.lastNameAr]
    : [name.firstNameFr, name.lastNameFr]
  const fallback = isArabic
    ? [name.firstNameFr, name.lastNameFr]
    : [name.firstNameAr, name.lastNameAr]

  const primaryJoined = primary.filter(Boolean).join(' ')
  if (primaryJoined) return primaryJoined
  return fallback.filter(Boolean).join(' ')
}
