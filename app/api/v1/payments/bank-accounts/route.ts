import { NextRequest } from "next/server";
import { ApiError, apiResponse, apiError } from "@/lib/api-auth";
import { getSession } from "@/lib/auth";
import { COMPANY_BANK_ACCOUNT } from "@/lib/constants/bank-account";

const BANK_ACCOUNTS = [
  {
    bank: COMPANY_BANK_ACCOUNT.bank,
    accountNumber: COMPANY_BANK_ACCOUNT.accountNumber,
    accountName: COMPANY_BANK_ACCOUNT.accountName,
    accountType: COMPANY_BANK_ACCOUNT.accountType,
    branch: COMPANY_BANK_ACCOUNT.branch,
    logo: COMPANY_BANK_ACCOUNT.logo,
    promptpayId: COMPANY_BANK_ACCOUNT.promptpayId,
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) throw new ApiError(401, "กรุณาเข้าสู่ระบบ");

    return apiResponse({ account: BANK_ACCOUNTS[0] });
  } catch (error) {
    return apiError(error);
  }
}
