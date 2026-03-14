/**
 * SlipOK API — Payment Slip Verification
 * API: POST https://api.slipok.com/api/line/apikey/{BRANCH_ID}
 * Auth: x-authorization header
 * Body: FormData with `files` (image) + `amount` (expected amount)
 * Error codes: 1012 (duplicate), 1013 (amount mismatch), 1014 (wrong receiver)
 */

import { type SlipVerifyResult } from "@/lib/easyslip";

const SLIPOK_BRANCH_ID = process.env.SLIPOK_BRANCH_ID || "";
const SLIPOK_API_KEY = process.env.SLIPOK_API_KEY || "";

function getSlipOkUrl() {
  return `https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`;
}

type SlipOkApiResponse = {
  success?: boolean;
  code?: string;
  message?: string;
  data?: {
    transRef?: string;
    date?: string;
    amount?: number | string;
    countryCode?: string;
    sender?: {
      displayName?: string;
      name?: string;
      account?: { value?: string; bank?: { short?: string } };
      proxy?: { value?: string };
    };
    receiver?: {
      displayName?: string;
      name?: string;
      account?: { value?: string; bank?: { short?: string } };
      proxy?: { value?: string };
    };
  };
};

function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value === "string") {
    const num = Number.parseFloat(value.trim());
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  return null;
}

function mapSlipOkResponse(
  payload: SlipOkApiResponse,
  httpStatus: number,
): SlipVerifyResult {
  const code = payload.code?.trim();

  // Error codes from SlipOK
  if (code === "1012") {
    return {
      success: false,
      error: "สลิปนี้ถูกใช้แล้ว",
      providerCode: "1012",
      providerStatus: httpStatus,
      isDuplicate: true,
    };
  }

  if (code === "1013") {
    return {
      success: false,
      error: "จำนวนเงินในสลิปไม่ตรง",
      providerCode: "1013",
      providerStatus: httpStatus,
    };
  }

  if (code === "1014") {
    return {
      success: false,
      error: "บัญชีปลายทางไม่ตรง",
      providerCode: "1014",
      providerStatus: httpStatus,
    };
  }

  // Non-success with other code
  if (!payload.success && code) {
    return {
      success: false,
      error: payload.message || `SlipOK error: ${code}`,
      providerCode: code,
      providerStatus: httpStatus,
    };
  }

  // Success — extract data
  const data = payload.data;
  if (!data) {
    return {
      success: false,
      error: "SlipOK response missing data",
      providerCode: "invalid_response",
      providerStatus: httpStatus,
    };
  }

  const transRef = data.transRef?.trim();
  if (!transRef) {
    return {
      success: false,
      error: "SlipOK response missing transRef",
      providerCode: "invalid_response",
      providerStatus: httpStatus,
    };
  }

  const date = data.date?.trim();
  if (!date) {
    return {
      success: false,
      error: "SlipOK response missing date",
      providerCode: "invalid_response",
      providerStatus: httpStatus,
    };
  }

  const amount = parseAmount(data.amount);
  if (!amount) {
    return {
      success: false,
      error: "SlipOK response amount invalid",
      providerCode: "invalid_response",
      providerStatus: httpStatus,
    };
  }

  const senderAccount =
    data.sender?.account?.value?.trim() ||
    data.sender?.proxy?.value?.trim() ||
    "";
  const receiverAccount =
    data.receiver?.account?.value?.trim() ||
    data.receiver?.proxy?.value?.trim() ||
    "";

  if (!receiverAccount) {
    return {
      success: false,
      error: "SlipOK response missing receiver account",
      providerCode: "invalid_response",
      providerStatus: httpStatus,
    };
  }

  return {
    success: true,
    isDuplicate: false,
    data: {
      transRef,
      date,
      amount,
      sender: {
        name:
          data.sender?.displayName || data.sender?.name || "",
        bank: data.sender?.account?.bank?.short || "",
        account: senderAccount,
      },
      receiver: {
        name:
          data.receiver?.displayName || data.receiver?.name || "",
        bank: data.receiver?.account?.bank?.short || "",
        account: receiverAccount,
      },
    },
  };
}

/**
 * Verify a slip by downloading from a public URL, then uploading to SlipOK.
 * @param imageUrl - Public URL of the slip image (R2)
 * @param expectedAmount - Expected transfer amount (optional, enables amount validation)
 */
export async function verifySlipByUrl(
  imageUrl: string,
  expectedAmount?: number,
): Promise<SlipVerifyResult> {
  if (!SLIPOK_BRANCH_ID || !SLIPOK_API_KEY) {
    return { success: false, error: "SlipOK API not configured" };
  }

  // Step 1: Download the image from R2
  let imageBlob: Blob;
  try {
    const imgRes = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!imgRes.ok) {
      return {
        success: false,
        error: `Failed to download slip image: ${imgRes.status}`,
      };
    }
    imageBlob = await imgRes.blob();
  } catch (error) {
    console.error("[slipok] image download failed:", error);
    return { success: false, error: "Failed to download slip image" };
  }

  // Step 2: Upload to SlipOK as FormData
  const formData = new FormData();
  formData.append(
    "files",
    imageBlob,
    "slip.jpg",
  );
  if (expectedAmount != null && expectedAmount > 0) {
    formData.append("amount", String(expectedAmount));
  }

  let res: Response;
  try {
    res = await fetch(getSlipOkUrl(), {
      method: "POST",
      headers: {
        "x-authorization": SLIPOK_API_KEY,
      },
      body: formData,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("[slipok] verify request failed:", error);
    return { success: false, error: "SlipOK unavailable" };
  }

  let payload: SlipOkApiResponse;
  try {
    payload = (await res.json()) as SlipOkApiResponse;
  } catch {
    const body = await res.text().catch(() => "");
    console.error("[slipok] invalid JSON response:", res.status, body);
    return {
      success: false,
      error: "SlipOK returned invalid response",
      providerStatus: res.status,
    };
  }

  return mapSlipOkResponse(payload, res.status);
}
