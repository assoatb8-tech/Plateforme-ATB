import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  )
}

// @supabase/supabase-js is the single largest dependency in the app
// (~200KB gzipped down, still the biggest chunk in the build). AuthProvider
// needs it on every route just to know whether someone's logged in, which
// used to force it to load — via an eager top-level import — before first
// paint even on fully public pages like the events list. Dynamically
// importing it here means it's no longer part of the entry chunk's static
// dependency graph, so Vite stops emitting a blocking modulepreload for it;
// it still loads immediately once the app mounts, just without being
// forced ahead of the critical initial render.
let clientPromise: Promise<SupabaseClient> | null = null

export function getSupabaseClient(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey),
    )
  }
  return clientPromise
}
