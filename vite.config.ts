import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // We drive registration ourselves via the virtual:pwa-register/react
      // hook (src/pwa/useUpdatePrompt.ts) so the "update available" banner
      // can be styled with the app's own design system instead of a raw
      // window.confirm().
      injectRegister: false,
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Association Tunisienne Bénévolat',
        short_name: 'ATB',
        description:
          "Plateforme de gestion des adhérents, événements et cotisations de l'Association Tunisienne Bénévolat.",
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#F8FAFC',
        theme_color: '#E02424',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg,jpg}'],
        // Never precache/runtime-cache /api/* or Supabase requests: member
        // status, admin data, and signed document URLs must always be
        // fresh, not served stale from the service worker (SECURITY.md).
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Google Fonts stylesheet — small, near-static, safe to
            // stale-while-revalidate for fast repeat loads.
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Actual font files — content-hashed and immutable, safe to
            // cache aggressively for a year.
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
