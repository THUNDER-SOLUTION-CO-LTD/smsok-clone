// ── PromptPay QR Code Generator (EMVCo Standard) ──
// Generates PromptPay QR payload string following BOT/EMVCo spec
// Ref: Bank of Thailand PromptPay QR Code specification

import QRCode from "qrcode";

// ── TLV Helpers ──

function tlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

// ── CRC-16/CCITT-FALSE ──

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// ── Format PromptPay ID ──

function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, "");
  // Thai phone: 0xxxxxxxxx → 0066xxxxxxxxx
  if (digits.startsWith("0") && digits.length === 10) {
    return "0066" + digits.substring(1);
  }
  // Already international: 66xxxxxxxxx
  if (digits.startsWith("66") && digits.length === 11) {
    return "00" + digits;
  }
  return digits;
}

function isPhoneNumber(id: string): boolean {
  const digits = id.replace(/\D/g, "");
  return (
    (digits.startsWith("0") && digits.length === 10) ||
    (digits.startsWith("66") && digits.length === 11)
  );
}

// ── Generate PromptPay Payload ──

export function generatePromptPayPayload(
  promptPayId: string,
  amount?: number
): string {
  // Determine ID type and format
  const isPhone = isPhoneNumber(promptPayId);
  const formattedId = isPhone
    ? formatPhoneNumber(promptPayId)
    : promptPayId.replace(/\D/g, ""); // Tax ID / National ID (13 digits)

  // Sub-tag: 01 = phone, 02 = national/tax ID
  const idSubTag = isPhone ? "01" : "02";

  // Merchant Account Info (Tag 29)
  const merchantAccountInfo =
    tlv("00", "A000000677010111") + // PromptPay AID
    tlv(idSubTag, formattedId);

  // Build payload (without CRC)
  let payload =
    tlv("00", "01") + // Payload Format Indicator
    tlv("01", amount ? "12" : "11") + // Point of Initiation: 12=dynamic, 11=static
    tlv("29", merchantAccountInfo) + // Merchant Account Info
    tlv("53", "764") + // Currency: THB
    (amount ? tlv("54", amount.toFixed(2)) : "") + // Amount
    tlv("58", "TH"); // Country Code

  // Add CRC placeholder then calculate
  payload += "6304";
  const checksum = crc16(payload);
  payload += checksum;

  return payload;
}

// ── Generate QR Code Data URL ──

export async function generatePromptPayQRDataUrl(
  promptPayId: string,
  amount?: number
): Promise<string> {
  const payload = generatePromptPayPayload(promptPayId, amount);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
