import { apiResponse, apiError } from "@/lib/api-auth";
import { COMPANY_BANK_ACCOUNT } from "@/lib/constants/bank-account";

// Bank account for manual transfers
const BANK_ACCOUNT = {
  bank: COMPANY_BANK_ACCOUNT.bank,
  accountNumber: COMPANY_BANK_ACCOUNT.accountNumber,
  accountName: COMPANY_BANK_ACCOUNT.accountName,
  logo: COMPANY_BANK_ACCOUNT.logo,
};

// GET /api/v1/bank-accounts — frontend expects { account: {...} }
export async function GET() {
  try {
    return apiResponse({ account: BANK_ACCOUNT });
  } catch (error) {
    return apiError(error);
  }
}
