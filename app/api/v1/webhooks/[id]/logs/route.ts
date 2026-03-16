import { NextRequest } from "next/server"
import { authenticateRequest, apiError, apiResponse } from "@/lib/api-auth"
import { getWebhookLogs } from "@/lib/actions/webhooks"
import { z } from "zod"

const webhookLogsPaginationSchema = z.object({
  page: z.coerce.number().catch(1).transform((value) => Math.min(10_000, Math.max(1, Math.trunc(value)))),
  limit: z.coerce.number().catch(20).transform((value) => Math.min(100, Math.max(1, Math.trunc(value)))),
})

// GET /api/v1/webhooks/:id/logs — Get webhook delivery logs
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req)
    const { id } = await params

    const url = new URL(req.url)
    const { page, limit } = webhookLogsPaginationSchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    })

    const result = await getWebhookLogs(id, { page, limit }, user.id)
    return apiResponse(result)
  } catch (error) {
    return apiError(error)
  }
}
