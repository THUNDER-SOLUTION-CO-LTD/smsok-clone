/**
 * DLQ (Dead Letter Queue) Worker — handles permanently failed jobs.
 * Concurrency: 3 | No rate limit | No retry
 *
 * Logs failed jobs for manual review. Alerts on threshold (>10 jobs pending).
 */

import { Worker } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type DlqJobData } from "../types"
import { dlqQueue } from "../queues"

const ALERT_THRESHOLD = 10

export function createDlqWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_DLQ]

  const worker = new Worker<DlqJobData>(
    QUEUE_NAMES.SMS_DLQ,
    async (job) => {
      const { originalQueue, originalJobId, error, failedAt, attempts, category, data } = job.data

      // Log for manual review — DLQ jobs are kept in Redis (removeOnComplete: false)
      console.warn(
        `[DLQ] ⚠ originalQueue=${originalQueue} originalJobId=${originalJobId} category=${category} attempts=${attempts} error="${error}" failedAt=${failedAt}`
      )

      // Check threshold — alert if too many jobs in DLQ
      const waitingCount = await dlqQueue.getWaitingCount()
      if (waitingCount > ALERT_THRESHOLD) {
        console.error(
          `[DLQ] 🚨 ALERT: ${waitingCount} jobs in DLQ (threshold: ${ALERT_THRESHOLD}). Manual review required!`
        )
        // Future: send Slack/email alert, write to monitoring system
      }

      // Log structured data for debugging
      console.warn("[DLQ] Job data:", JSON.stringify({
        originalQueue,
        originalJobId,
        category,
        attempts,
        error,
        failedAt,
        userId: "userId" in data ? data.userId : undefined,
        type: "type" in data ? data.type : undefined,
      }))
    },
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
    }
  )

  worker.on("error", (err) => {
    console.error("[DLQ Worker] Error:", err.message)
  })

  return worker
}
