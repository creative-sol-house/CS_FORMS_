import mongoose, { Schema, Document, Model } from "mongoose";
import { InquiryData, SubmissionLocation, AuditLog } from "./types";

export interface IInquiry extends InquiryData, Document {
  assignedTo?: string;
  status: string;
  notes: string;
  messages: Array<{ text: string; sender: string; timestamp: Date; readBy: string[] }>;
  communicationMode?: string;
  onsiteAddress?: string;
  auditLogs: AuditLog[];
  submissionLocation?: SubmissionLocation;
}

const SubmissionLocationSchema = new Schema<SubmissionLocation>(
  { ip: String, city: String, region: String, country: String, latitude: String, longitude: String, userAgent: String, referer: String },
  { _id: false }
);

const MessageSchema = new Schema(
  {
    text:       { type: String, required: true, trim: true, maxlength: 4000 },
    sender:     { type: String, required: true, trim: true },
    senderRole: { type: String, enum: ["admin", "business_developer"] },
    timestamp:  { type: Date, default: Date.now },
    readBy:     [{ type: String, trim: true }],
  },
  { _id: true }
);
const InquirySchema = new Schema<IInquiry>(
  {
    serviceCategory: { type: String, enum: ["Automation Software", "Web Development", "Logo Design", "Digital Marketing"] },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    clientType: { type: String, required: true, enum: ["Individual", "Business"] },
    consultantName: { type: String, required: true, trim: true },
    consultantId: { type: String, trim: true },
createdBy: { type: String, trim: true },
createdById: { type: String, trim: true },
    companyName: { type: String, trim: true },
    designation: { type: String, trim: true },
    requirementType: { type: String, enum: ["Commodity", "Service"] },
    projectTitle: { type: String, trim: true },
    projectGoals: { type: String, trim: true },
    targetAudience: { type: String, trim: true },
    existingWebsite: { type: String, trim: true },
    additionalNotes: { type: String, trim: true },
    commodityType: { type: String, trim: true },
    commodityName: { type: String, trim: true },
    commodityFeatures: [{ type: String, trim: true }],
    commodityDelivery: { type: String, trim: true },
    commodityRefs: { type: String, trim: true },
    serviceType: { type: String, trim: true },
    projectDescription: { type: String, trim: true },
    serviceFeatures: [{ type: String, trim: true }],
    timeline: { type: String, trim: true },
    serviceRefs: { type: String, trim: true },
    logoMessage: { type: String, trim: true },
    likedLogos: { type: String, trim: true },
    logoType: { type: String, trim: true },
    colorPreferences: { type: String, trim: true },
    tagline: { type: String, trim: true },
    competitorBranding: { type: String, trim: true },
    audienceDetail: { type: String, trim: true },
    businessDescription: { type: String, trim: true },
    usp: { type: String, trim: true },
    businessKeywords: { type: String, trim: true },
    referenceWebsites: { type: String, trim: true },
    pagesNeeded: { type: String, trim: true },
    featuresNeeded: { type: String, trim: true },
    websiteGoal: { type: String, trim: true },
    launchDate: { type: String, trim: true },
    additionalSuggestions: { type: String, trim: true },
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
    preferredContactMethod: { type: String, trim: true },
    preferredContactTime: { type: String, trim: true },
    agreeToTerms: { type: Boolean, required: true, default: false },
    subscribeUpdates: { type: Boolean, default: false },

    assignedTo: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["Interested", "Pending", "Call Back", "Approved", "Not Interested"], default: "Pending" },
    notes: { type: String, default: "" },
    
  messages: { type: [MessageSchema], default: [] },

    communicationMode: { type: String, enum: ["Call", "WhatsApp Msg", "WhatsApp Call", "Text Msg", "Email", "Zoom Meeting", "Onsite Meeting"] },
    onsiteAddress: { type: String, default: "" },
    auditLogs: [{ action: { type: String, required: true }, details: { type: String }, performedBy: { type: String, required: true }, timestamp: { type: Date, default: Date.now } }],
    submissionLocation: { type: SubmissionLocationSchema, default: {} },
  },
  { timestamps: true }
);

const Inquiry: Model<IInquiry> = mongoose.models.Inquiry || mongoose.model<IInquiry>("Inquiry", InquirySchema);
export default Inquiry;