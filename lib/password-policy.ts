/**
 * Password Policy — shared between frontend and backend.
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - Not in common password blacklist (top 1000)
 *
 * Strength scoring: 0-4 (weak → very strong)
 */

import { z } from "zod";

// Top common passwords — abbreviated to save space, covers the most critical ones.
// Sources: SecLists, Have I Been Pwned top 1000
const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
  "letmein", "trustno1", "dragon", "baseball", "iloveyou", "master", "sunshine",
  "ashley", "michael", "shadow", "123123", "654321", "superman", "qazwsx",
  "football", "password1", "password123", "batman", "login", "starwars",
  "admin", "passw0rd", "hello", "charlie", "donald", "qwerty123", "1q2w3e4r",
  "welcome", "welcome1", "p@ssw0rd", "p@ssword", "pass@123", "admin123",
  "root", "toor", "test", "guest", "master123", "changeme", "123456789",
  "12345", "1234567890", "0987654321", "1qaz2wsx", "qwer1234", "1234qwer",
  "zaq1xsw2", "password1!", "abcdef", "abcd1234", "abc12345", "1111",
  "aaaaaa", "access", "121212", "696969", "mustang", "jordan", "harley",
  "ranger", "dakota", "george", "falcon", "andrea", "joshua", "banana",
  "summer", "winter", "spring", "autumn", "soccer", "hockey", "lakers",
  "cowboys", "tigers", "yankees", "phoenix", "thunder", "purple",
  "freedom", "whatever", "princess", "diamond", "secret", "ginger",
  "sparky", "trigger", "rocket", "silver", "hunter", "killer", "pepper",
  "orange", "cookie", "buster", "maxwell", "merlin", "arthur", "legend",
  "oliver", "cheese", "coffee", "matrix", "flower", "garden", "angel",
  "guitar", "loveme", "internet", "cheese1", "dragon1", "shadow1",
  "master1", "michael1", "superman1", "batman1", "starwars1", "football1",
  "baseball1", "soccer1", "hockey1", "monkey1", "jordan1", "eagle1",
  "computer", "jessica", "jennifer", "michelle", "melissa", "william",
  "patrick", "richard", "daniel", "thomas", "robert", "steven", "andrew",
  "matthew", "anthony", "joseph", "nicholas", "brandon", "benjamin",
  "q1w2e3r4", "zxcvbn", "zxcvbnm", "asdfgh", "asdfghjkl", "qwertyuiop",
  "1q2w3e", "q1w2e3", "passpass", "password2", "password12", "password0",
  "pass1234", "test1234", "test123", "abc1234", "asd123", "zxc123",
  "qwe123", "iloveu", "trustme", "letmein1", "welcome123", "admin1",
  "admin1234", "root123", "user", "user123", "default", "temp", "temp123",
  "smsok", "smsok123", "easysms", "sendsms", "otp123", "otp12345",
  // Thai-context common passwords
  "bangkok", "thailand", "sawasdee", "sanook", "narak", "suay",
  "password!", "p@ss1234", "passw0rd1", "Pa$$w0rd", "Qwerty1",
  // Keyboard patterns
  "1qazxsw2", "zaq12wsx", "!qaz2wsx", "1qaz@wsx",
  "qwerty1", "asdfgh1", "zxcvbn1",
  // Sequential
  "abcdefgh", "87654321", "11111111", "00000000", "99999999",
  "11223344", "12341234", "abcdabcd", "qwerqwer",
  // Year-based
  "password2024", "password2025", "password2026",
  "pass2024", "pass2025", "pass2026",
]);

/**
 * Check if a password is in the common password blacklist.
 * Case-insensitive comparison.
 */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}

/**
 * Password strength scoring (0-4):
 * 0 = very weak (common password or too short)
 * 1 = weak (meets minimum but barely)
 * 2 = fair (8-11 chars, meets all rules)
 * 3 = strong (12-15 chars, meets all rules)
 * 4 = very strong (16+ chars, meets all rules + special char)
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  labelTh: string;
} {
  if (!password || password.length < 8 || isCommonPassword(password)) {
    return { score: 0, label: "very weak", labelTh: "อ่อนมาก" };
  }

  let score = 1;

  // Length bonuses
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasUpper && hasLower && hasNumber) score = Math.max(score, 2);
  if (hasSpecial) score++;

  score = Math.min(score, 4);

  const labels: Record<number, { label: string; labelTh: string }> = {
    0: { label: "very weak", labelTh: "อ่อนมาก" },
    1: { label: "weak", labelTh: "อ่อน" },
    2: { label: "fair", labelTh: "พอใช้" },
    3: { label: "strong", labelTh: "แข็งแรง" },
    4: { label: "very strong", labelTh: "แข็งแรงมาก" },
  };

  return { score, ...labels[score]! };
}

/**
 * Shared Zod password schema — use for registration, reset, and change password.
 * Enforces: 8+ chars, uppercase, lowercase, number, not common.
 */
export const passwordSchema = z
  .string()
  .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
  .max(100, "รหัสผ่านต้องไม่เกิน 100 ตัวอักษร")
  .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
  .regex(/[a-z]/, "ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
  .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว")
  .refine((val) => !isCommonPassword(val), {
    message: "รหัสผ่านนี้เป็นรหัสผ่านที่ใช้กันทั่วไป กรุณาเลือกรหัสผ่านอื่น",
  });

/**
 * Password policy rules — for frontend display
 */
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 100,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  blacklistEnabled: true,
} as const;
