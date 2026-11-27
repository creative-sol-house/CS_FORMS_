import mongoose from "mongoose";
import { connectDB } from "./lib/mongodb";
import GlobalIndustry from "./lib/GlobalIndustry";
import { normalizeIndustry } from "./lib/industry";

const SEED_INDUSTRIES: string[] = [
  "Textile & Garments",
  "Pharmaceuticals",
  "Agriculture",
  "Food",
  "Healthcare and Medical",
  "Education and Training",
  "Banking & Financial Services",
  "Retail & E-commerce",
  "Real Estate & Construction",
  "Hospitality & Hotels",
  "Cosmetics & Beauty",
  "Automotive & Engineering",
  "Energy & Power",
  "Telecommunications",
  "Travel & Tourism",
  "Professional Services",
];

async function seed() {
  await connectDB();
  console.log("Connected. Seeding industries…");

  let created = 0;
  let skipped = 0;

  for (const name of SEED_INDUSTRIES) {
    const normalized = normalizeIndustry(name);

    // Skip if either exact normalized match OR a very similar name already exists
    const existing = await GlobalIndustry.findOne({ normalized }).lean();
    if (existing) {
      console.log(`  skip   (exists)  ${name}`);
      skipped++;
      continue;
    }

    try {
      await GlobalIndustry.create({
        name,
        normalized,
        usageCount: 0,
        createdBy: "seed",
        createdById: "seed",
      });
      console.log(`  create           ${name}`);
      created++;
    } catch (err: any) {
      if (err?.code === 11000) {
        console.log(`  skip   (race)    ${name}`);
        skipped++;
      } else {
        console.error(`  FAIL             ${name}:`, err.message);
      }
    }
  }

  console.log(`\nDone. created=${created} skipped=${skipped}`);
  await mongoose.disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
});