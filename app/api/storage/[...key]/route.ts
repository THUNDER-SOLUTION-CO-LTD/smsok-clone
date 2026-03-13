import { NextRequest } from "next/server";
import { ApiError, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { getSession } from "@/lib/auth";
import { getStoredFileOwnerId } from "@/lib/storage/files";
import { readStoredFile } from "@/lib/storage/service";

type Ctx = { params: Promise<{ key: string[] }> };

function toStorageKey(segments: string[]) {
  return segments.map((segment) => decodeURIComponent(segment)).join("/");
}

async function authorizeStorageRequest(req: NextRequest, key: string) {
  const session = await getSession({ headers: req.headers });
  const ownerId = getStoredFileOwnerId(key);

  if (session?.id) {
    if (!ownerId || ownerId !== session.id) {
      throw new ApiError(403, "ไม่มีสิทธิ์เข้าถึงไฟล์นี้");
    }

    return;
  }

  await authenticateAdmin(req);
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { key: keySegments } = await ctx.params;
    const key = toStorageKey(keySegments ?? []);
    if (!key) {
      throw new ApiError(404, "ไม่พบไฟล์");
    }

    await authorizeStorageRequest(req, key);
    const file = await readStoredFile(key);

    const fileName = key.split("/").at(-1) || "download";
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new Response(new Uint8Array(file.body), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.contentLength),
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`,
        ...(file.etag ? { ETag: file.etag } : {}),
        ...(file.lastModified
          ? { "Last-Modified": file.lastModified.toUTCString() }
          : {}),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
