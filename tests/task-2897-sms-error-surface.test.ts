import { describe, expect, it } from "vitest";

import { safeErrorMessage } from "@/lib/error-messages";

describe("Task #2897: SMS send errors stay actionable", () => {
  it("surfaces PDPA sending-hours errors instead of collapsing them to a generic toast", () => {
    const message = "ไม่สามารถส่ง SMS การตลาดระหว่าง 20:00-08:00 น. (PDPA)";
    expect(safeErrorMessage(new Error(message))).toBe(message);
  });

  it("surfaces gateway delivery/auth failures instead of the generic fallback", () => {
    const message = "ส่ง SMS ไม่สำเร็จ — gateway authentication failed";
    expect(safeErrorMessage(new Error(message))).toBe(message);
  });
});
