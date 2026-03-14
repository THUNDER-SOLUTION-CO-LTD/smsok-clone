/**
 * OTP Rate Limiting — Redis-backed with exponential backoff.
 *
 * Keys:
 *   otp:backoff:{phone}   — send count for exponential backoff (TTL: 30m)
 *   otp:daily:{phone}:{date} — daily send counter (TTL: 24h)
 *   otp:ip:{ip}           — hourly IP send counter (TTL: 1h)
 *
 * Backoff tiers (after each successful send):
 *   1st send: immediate
 *   2nd send: wait 30s
 *   3rd send: wait 60s
 *   4th send: wait 120s
 *   5th send: wait 300s
 *   6th+: blocked by daily quota (5/phone/day)
 *
 * Anti-enumeration: all rate limit responses are identical regardless of phone existence.
 */

import Redis from "ioredis"

const REDIS_HOST = process.env.REDIS_HOST || "localhost"
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined

// Lazy singleton — only connect when first used
let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    })
    _redis.on("error", (err) => {
      console.error("[otp-rate-limit] Redis error:", err.message)
    })
  }
  return _redis
}

// Backoff tiers in seconds: [0, 30, 60, 120, 300]
const BACKOFF_TIERS = [0, 30, 60, 120, 300]
const BACKOFF_TTL = 300 // 5 minutes — covers max backoff window
const DAILY_QUOTA = 5
const DAILY_TTL = 86400 // 24 hours
const IP_HOURLY_LIMIT = 10
const IP_TTL = 3600 // 1 hour
const OTP_EXPIRES_IN = 300 // 5 minutes

export type CooldownState = "ready" | "cooldown" | "backoff" | "blocked"

export type OtpRateLimitResult = {
  allowed: boolean
  retryAfter: number        // seconds until next send allowed (0 if allowed now)
  otpExpiresIn: number      // OTP validity in seconds (constant 300)
  cooldownState: CooldownState  // UI state hint for frontend countdown
  reason?: string           // Thai error message if blocked
}

/**
 * Check if OTP send is allowed for this phone + IP combination.
 * Call BEFORE generating/sending OTP.
 */
export async function checkOtpRateLimit(
  phone: string,
  ip: string
): Promise<OtpRateLimitResult> {
  const redis = getRedis()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const backoffKey = `otp:backoff:${phone}`
  const dailyKey = `otp:daily:${phone}:${today}`
  const ipKey = `otp:ip:${ip}`

  try {
    // Fetch all counters in one round-trip
    const [backoffCount, dailyCount, ipCount, backoffTTL] = await Promise.all([
      redis.get(backoffKey).then((v) => Number(v) || 0),
      redis.get(dailyKey).then((v) => Number(v) || 0),
      redis.get(ipKey).then((v) => Number(v) || 0),
      redis.ttl(backoffKey),
    ])

    // 1. Daily quota check (per phone)
    if (dailyCount >= DAILY_QUOTA) {
      return {
        allowed: false,
        retryAfter: DAILY_TTL, // try again tomorrow
        otpExpiresIn: OTP_EXPIRES_IN,
        cooldownState: "blocked",
        reason: "ส่ง OTP เกินจำนวนสูงสุดต่อวัน กรุณาลองใหม่พรุ่งนี้",
      }
    }

    // 2. IP hourly limit
    if (ipCount >= IP_HOURLY_LIMIT) {
      return {
        allowed: false,
        retryAfter: IP_TTL,
        otpExpiresIn: OTP_EXPIRES_IN,
        cooldownState: "blocked",
        reason: "ส่ง OTP มากเกินไป กรุณารอสักครู่",
      }
    }

    // 3. Exponential backoff check (per phone)
    if (backoffCount > 0) {
      const tierIndex = Math.min(backoffCount, BACKOFF_TIERS.length - 1)
      const requiredWait = BACKOFF_TIERS[tierIndex]!
      const elapsed = BACKOFF_TTL - Math.max(backoffTTL, 0)
      const remaining = requiredWait - elapsed

      if (remaining > 0) {
        return {
          allowed: false,
          retryAfter: remaining,
          otpExpiresIn: OTP_EXPIRES_IN,
          cooldownState: remaining <= 60 ? "cooldown" : "backoff",
          reason: `กรุณารอ ${formatWait(remaining)} ก่อนส่ง OTP อีกครั้ง`,
        }
      }
    }

    // Allowed
    return {
      allowed: true,
      retryAfter: 0,
      otpExpiresIn: OTP_EXPIRES_IN,
      cooldownState: "ready",
    }
  } catch (err) {
    // Redis down — fall through to allow (fail-open for availability)
    // The DB-level rate limit in otp.ts still provides basic protection
    console.error("[otp-rate-limit] Redis check failed, falling through:", (err as Error).message)
    return {
      allowed: true,
      retryAfter: 0,
      otpExpiresIn: OTP_EXPIRES_IN,
      cooldownState: "ready",
    }
  }
}

/**
 * Record a successful OTP send. Call AFTER OTP is sent successfully.
 * Increments backoff counter, daily counter, and IP counter.
 */
export async function recordOtpSend(
  phone: string,
  ip: string
): Promise<void> {
  const redis = getRedis()
  const today = new Date().toISOString().slice(0, 10)

  const backoffKey = `otp:backoff:${phone}`
  const dailyKey = `otp:daily:${phone}:${today}`
  const ipKey = `otp:ip:${ip}`

  try {
    const pipeline = redis.pipeline()
    pipeline.incr(backoffKey)
    pipeline.expire(backoffKey, BACKOFF_TTL)
    pipeline.incr(dailyKey)
    pipeline.expire(dailyKey, DAILY_TTL)
    pipeline.incr(ipKey)
    pipeline.expire(ipKey, IP_TTL)
    await pipeline.exec()
  } catch (err) {
    // Non-fatal — don't break OTP send if Redis fails
    console.error("[otp-rate-limit] Redis record failed:", (err as Error).message)
  }
}

function formatWait(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60)
    return `${minutes} นาที`
  }
  return `${seconds} วินาที`
}
