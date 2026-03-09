import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { verifyTopupSlip } from "@/lib/actions/payments";
import { authenticateRequestUser } from "@/lib/request-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequestUser(req);
    const body = await req.json();
    const result = await verifyTopupSlip(user.id, body.payload);
    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
