/**
 * API Route Tracing Wrapper — wraps Next.js route handlers with request context.
 *
 * Usage:
 *   import { withTracing } from "@/lib/logger/with-tracing"
 *
 *   export const GET = withTracing(async (req) => {
 *     // log.info() auto-attaches requestId, correlationId
 *     return apiResponse({ ok: true })
 *   })
 */

import { NextRequest } from "next/server"
import { withRequestContext, generateRequestId, generateCorrelationId, setContextUserId } from "./context"
import { log } from "./logger"

type RouteHandler = (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => Promise<Response>

/**
 * Wrap an API route handler with request context + automatic logging.
 * Adds X-Request-Id to response headers.
 */
export function withTracing(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const requestId = req.headers.get("x-request-id") || generateRequestId()
    const correlationId = req.headers.get("x-correlation-id") || generateCorrelationId()

    const url = new URL(req.url)
    const path = url.pathname
    const startTime = Date.now()

    return withRequestContext(
      {
        requestId,
        correlationId,
        startTime,
        method: req.method,
        path,
      },
      async () => {
        log.info({ method: req.method, path }, "request started")

        try {
          const response = await handler(req, ctx)

          const headers = new Headers(response.headers)
          headers.set("X-Request-Id", requestId)

          const durationMs = Date.now() - startTime
          log.info(
            { status: response.status, durationMs },
            "request completed"
          )

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          })
        } catch (error) {
          const durationMs = Date.now() - startTime
          log.error({ err: error, durationMs }, "request failed")
          throw error
        }
      }
    )
  }
}

/** Helper to set userId in context after authentication. Re-exported for convenience. */
export { setContextUserId }
