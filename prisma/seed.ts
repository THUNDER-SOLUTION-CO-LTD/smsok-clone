import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PACKAGES = [
  { name: "SMSOK A", price: 50000, bonusPercent: 0, totalCredits: 2273, costPerSms: 0.22, maxSenders: 5, durationDays: 180, sortOrder: 1 },
  { name: "SMSOK B", price: 100000, bonusPercent: 10, totalCredits: 5000, costPerSms: 0.20, maxSenders: 10, durationDays: 365, sortOrder: 2 },
  { name: "SMSOK C", price: 1000000, bonusPercent: 15, totalCredits: 52273, costPerSms: 0.191, maxSenders: 15, durationDays: 730, sortOrder: 3, isBestSeller: true },
  { name: "SMSOK D", price: 5000000, bonusPercent: 20, totalCredits: 272727, costPerSms: 0.183, maxSenders: 20, durationDays: 730, sortOrder: 4 },
  { name: "SMSOK E", price: 10000000, bonusPercent: 25, totalCredits: 568182, costPerSms: 0.176, maxSenders: -1, durationDays: 1095, sortOrder: 5 },
  { name: "SMSOK F", price: 30000000, bonusPercent: 30, totalCredits: 1772727, costPerSms: 0.169, maxSenders: -1, durationDays: 1095, sortOrder: 6 },
  { name: "SMSOK G", price: 50000000, bonusPercent: 40, totalCredits: 3181818, costPerSms: 0.157, maxSenders: -1, durationDays: 1095, sortOrder: 7 },
  { name: "SMSOK H", price: 100000000, bonusPercent: 50, totalCredits: 6818182, costPerSms: 0.147, maxSenders: -1, durationDays: 1095, sortOrder: 8 },
];

async function main() {
  console.log("Seeding packages...");

  for (const pkg of PACKAGES) {
    await prisma.package.upsert({
      where: { id: pkg.name.replace(" ", "-").toLowerCase() },
      update: pkg,
      create: { id: pkg.name.replace(" ", "-").toLowerCase(), ...pkg },
    });
  }

  console.log(`Seeded ${PACKAGES.length} packages`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
