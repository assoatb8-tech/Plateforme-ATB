import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// Deliberately separate from vite.config.ts (the actual app build config)
// rather than merging vitest's `test` field into it — vitest.config's own
// defineConfig type and the app's plugin types (including @vitejs/plugin-react)
// resolve against two different nested copies of Vite's own types (a
// dependency-tree quirk, not a real incompatibility), which made
// `npx tsc -b` fail on the merged version. No plugins are needed here:
// esbuild's built-in JSX transform already follows tsconfig's
// `compilerOptions.jsx: "react-jsx"`, and @vitejs/plugin-react's only other
// job (Fast Refresh) is dev-server-only, irrelevant under `vitest run`.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
