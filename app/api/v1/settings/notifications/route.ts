import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { getNotificationPrefs, updateNotificationPrefs } from "@/lib/actions/settings";

// Mapping between frontend id+channel and DB field names
type DbFields = {
  emailCreditLow?: boolean;
  emailCampaignDone?: boolean;
  emailWeeklyReport?: boolean;
  emailSecurity?: boolean;
  emailPackageExpiry?: boolean;
  emailInvoice?: boolean;
  smsCreditLow?: boolean;
  smsCampaignDone?: boolean;
};

type DbPrefs = Required<DbFields>;

const CHANNEL_MAP: Record<string, Record<string, keyof DbFields>> = {
  low_balance:       { email: "emailCreditLow",    sms: "smsCreditLow" },
  campaign_complete: { email: "emailCampaignDone",  sms: "smsCampaignDone" },
  monthly_report:    { email: "emailWeeklyReport" },
  security_alert:    { email: "emailSecurity" },
  package_expiry:    { email: "emailPackageExpiry" },
  invoice:           { email: "emailInvoice" },
};

// Transform DB prefs object → array expected by frontend
function toFrontendArray(prefs: DbPrefs) {
  return Object.entries(CHANNEL_MAP).map(([id, channels]) => ({
    id,
    email: channels.email ? (prefs[channels.email] ?? true) : undefined,
    sms:   channels.sms   ? (prefs[channels.sms]   ?? false) : undefined,
  }));
}

// Transform frontend { id, email?, sms? } → DB field patch
function toDbPatch(body: { id: string; email?: boolean; sms?: boolean }): DbFields {
  const channels = CHANNEL_MAP[body.id];
  if (!channels) return {};
  const patch: DbFields = {};
  if (channels.email !== undefined && body.email !== undefined) {
    patch[channels.email] = body.email;
  }
  if (channels.sms !== undefined && body.sms !== undefined) {
    patch[channels.sms] = body.sms;
  }
  return patch;
}

// GET /api/v1/settings/notifications — get notification preferences
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const prefs = await getNotificationPrefs(user.id);
    return apiResponse(toFrontendArray(prefs as DbPrefs));
  } catch (error) {
    return apiError(error);
  }
}

// PUT /api/v1/settings/notifications — full update (DB field names)
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const result = await updateNotificationPrefs(user.id, body);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/v1/settings/notifications — partial update via { id, email?, sms? }
export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json() as { id: string; email?: boolean; sms?: boolean };
    const patch = toDbPatch(body);
    if (Object.keys(patch).length === 0) {
      return apiResponse({ message: "nothing to update" });
    }
    const result = await updateNotificationPrefs(user.id, patch);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
