import { supabase } from '@/services/supabaseClient'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Thrown on any non-2xx or {success:false} response so callers can branch
// on the HTTP status (e.g. 409 = already registered) without re-parsing.
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getAuthHeader(requireAuth: boolean): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    if (requireAuth) throw new ApiError('Not authenticated', 401)
    return {}
  }

  return { Authorization: `Bearer ${session.access_token}` }
}

interface ApiRequestOptions {
  method?: string
  body?: unknown
  /** Defaults to true — most app routes require a signed-in user. */
  requireAuth?: boolean
  query?: Record<string, string | number | undefined>
}

function buildUrl(path: string, query?: ApiRequestOptions['query']): string {
  if (!query) return path
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

// Shared fetch wrapper for every feature service (events, profile, ...):
// attaches the Supabase bearer token, unwraps the {success,data,error}
// envelope from api/utils/response.ts, and normalizes failures into
// ApiError so hooks/pages don't each re-implement this parsing.
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, requireAuth = true, query } = options
  const authHeader = await getAuthHeader(requireAuth)

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...authHeader,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const payload = (await response.json()) as ApiResponse<T>
  if (!response.ok || !payload.success) {
    throw new ApiError(payload.error ?? 'Request failed', response.status)
  }

  return payload.data as T
}
