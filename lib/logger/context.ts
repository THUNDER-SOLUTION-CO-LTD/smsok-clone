/**
 * Request Context — AsyncLocalStorage-based context propagation.
 *
 * Stores requestId, correlationId, userId per async operation.
 * No parameter drilling needed — context follows the async chain.
 */

import { AsyncLocalStorage } from "node:async_hooks"
import { randomUUID } from "node:crypto"

export type RequestContext = {
  requestId: string
  correlationId: string
  userId?: string
  startTime: number
  method?: string
  path?: string
  extra?: Record<string, unknown>
}

const storage = new AsyncLocalStorage<RequestContext>()

/** Generate prefixed UUID v4 IDs */
function prefixedId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 24)}`
}

export function generateRequestId(): string {
  return prefixedId("req")
}

export function generateCorrelationId(): string {
  return prefixedId("cor")
}

export function generateJobId(): string {
  return prefixedId("job")
}

/**
 * Run a function within a request context.
 * All async operations inside will have access to the context.
 */
export function withRequestContext<T>(
  ctx: Partial<RequestContext>,
  fn: () => T
): T {
  const full: RequestContext = {
    requestId: ctx.requestId || generateRequestId(),
    correlationId: ctx.correlationId || generateCorrelationId(),
    userId: ctx.userId,
    startTime: ctx.startTime || Date.now(),
    method: ctx.method,
    path: ctx.path,
    extra: ctx.extra,
  }
  return storage.run(full, fn)
}

/** Get current request context (or undefined if not in a context). */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore()
}

/** Set userId on current context (e.g., after authentication). */
export function setContextUserId(userId: string): void {
  const ctx = storage.getStore()
  if (ctx) ctx.userId = userId
}

/** Add extra data to current context. */
export function setContextExtra(key: string, value: unknown): void {
  const ctx = storage.getStore()
  if (ctx) {
    ctx.extra = ctx.extra || {}
    ctx.extra[key] = value
  }
}
