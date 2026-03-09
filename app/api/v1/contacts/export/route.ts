import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { exportContacts } from "@/lib/actions/contacts";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const contacts = await exportContacts(user.id);

    if (format === "csv") {
      const header = "name,phone,email,tags,groups,createdAt";
      const rows = contacts.map(
        (c) => `"${c.name}","${c.phone}","${c.email}","${c.tags}","${c.groups}","${c.createdAt}"`
      );
      const csv = [header, ...rows].join("\n");

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return apiResponse({ contacts, total: contacts.length });
  } catch (error) {
    return apiError(error);
  }
}
