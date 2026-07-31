import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Without `globals: true` in the vitest config (kept off deliberately, to
// avoid widening tsconfig types with vitest's global type declarations),
// Testing Library's own auto-cleanup never gets registered — each test's
// rendered DOM would otherwise bleed into the next one.
afterEach(() => {
  cleanup()
})
