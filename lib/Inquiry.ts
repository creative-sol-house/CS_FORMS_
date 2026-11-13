import mongoose, { Schema, Document, Model } from "mongoose";
import { InquiryData } from "./types";

export interface IInquiry extends InquiryData, Document {
  primaryAssignee?: string;
  secondaryAssignees?: string[];
  status: string;
  notes: string;
  communicationMode?: string;
  onsiteAddress?: string;
  auditLogs: any[];
}

const InquirySchema = new Schema<IInquiry>(
  {
    /* Step 0 */
    serviceCategory: {
      type: String,
      enum: ["Automation Software", "Web Development", "Logo Design", "Digital Marketing"],
    },
    /* Step 1 - Client */
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    clientType: { type: String, required: true, enum: ["Individual", "Business"] },
    consultantName: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    designation: { type: String, trim: true },
    /* Step 2 */
    requirementType: { type: String, enum: ["Commodity", "Service"] },
    /* Step 3 */
    projectTitle: { type: String, trim: true },
    projectGoals: { type: String, trim: true },
    targetAudience: { type: String, trim: true },
    existingWebsite: { type: String, trim: true },
    additionalNotes: { type: String, trim: true },
    /* Step 4A */
    commodityType: { type: String, trim: true },
    commodityName: { type: String, trim: true },
    commodityFeatures: [{ type: String, trim: true }],
    commodityDelivery: { type: String, trim: true },
    commodityRefs: { type: String, trim: true },
    /* Step 4B */
    serviceType: { type: String, trim: true },
    projectDescription: { type: String, trim: true },
    serviceFeatures: [{ type: String, trim: true }],
    timeline: { type: String, trim: true },
    serviceRefs: { type: String, trim: true },
    /* Step 4C */
    logoMessage: { type: String, trim: true },
    likedLogos: { type: String, trim: true },
    logoType: { type: String, trim: true },
    colorPreferences: { type: String, trim: true },
    tagline: { type: String, trim: true },
    competitorBranding: { type: String, trim: true },
    audienceDetail: { type: String, trim: true },
    /* Step 4D */
    businessDescription: { type: String, trim: true },
    usp: { type: String, trim: true },
    businessKeywords: { type: String, trim: true },
    referenceWebsites: { type: String, trim: true },
    pagesNeeded: { type: String, trim: true },
    featuresNeeded: { type: String, trim: true },
    websiteGoal: { type: String, trim: true },
    launchDate: { type: String, trim: true },
    additionalSuggestions: { type: String, trim: true },
    /* Step 4E */
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
    /* Step 5 */
    preferredContactMethod: { type: String, trim: true },
    preferredContactTime: { type: String, trim: true },
    agreeToTerms: { type: Boolean, required: true, default: false },
    subscribeUpdates: { type: Boolean, default: false },

    /* ===== NEW CRM FIELDS ===== */
    primaryAssignee: { type: String, trim: true, default: "" },
    secondaryAssignees: [{ type: String, trim: true }],
    status: { 
      type: String, 
      enum: ["Interested", "Pending", "Call Back", "Approved", "Not Interested"], 
      default: "Pending" 
    },
    notes: { type: String, default: "" },
    communicationMode: { 
      type: String, 
      enum: ["Call", "WhatsApp Msg", "WhatsApp Call", "Text Msg", "Email", "Zoom Meeting", "Onsite Meeting"] 
    },
    onsiteAddress: { type: String, default: "" },
    auditLogs: [{
      action: { type: String, required: true },
      details: { type: String },
      performedBy: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

const Inquiry: Model<IInquiry> =
  mongoose.models.Inquiry || mongoose.model<IInquiry>("Inquiry", InquirySchema);

export default Inquiry;