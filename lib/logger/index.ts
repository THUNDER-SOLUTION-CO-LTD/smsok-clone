/**
 * Logger barrel export — single import point.
 *
 * Usage:
 *   import { log, withRequestContext, generateRequestId } from "@/lib/logger"
 */

export { log, createComponentLogger } from "./logger"
export {
  withRequestContext,
  getRequestContext,
  setContextUserId,
  setContextExtra,
  generateRequestId,
  generateCorrelationId,
  generateJobId,
  type RequestContext,
} from "./context"
