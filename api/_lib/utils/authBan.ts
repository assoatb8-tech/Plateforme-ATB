import { supabaseAdmin } from './supabaseAdmin.js'
import type { UserStatus } from '@prisma/client'

// Effectively permanent — Supabase's admin API takes a duration string, not
// a "forever" literal.
const PERMANENT_BAN_DURATION = '876000h'

// Defense-in-depth alongside the DB-side status check in withAuth: this
// stops Supabase Auth itself from minting new sessions (login, token
// refresh) for a banned account, on top of withAuth rejecting requests from
// any session that's already been issued. Best-effort — if the Auth API
// call fails, the DB-side status check in withAuth still blocks all API
// access, so a failure here is logged, not thrown.
export async function syncAuthBanState(userId: string, status: UserStatus): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: status === 'BANNED' ? PERMANENT_BAN_DURATION : 'none',
  })
  if (error) {
    console.error(`Failed to sync Supabase Auth ban state for user ${userId}:`, error.message)
  }
}
