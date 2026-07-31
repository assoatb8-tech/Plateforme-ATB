import { useEffect } from 'react'
import type { UseFormWatch } from 'react-hook-form'
import type { MemberFormValues } from '@/features/member-form/validation'

const DRAFT_KEY = 'atb.member-form.draft'
const STEP_KEY = 'atb.member-form.step'

// The draft holds sensitive PII (CIN number, DOB, address, phone, family
// details) — a TTL keeps an abandoned draft on a shared/public computer
// from sitting in localStorage indefinitely.
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface StoredDraft {
  savedAt: number
  values: Partial<MemberFormValues>
}

export function loadDraft(): Partial<MemberFormValues> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null

    const stored = JSON.parse(raw) as Partial<StoredDraft>
    if (typeof stored.savedAt !== 'number' || !stored.values) {
      clearDraft()
      return null
    }
    if (Date.now() - stored.savedAt > DRAFT_TTL_MS) {
      clearDraft()
      return null
    }
    return stored.values
  } catch {
    return null
  }
}

export function loadDraftStep(): number {
  const raw = localStorage.getItem(STEP_KEY)
  const parsed = raw ? Number(raw) : 1
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function saveDraftStep(step: number): void {
  localStorage.setItem(STEP_KEY, String(step))
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY)
  localStorage.removeItem(STEP_KEY)
}

export function useAutosaveDraft(watch: UseFormWatch<MemberFormValues>): void {
  useEffect(() => {
    const subscription = watch((values) => {
      const stored: StoredDraft = { savedAt: Date.now(), values }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(stored))
    })
    return () => subscription.unsubscribe()
  }, [watch])
}
