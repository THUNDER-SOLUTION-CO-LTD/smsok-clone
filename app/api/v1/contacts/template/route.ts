import { NextRequest } from "next/server";
import { authenticateApiKey, apiError } from "@/lib/api-auth";

// GET /api/v1/contacts/template — Download CSV template
export async function GET(req: NextRequest) {
  try {
    await authenticateApiKey(req);

    const csv = "name,phone\nสมชาย ใจดี,0891234567\nสมหญิง รักเรียน,0812345678\n";

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="contacts-template.csv"',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
