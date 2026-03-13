import { AsyncLocalStorage } from "node:async_hooks";
import { headers } from "next/headers";
import { getSession } from "./auth";

export const INTERNAL_ACTION_USER = Symbol("internal-action-user");
export type InternalActionUserToken = typeof INTERNAL_ACTION_USER;

type ActionUserContext = {
  userId: string;
};

const actionUserContext = new AsyncLocalStorage<ActionUserContext>();
const trustedRequestUsers = new Map<string, { userId: string; expiresAt: number }>();
const TRUSTED_REQUEST_TTL_MS = 10_000;

function rememberTrustedRequestUser(userId: string, requestId: string) {
  const now = Date.now();
  trustedRequestUsers.set(requestId, {
    userId,
    expiresAt: now + TRUSTED_REQUEST_TTL_MS,
  });

  for (const [knownRequestId, entry] of trustedRequestUsers.entries()) {
    if (entry.expiresAt <= now) {
      trustedRequestUsers.delete(knownRequestId);
    }
  }
}

async function getTrustedRequestUserId() {
  try {
    const headerStore = await headers();
    const requestId = headerStore.get("x-request-id");
    if (!requestId) {
      return null;
    }

    const trustedRequestUser = trustedRequestUsers.get(requestId);
    if (!trustedRequestUser) {
      return null;
    }

    if (trustedRequestUser.expiresAt <= Date.now()) {
      trustedRequestUsers.delete(requestId);
      return null;
    }

    return trustedRequestUser.userId;
  } catch {
    return null;
  }
}

export function trustActionUserId(userId: string, requestId?: string | null) {
  actionUserContext.enterWith({ userId });

  if (requestId) {
    rememberTrustedRequestUser(userId, requestId);
  }
}

export async function requireSessionUserId() {
  const sessionUser = await getSession();
  if (!sessionUser?.id) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }

  return sessionUser.id;
}

export async function resolveActionUserId(
  explicitUserId?: string | null,
  token?: InternalActionUserToken,
) {
  const sessionUser = await getSession();
  const isInternalCall = token === INTERNAL_ACTION_USER;
  const trustedUserId = actionUserContext.getStore()?.userId ?? null;
  const requestUserId = await getTrustedRequestUserId();
  const currentUserId = sessionUser?.id ?? trustedUserId ?? requestUserId;

  if (!isInternalCall && currentUserId) {
    if (explicitUserId && explicitUserId !== currentUserId) {
      throw new Error("ไม่สามารถดำเนินการแทนผู้ใช้อื่นได้");
    }

    return currentUserId;
  }

  if (isInternalCall && explicitUserId) {
    return explicitUserId;
  }

  if (currentUserId) {
    return currentUserId;
  }

  throw new Error("กรุณาเข้าสู่ระบบ");
}
