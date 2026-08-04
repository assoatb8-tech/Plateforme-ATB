import { useEffect } from 'react'
import type { FieldValues, UseFormWatch } from 'react-hook-form'

// Mobile browsers routinely reload a backgrounded tab (memory pressure,
// especially iOS Safari) — when that happens all in-memory React state is
// gone, including whatever an admin was mid-typing. Persisting to
// localStorage lets the form rehydrate on the reload instead of coming
// back empty. Same pattern as the member-form's dossier draft
// (src/features/member-form/hooks/useMemberFormDraft.ts), generalized for
// any react-hook-form instance.
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000

interface StoredDraft<T> {
  savedAt: number
  values: Partial<T>
}

export function loadFormDraft<T>(key: string): Partial<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const stored = JSON.parse(raw) as Partial<StoredDraft<T>>
    if (typeof stored.savedAt !== 'number' || !stored.values) {
      clearFormDraft(key)
      return null
    }
    if (Date.now() - stored.savedAt > DRAFT_TTL_MS) {
      clearFormDraft(key)
      return null
    }
    return stored.values
  } catch {
    return null
  }
}

export function clearFormDraft(key: string): void {
  localStorage.removeItem(key)
}

export function useAutosaveFormDraft<T extends FieldValues>(
  key: string,
  watch: UseFormWatch<T>,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return
    const subscription = watch((values) => {
      const stored: StoredDraft<T> = { savedAt: Date.now(), values }
      localStorage.setItem(key, JSON.stringify(stored))
    })
    return () => subscription.unsubscribe()
  }, [key, enabled, watch])
}
