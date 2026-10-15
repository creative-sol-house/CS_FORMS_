import mongoose, { Schema, Document, Model } from "mongoose";
import { InquiryData } from "./types";

export interface IInquiry extends InquiryData, Document {}

const InquirySchema = new Schema<IInquiry>(
  {
    /* Step 0 */
    serviceCategory: {
      type: String,
      enum: [
        "Automation Software",
        "Web Development",
        "Logo Design",
        "Digital Marketing",
      ],
    },

    /* Step 1 - Client */
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    clientType: {
      type: String,
      required: true,
      enum: ["Individual", "Business"],
    },
    consultantName: { type: String, required: true, trim: true }, // ← NEW: Mandatory
    companyName: { type: String, trim: true },
    designation: { type: String, trim: true },

    /* Step 2 - only for Automation Software */
    requirementType: {
      type: String,
      enum: ["Commodity", "Service"],
    },

    /* Step 3 - Project (shared) */
    projectTitle: { type: String, trim: true },
    projectGoals: { type: String, trim: true },
    targetAudience: { type: String, trim: true },
    existingWebsite: { type: String, trim: true },
    additionalNotes: { type: String, trim: true },

    /* Step 4A - Commodity (Automation Software only) */
    commodityType: { type: String, trim: true },
    commodityName: { type: String, trim: true },
    commodityFeatures: [{ type: String, trim: true }],
    commodityDelivery: { type: String, trim: true },
    commodityRefs: { type: String, trim: true },

    /* Step 4B - Service (Automation Software only) */
    serviceType: { type: String, trim: true },
    projectDescription: { type: String, trim: true },
    serviceFeatures: [{ type: String, trim: true }],
    timeline: { type: String, trim: true },
    serviceRefs: { type: String, trim: true },

    /* Step 4C - Logo Design */
    logoMessage: { type: String, trim: true },
    likedLogos: { type: String, trim: true },
    logoType: { type: String, trim: true },
    colorPreferences: { type: String, trim: true },
    tagline: { type: String, trim: true },
    competitorBranding: { type: String, trim: true },
    audienceDetail: { type: String, trim: true },

    /* Step 4D - Web Development */
    businessDescription: { type: String, trim: true },
    usp: { type: String, trim: true },
    businessKeywords: { type: String, trim: true },
    referenceWebsites: { type: String, trim: true },
    pagesNeeded: { type: String, trim: true },
    featuresNeeded: { type: String, trim: true },
    websiteGoal: { type: String, trim: true },
    launchDate: { type: String, trim: true },
    additionalSuggestions: { type: String, trim: true },

    /* Step 4E - Digital Marketing */
    brandName: { type: String, trim: true },
    natureOfBusiness: { type: String, trim: true },
    businessActivities: { type: String, trim: true },
    majorClients: { type: String, trim: true },
    countryWiseMarket: { type: String, trim: true },
    targetAudienceFull: { type: String, trim: true },
    businessKeywords50: { type: String, trim: true },
    totalProducts: { type: String, trim: true },
    topRatedProducts: { type: String, trim: true },
    topProductKeywords: { type: String, trim: true },
    importantPageOrProduct: { type: String, trim: true },
    socialMediaCredentials: { type: String, trim: true },
    sampleBanners: { type: String, trim: true },
    sampleBlogs: { type: String, trim: true },
    sampleCopywriting: { type: String, trim: true },
    gscDetails: { type: String, trim: true },
    dynamicUrlRecs: { type: String, trim: true },
    existingSearchSubmissions: { type: String, trim: true },
    relevantLink: { type: String, trim: true },
    communityEngagements: { type: String, trim: true },
    serpPositioning: { type: String, trim: true },
    competitorNamesUrls: { type: String, trim: true },

    /* Step 5 - Consent */
    preferredContactMethod: { type: String, trim: true },
    preferredContactTime: { type: String, trim: true },
    agreeToTerms: { type: Boolean, required: true, default: false },
    subscribeUpdates: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Inquiry: Model<IInquiry> =
  mongoose.models.Inquiry || mongoose.model<IInquiry>("Inquiry", InquirySchema);

export default Inquiry;