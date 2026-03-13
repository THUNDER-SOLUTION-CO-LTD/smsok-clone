import QRCode from "qrcode";

const DEFAULT_VERIFY_BASE_URL = "https://verify.smsok.co";

function getVerifyBaseUrl() {
  const baseUrl =
    process.env.DOCUMENT_VERIFY_BASE_URL ||
    process.env.NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL ||
    DEFAULT_VERIFY_BASE_URL;

  return baseUrl.replace(/\/+$/, "");
}

export function buildDocumentVerificationUrl(documentNumber: string) {
  return `${getVerifyBaseUrl()}/${encodeURIComponent(documentNumber)}`;
}

export async function buildDocumentVerificationAssets(documentNumber: string) {
  const verificationUrl = buildDocumentVerificationUrl(documentNumber);
  const verificationQrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 0,
    width: 128,
  });

  return {
    verificationUrl,
    verificationQrDataUrl,
  };
}
