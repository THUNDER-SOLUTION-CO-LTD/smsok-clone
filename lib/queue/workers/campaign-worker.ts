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
import { InsufficientCreditsError } from "../../quota-errors"
import { dispatchWebhookEvent } from "../../webhook-dispatch"
import { logger } from "../../logger"

const CHUNK_SIZE = 100

export function createCampaignWorker() {
  const config = QUEUE_CONFIG[QUEUE_NAMES.SMS_CAMPAIGN]

  const worker = new Worker<SmsJobData, SmsJobResult>(
    QUEUE_NAMES.SMS_CAMPAIGN,
    async (job) => {
      const { recipients, message, sender, correlationId, userId, campaignId } = job.data
      const isRecurringRun = Boolean(job.opts.repeat?.pattern || job.repeatJobKey)

      if (recipients.length === 0) {
        throw new Error("No recipients")
      }

      const { sendSingleSms } = await import("../../sms-gateway")
      const {
        calculateSmsSegments,
        deductQuota,
        ensureSufficientQuota,
        refundQuotaIfEligible,
      } = await import("../../package/quota")

      const smsCount = calculateSmsSegments(message)
      const totalCredits = smsCount * recipients.length
      const campaign = campaignId
        ? await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true, name: true },
        })
        : null

      const handleInsufficientCredits = async (error: InsufficientCreditsError) => {
        if (campaignId) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: isRecurringRun
              ? {
                status: "scheduled",
                failedCount: recipients.length,
              }
              : {
                status: "failed",
                failedCount: recipients.length,
                completedAt: new Date(),
              },
          }).catch((err) => {
            console.error(`[Campaign Worker] Failed to update insufficient-credit status: campaignId=${campaignId}`, err)
          })
        }

        const { sendScheduledSmsInsufficientCreditsNotice } = await import("../../actions/notifications")
        await sendScheduledSmsInsufficientCreditsNotice(userId, {
          campaignName: campaign?.name ?? null,
          creditsRequired: error.creditsRequired,
          creditsRemaining: error.creditsRemaining,
          recurring: isRecurringRun,
        })

        logger.warn("campaign worker skipped job due to insufficient credits", {
          campaignId,
          correlationId,
          creditsRemaining: error.creditsRemaining,
          creditsRequired: error.creditsRequired,
          isRecurringRun,
          jobId: job.id,
          totalRecipients: recipients.length,
        })

        return {
          smsId: job.data.id,
          status: "failed" as const,
          creditCost: 0,
        }
      }

      try {
        await ensureSufficientQuota(userId, totalCredits)
      } catch (error) {
        if (!(error instanceof InsufficientCreditsError)) {
          throw error
        }
        return handleInsufficientCredits(error)
      }

      let deductions: Array<{ purchaseId: string; amount: number }> = []

      if (campaignId) {
        try {
          await prisma.$transaction(async (tx) => {
            await tx.campaign.update({
              where: { id: campaignId },
              data: { status: "sending" },
            })

            const quotaResult = await deductQuota(tx, userId, totalCredits)
            deductions = quotaResult.deductions
          })
        } catch (error) {
          if (error instanceof InsufficientCreditsError) {
            return handleInsufficientCredits(error)
          }

          console.error(`[Campaign Worker] Failed to reserve quota: campaignId=${campaignId}`, error)
          throw error
        }
      } else {
        try {
          await prisma.$transaction(async (tx) => {
            const quotaResult = await deductQuota(tx, userId, totalCredits)
            deductions = quotaResult.deductions
          })
        } catch (error) {
          if (error instanceof InsufficientCreditsError) {
            return handleInsufficientCredits(error)
          }
          throw error
        }
      }

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
            creditUsed: sent * smsCount,
            completedAt: new Date(),
          },
        }).catch((err) => { console.error(`[Campaign Worker] Failed to update completion metrics: campaignId=${campaignId}`, err); throw err })
      }

      // Refund package quota for failed sends (tier D+ only)
      if (failed > 0 && userId) {
        let remainingRefund = failed * smsCount

        await prisma.$transaction(async (tx) => {
          for (const deduction of [...deductions].reverse()) {
            if (remainingRefund <= 0) break

            const refundable = Math.min(remainingRefund, deduction.amount)
            if (refundable <= 0) continue

            const refunded = await refundQuotaIfEligible(tx, deduction.purchaseId, refundable)
            if (refunded) {
              remainingRefund -= refundable
            }
          }
        }).catch((err) => {
          console.error(`[Campaign Worker] CRITICAL: Refund failed! userId=${userId} amount=${failed}`, err)
          throw err
        })
      }

      // Dispatch webhook
      dispatchWebhookEvent(userId, "campaign.completed", {
        campaignId,
        sent,
        failed,
        total: recipients.length,
        correlationId,
      })

      logger.info("campaign worker processed job", {
        correlationId,
        sent,
        failed,
        total: recipients.length,
        jobId: job.id,
      })

      return {
        smsId: job.data.id,
        status: failed === recipients.length ? "failed" as const : "sent" as const,
        creditCost: sent * smsCount,
      }
    },
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
      limiter: config.rateLimit,
    }
  )

  worker.on("completed", (job) => {
    if (job) logger.info("campaign worker job completed", { jobId: job.id })
  })

  worker.on("failed", (job, err) => {
    console.error(`[Campaign Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`)
  })

  worker.on("error", (err) => {
    console.error("[Campaign Worker] Error:", err.message)
  })

  return worker
}
