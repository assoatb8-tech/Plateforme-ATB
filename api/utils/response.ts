import type { VercelResponse } from '../types'

export function sendSuccess<T>(res: VercelResponse, data: T, status = 200): void {
  res.status(status).json({ success: true, data })
}

export function sendError(res: VercelResponse, message: string, status = 400): void {
  res.status(status).json({ success: false, error: message })
}
