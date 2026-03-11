/**
 * Campaign Worker — lowest priority, highest retry.
 * Concurrency: 5 | Rate limit: 100/sec | Retry: 8x exponential (10s base)
 *
 * Processes scheduled campaigns: updates campaign status, sends SMS,
 * handles credits/refunds, dispatches webhook events.
 */

import { Worker } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type SmsJobData, type SmsJobResult } from "../types"
import { prisma } from "../../db"
import { dispatchWebhookEvent } from "../../webhook-dispatch"

const CHUNK_SIZE = 100

export function createCampaignWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_CAMPAIGN]

  const worker = new Worker<SmsJobData, SmsJobResult>(
    QUEUE_NAMES.SMS_CAMPAIGN,
    async (job) => {
      const { recipients, message, sender, correlationId, userId, campaignId } = job.data

      if (recipients.length === 0) {
        throw new Error("No recipients")
      }

      // Update campaign status → sending
      if (campaignId) {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: "sending" },
        }).catch(() => {})
      }

      const { sendSingleSms } = await import("../../sms-gateway")

      let sent = 0
      let failed = 0

      for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
        const chunk = recipients.slice(i, i + CHUNK_SIZE)

        const results = await Promise.allSettled(
          chunk.map((phone) => sendSingleSms(phone, message, sender))
        )

        for (let j = 0; j < results.length; j++) {
          const r = results[j]
          if (r.status === "fulfilled" && r.value.success) sent++
          else failed++
        }

        await job.updateProgress(Math.round(((i + chunk.length) / recipients.length) * 100))
      }

      // Update campaign status + counts
      if (campaignId) {
        const finalStatus = failed === recipients.length ? "failed" : "completed"
        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            status: finalStatus,
            sentCount: sent,
            failedCount: failed,
            creditUsed: sent,
            completedAt: new Date(),
          },
        }).catch(() => {})
      }

      // Refund credits for failed sends
      if (failed > 0 && userId) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: failed } },
          }),
          prisma.creditTransaction.create({
            data: {
              userId,
              amount: failed,
              balance: 0, // will be set correctly by trigger/next read
              type: "REFUND",
              description: `Campaign refund: ${failed} failed SMS`,
              refId: campaignId,
            },
          }),
        ]).catch(() => {})
      }

      // Dispatch webhook
      dispatchWebhookEvent(userId, "sms.sent", {
        campaignId,
        sent,
        failed,
        total: recipients.length,
        correlationId,
      })

      console.log(
        `[Campaign Worker] ✓ correlationId=${correlationId} sent=${sent} failed=${failed} total=${recipients.length} jobId=${job.id}`
      )

      return {
        smsId: job.data.id,
        status: failed === recipients.length ? "failed" as const : "sent" as const,
        creditCost: sent,
      }
    },
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
      limiter: config.rateLimit,
    }
  )

  worker.on("completed", (job) => {
    if (job) console.log(`[Campaign Worker] Job ${job.id} completed`)
  })

  worker.on("failed", (job, err) => {
    console.error(`[Campaign Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
  })

  worker.on("error", (err) => {
    console.error("[Campaign Worker] Error:", err.message)
  })

  return worker
}
