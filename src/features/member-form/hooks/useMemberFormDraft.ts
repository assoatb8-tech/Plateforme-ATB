import { useEffect } from 'react'
import type { UseFormWatch } from 'react-hook-form'
import type { MemberFormValues } from '@/features/member-form/validation'

const DRAFT_KEY = 'atb.member-form.draft'
const STEP_KEY = 'atb.member-form.step'

export function loadDraft(): Partial<MemberFormValues> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Partial<MemberFormValues>) : null
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
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    })
    return () => subscription.unsubscribe()
  }, [watch])
}
