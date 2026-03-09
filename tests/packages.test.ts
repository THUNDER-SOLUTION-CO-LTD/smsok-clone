import { describe, it, expect } from "vitest";

// Import PACKAGES constant directly
import { PACKAGES } from "@/lib/packages-data";

describe("PACKAGES constant", () => {
  it("has exactly 8 packages", () => {
    expect(PACKAGES).toHaveLength(8);
  });

  it("packages are named A through H", () => {
    expect(PACKAGES[0].name).toBe("SMSOK A");
    expect(PACKAGES[7].name).toBe("SMSOK H");
  });

  it("prices are in ascending order", () => {
    for (let i = 1; i < PACKAGES.length; i++) {
      expect(PACKAGES[i].price).toBeGreaterThan(PACKAGES[i - 1].price);
    }
  });

  it("cost per SMS decreases with higher packages", () => {
    for (let i = 1; i < PACKAGES.length; i++) {
      expect(PACKAGES[i].costPerSms).toBeLessThan(PACKAGES[i - 1].costPerSms);
    }
  });

  it("bonus percent increases with higher packages", () => {
    for (let i = 1; i < PACKAGES.length; i++) {
      expect(PACKAGES[i].bonusPercent).toBeGreaterThanOrEqual(PACKAGES[i - 1].bonusPercent);
    }
  });

  it("package A has 0% bonus", () => {
    expect(PACKAGES[0].bonusPercent).toBe(0);
  });

  it("package H has 50% bonus", () => {
    expect(PACKAGES[7].bonusPercent).toBe(50);
  });

  it("package A costs ฿500 (50000 satang)", () => {
    expect(PACKAGES[0].price).toBe(50000);
  });

  it("package H costs ฿1,000,000 (100000000 satang)", () => {
    expect(PACKAGES[7].price).toBe(100000000);
  });

  it("package A: 5 max senders", () => {
    expect(PACKAGES[0].maxSenders).toBe(5);
  });

  it("package E-H: unlimited senders (-1)", () => {
    expect(PACKAGES[4].maxSenders).toBe(-1);
    expect(PACKAGES[5].maxSenders).toBe(-1);
    expect(PACKAGES[6].maxSenders).toBe(-1);
    expect(PACKAGES[7].maxSenders).toBe(-1);
  });

  it("package A: 180 days duration", () => {
    expect(PACKAGES[0].durationDays).toBe(180);
  });

  it("package B: 365 days duration", () => {
    expect(PACKAGES[1].durationDays).toBe(365);
  });

  it("package E-H: 1095 days (3 years)", () => {
    expect(PACKAGES[4].durationDays).toBe(1095);
    expect(PACKAGES[7].durationDays).toBe(1095);
  });

  it("total credits match expected for package A", () => {
    expect(PACKAGES[0].totalCredits).toBe(2273);
  });

  it("total credits match expected for package H", () => {
    expect(PACKAGES[7].totalCredits).toBe(6818182);
  });
});
