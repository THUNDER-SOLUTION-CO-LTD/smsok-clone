import { NextRequest } from "next/server";
import { authenticateRequest, apiError, apiResponse } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

type DailyRow = {
  day: Date;
  sent: bigint;
  delivered: bigint;
  failed: bigint;
};

function toCount(value: bigint | number | null | undefined) {
  return Number(value ?? 0);
}

function buildDateSeries(days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (days - index - 1));
    return day;
  });
}

// GET /api/v1/analytics/daily?days=1|7|30 or ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const fromParam = req.nextUrl.searchParams.get("from");
    const toParam = req.nextUrl.searchParams.get("to");

    let dateKeys: string[];
    let from: Date;

    if (fromParam && toParam) {
      // Build date series from string params to avoid timezone issues
      const startParts = fromParam.split("-").map(Number);
      const endParts = toParam.split("-").map(Number);
      const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      from = startDate;

      dateKeys = [];
      const cursor = new Date(startDate);
      while (cursor <= endDate && dateKeys.length < 365) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, "0");
        const d = String(cursor.getDate()).padStart(2, "0");
        dateKeys.push(`${y}-${m}-${d}`);
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      const days = Math.min(30, Math.max(1, Number(req.nextUrl.searchParams.get("days") || "30")));
      const dateSeries = buildDateSeries(days);
      from = dateSeries[0];
      dateKeys = dateSeries.map((day) => {
        const y = day.getFullYear();
        const m = String(day.getMonth() + 1).padStart(2, "0");
        const d = String(day.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      });
    }

    const rows = await db.$queryRaw<DailyRow[]>`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) FILTER (WHERE status = 'sent')::bigint AS sent,
        COUNT(*) FILTER (WHERE status = 'delivered')::bigint AS delivered,
        COUNT(*) FILTER (WHERE status = 'failed')::bigint AS failed
      FROM messages
      WHERE user_id = ${user.id} AND created_at >= ${from}
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `;

    const rowMap = new Map<string, { sent: number; delivered: number; failed: number }>(
      rows.map((row: DailyRow) => {
        const rd = new Date(row.day);
        const y = rd.getFullYear();
        const m = String(rd.getMonth() + 1).padStart(2, "0");
        const d = String(rd.getDate()).padStart(2, "0");
        return [
          `${y}-${m}-${d}`,
          {
            sent: toCount(row.sent),
            delivered: toCount(row.delivered),
            failed: toCount(row.failed),
          },
        ] as [string, { sent: number; delivered: number; failed: number }];
      }),
    );

    return apiResponse({
      data: dateKeys.map((key) => {
        const stats = rowMap.get(key);
        return {
          date: key,
          sent: stats?.sent ?? 0,
          delivered: stats?.delivered ?? 0,
          failed: stats?.failed ?? 0,
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
