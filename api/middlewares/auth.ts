import type { VercelRequest, VercelResponse } from '../types'
import { supabaseAdmin } from '../utils/supabaseAdmin'
import { sendError } from '../utils/response'

export interface AuthedUser {
  id: string
  email: string
}

export type AuthedHandler = (
  req: VercelRequest,
  res: VercelResponse,
  user: AuthedUser,
) => Promise<void> | void

/**
 * Validates the Bearer token against Supabase Auth (not a local JWT_SECRET
 * check — Supabase issues and rotates its own signing keys, so asking
 * Supabase to verify the token is the correct approach here).
 */
export function withAuth(handler: AuthedHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

    if (!token) {
      sendError(res, 'Missing bearer token', 401)
      return
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data.user) {
      sendError(res, 'Invalid or expired token', 401)
      return
    }

    await handler(req, res, { id: data.user.id, email: data.user.email ?? '' })
  }
}
