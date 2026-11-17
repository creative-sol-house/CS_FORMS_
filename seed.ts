/**
 * Seed script — inserts sample leads into MongoDB.
 * Run once with:  npx tsx scripts/seed-leads.ts
 * Delete with:    npx tsx scripts/seed-leads.ts --delete
 */

import mongoose from "mongoose";
import dns from "node:dns";
import dotenv from "dotenv";
import path from "path";

// Load env BEFORE importing models (models read env at import time)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// DNS fix (same as lib/mongodb.ts)
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing in .env.local");
  process.exit(1);
}

// Seeded leads — each has a unique marker in `projectTitle` so we can find/delete them
const SEED_MARKER = "[SEED]";

const leads = [
  {
    serviceCategory: "Automation Software",
    fullName: "Sarah Jenkins",
    email: "sarah.jenkins@northbridge-logistics.com",
    phone: "+1 (415) 555-0192",
    clientType: "Business",
    consultantName: "Michael Chen",
    companyName: "Northbridge Logistics",
    designation: "Operations Director",
    requirementType: "Service",
    projectTitle: `${SEED_MARKER} Warehouse Inventory Automation`,
    projectGoals: "Reduce manual stock counting by 80% and integrate with existing ERP",
    targetAudience: "Internal warehouse staff (40+ employees)",
    existingWebsite: "https://northbridge-logistics.com",
    serviceType: "Custom Automation",
    projectDescription:
      "Need an automated inventory tracking system using barcode scanning with real-time ERP sync",
    serviceFeatures: ["Barcode scanning", "ERP integration", "Real-time alerts", "Mobile app"],
    timeline: "3 months",
    preferredContactMethod: "Email",
    preferredContactTime: "Weekdays 9am-12pm",
    agreeToTerms: true,
    subscribeUpdates: true,
  },
  {
    serviceCategory: "Web Development",
    fullName: "David Okafor",
    email: "david.okafor.photography@gmail.com",
    phone: "+44 7700 900431",
    clientType: "Individual",
    consultantName: "Priya Sharma",
    projectTitle: `${SEED_MARKER} Photography Portfolio Website`,
    projectGoals: "Showcase portfolio, allow client booking, display pricing packages",
    targetAudience: "Wedding and event clients in London",
    businessDescription: "Freelance photographer specializing in weddings and corporate events",
    usp: "10 years experience, cinematic editing style",
    businessKeywords: "London wedding photographer, event photography",
    pagesNeeded: "Home, Portfolio, About, Pricing, Contact, Booking",
    featuresNeeded: "Image gallery, Booking calendar, Contact form, Payment integration",
    websiteGoal: "Generate 20+ booking inquiries per month",
    launchDate: "2026-03-01",
    preferredContactMethod: "WhatsApp Msg",
    preferredContactTime: "Weekends 10am-4pm",
    agreeToTerms: true,
  },
  {
    serviceCategory: "Logo Design",
    fullName: "Amara Diallo",
    email: "amara@bloomcafe.co",
    phone: "+234 803 555 7788",
    clientType: "Business",
    consultantName: "James Park",
    companyName: "Bloom Café",
    designation: "Founder",
    projectTitle: `${SEED_MARKER} Bloom Café Rebrand`,
    projectGoals: "Modern, warm, inviting logo that works on signage and cups",
    targetAudience: "Young professionals and coffee lovers in Lagos",
    logoMessage: "Warm, organic, handcrafted, community-focused",
    likedLogos: "Starbucks, Blue Bottle, local artisan roasters",
    logoType: "Combination mark (icon + wordmark)",
    colorPreferences: "Earthy greens, warm cream, terracotta",
    tagline: "Rooted in every cup",
    competitorBranding: "Competitors use generic coffee bean icons — want something more organic",
    audienceDetail: "Ages 22-40, urban, design-conscious, values sustainability",
    preferredContactMethod: "Email",
    preferredContactTime: "Any weekday",
    agreeToTerms: true,
  },
  {
    serviceCategory: "Digital Marketing",
    fullName: "Tomás Rivera",
    email: "tomas@riverafurniture.mx",
    phone: "+52 55 5555 1234",
    clientType: "Business",
    consultantName: "Aisha Khan",
    companyName: "Rivera Furniture Co.",
    designation: "Marketing Manager",
    projectTitle: `${SEED_MARKER} Q2 2026 SEO & Content Campaign`,
    projectGoals: "Increase organic traffic by 150% and rank top 3 for handmade furniture Mexico City",
    targetAudience: "Homeowners aged 30-55, Mexico City and Guadalajara",
    brandName: "Rivera Furniture Co.",
    natureOfBusiness: "Handcrafted furniture manufacturer and retailer",
    businessActivities: "Custom furniture, retail showroom, B2B hospitality contracts",
    majorClients: "Hotel chains, interior designers, restaurants",
    countryWiseMarket: "Mexico (primary), US Southwest (secondary)",
    targetAudienceFull: "Homeowners, interior designers, boutique hotels",
    businessKeywords50:
      "handmade furniture Mexico, custom wood furniture CDMX, luxury furniture Mexico",
    totalProducts: "120",
    topRatedProducts: "Walnut dining table, Leather lounge chair, Oak bookshelf",
    topProductKeywords: "walnut dining table, leather lounge chair, oak bookshelf",
    importantPageOrProduct: "Walnut dining table collection page",
    socialMediaCredentials: "Instagram: @riverafurniture, Facebook: /riverafurnituremx",
    gscDetails: "Connected - property verified",
    existingSearchSubmissions: "Sitemap submitted 2026-01-15",
    competitorNamesUrls: "mueblesmodernos.mx, casayestilo.mx",
    preferredContactMethod: "Zoom Meeting",
    preferredContactTime: "Tuesdays/Thursdays 2pm-5pm CST",
    agreeToTerms: true,
  },
  {
    serviceCategory: "Web Development",
    fullName: "Emily Watson",
    email: "emily.watson@greenleafmed.org",
    phone: "+61 412 555 678",
    clientType: "Business",
    consultantName: "Michael Chen",
    companyName: "GreenLeaf Medical Center",
    designation: "Practice Manager",
    projectTitle: `${SEED_MARKER} Patient Portal & Appointment Booking`,
    projectGoals: "Reduce phone call load by 60% and let patients self-book appointments",
    targetAudience: "Existing and new patients in Melbourne",
    existingWebsite: "https://greenleafmed.org",
    businessDescription: "Multi-doctor general practice clinic with 4 locations",
    usp: "Same-day appointments, all-insurance accepted, multilingual staff",
    businessKeywords: "Melbourne GP, family doctor Melbourne, bulk billing clinic",
    pagesNeeded: "Home, Services, Doctors, Locations, Booking, Patient Portal, Contact",
    featuresNeeded: "Appointment booking, Patient login, Prescription requests, Secure messaging",
    websiteGoal: "Cut front-desk call volume and reduce no-shows via SMS reminders",
    launchDate: "2026-06-15",
    preferredContactMethod: "Onsite Meeting",
    preferredContactTime: "Friday mornings",
    agreeToTerms: true,
  },
];

async function main() {
  const shouldDelete = process.argv.includes("--delete");

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!, { family: 4 } as any);
  console.log("✅ Connected");

  // Import models AFTER connect so any model-level hooks see the connection
  const { default: Inquiry } = await import("../it-inquiry-form/lib/Inquiry");

  if (shouldDelete) {
    const res = await Inquiry.deleteMany({ projectTitle: { $regex: SEED_MARKER } });
    console.log(`🗑️  Deleted ${res.deletedCount} seeded lead(s).`);
    await mongoose.disconnect();
    return;
  }

  // Prevent duplicate seeding
  const existing = await Inquiry.countDocuments({ projectTitle: { $regex: SEED_MARKER } });
  if (existing > 0) {
    console.log(`⚠️  Found ${existing} existing seeded lead(s).`);
    console.log(`   Run "npx tsx scripts/seed-leads.ts --delete" first if you want to re-seed.`);
    await mongoose.disconnect();
    return;
  }

  const inserted = await Inquiry.insertMany(leads);
  console.log(`✅ Inserted ${inserted.length} lead(s):`);
  inserted.forEach((l: any) => {
    console.log(`   • ${l.fullName} — ${l.serviceCategory}`);
  });

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Done.");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});