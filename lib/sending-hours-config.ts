/**
 * Canonical sending hours constants — SINGLE SOURCE OF TRUTH
 * Used by both server (lib/sending-hours.ts) and client (SendingHoursWarning.tsx)
 * PDPA quiet hours = 21:00-08:00 (blocked), marketing allowed = 08:00-21:00
 */
export const SENDING_HOURS_START = 8;  // 08:00
export const SENDING_HOURS_END = 21;   // 21:00
export const SENDING_HOURS_TIMEZONE = "Asia/Bangkok";
