/**
 * Logger barrel export — single import point.
 *
 * Usage:
 *   import { log, withRequestContext, generateRequestId } from "@/lib/logger"
 */

export { log, log as logger, createComponentLogger } from "./logger"
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
