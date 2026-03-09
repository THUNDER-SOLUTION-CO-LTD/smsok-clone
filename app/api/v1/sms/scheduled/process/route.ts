import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { processScheduledSms } from "@/lib/actions/scheduled-sms";

// POST /api/v1/sms/scheduled/process — cron endpoint to send due messages
// Protected by CRON_SECRET header (for external cron services like Vercel Cron)
export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const auth = req.headers.get("authorization");
      if (auth !== `Bearer ${cronSecret}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }

    const result = await processScheduledSms();
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
