// POST /api/v1/packages/purchase/verify-slip — canonical package-purchase slip verification route
// Reuses the existing compatibility implementation to avoid drift with legacy /api/v1/payments/topup/verify-slip.

export { POST } from "@/app/api/v1/payments/topup/verify-slip/route";
