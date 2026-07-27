import type { IncomingMessage, ServerResponse } from 'node:http'

// Hand-declared subset of @vercel/node's request/response shape. Vercel's
// platform provides the actual runtime — pulling in the full @vercel/node
// package here would only be for its TS types, at the cost of a large,
// vulnerability-heavy build-tooling dependency tree we never execute.

export interface VercelRequest extends IncomingMessage {
  query: Partial<Record<string, string | string[]>>
  cookies: Partial<Record<string, string>>
  body: unknown
}

export interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse
  json: (body: unknown) => VercelResponse
  send: (body: unknown) => VercelResponse
}
