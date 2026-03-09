import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PACKAGES = [
  { name: "SMSOK A", price: 50000, bonusPercent: 0, totalCredits: 2273, maxSenders: 5, durationDays: 180 },
  { name: "SMSOK B", price: 100000, bonusPercent: 10, totalCredits: 5000, maxSenders: 10, durationDays: 365 },
  { name: "SMSOK C", price: 1000000, bonusPercent: 15, totalCredits: 52273, maxSenders: 15, durationDays: 730, isBestSeller: true },
  { name: "SMSOK D", price: 5000000, bonusPercent: 20, totalCredits: 272727, maxSenders: 20, durationDays: 730 },
  { name: "SMSOK E", price: 10000000, bonusPercent: 25, totalCredits: 568182, maxSenders: -1, durationDays: 1095 },
  { name: "SMSOK F", price: 30000000, bonusPercent: 30, totalCredits: 1772727, maxSenders: -1, durationDays: 1095 },
  { name: "SMSOK G", price: 50000000, bonusPercent: 40, totalCredits: 3181818, maxSenders: -1, durationDays: 1095 },
  { name: "SMSOK H", price: 100000000, bonusPercent: 50, totalCredits: 6818182, maxSenders: -1, durationDays: 1095 },
];

async function main() {
  console.log("Seeding packages...");

  for (const pkg of PACKAGES) {
    const id = pkg.name.replace(" ", "-").toLowerCase();
    await prisma.package.upsert({
      where: { id },
      update: {
        name: pkg.name,
        price: pkg.price,
        bonusPercent: pkg.bonusPercent,
        totalCredits: pkg.totalCredits,
        maxSenders: pkg.maxSenders,
        durationDays: pkg.durationDays,
        isBestSeller: pkg.isBestSeller ?? false,
      },
      create: {
        id,
        name: pkg.name,
        price: pkg.price,
        bonusPercent: pkg.bonusPercent,
        totalCredits: pkg.totalCredits,
        maxSenders: pkg.maxSenders,
        durationDays: pkg.durationDays,
        isBestSeller: pkg.isBestSeller ?? false,
      },
    });
  }

  console.log(`Seeded ${PACKAGES.length} packages`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
