import { Schema, models, model } from "mongoose";

const InquirySchema = new Schema(
  {
    fullName: String,
    email: String,
    phone: String,
    clientType: String,
    companyName: String,
    designation: String,
    requirementType: String,

    // Commodity
    commodityType: String,
    commodityName: String,
    commodityFeatures: [String],
    commodityBudget: String,
    commodityDelivery: String,
    commodityRefs: String,

    // Service
    serviceType: String,
    projectDescription: String,
    serviceFeatures: [String],
    serviceBudget: String,
    timeline: String,
    serviceRefs: String,

    // Project
    projectTitle: String,
    projectGoals: String,
    targetAudience: String,
    existingWebsite: String,
    additionalNotes: String,

    // Consent
    preferredContactMethod: String,
    preferredContactTime: String,
    agreeToTerms: Boolean,
    subscribeUpdates: Boolean,
  },
  { timestamps: true, strict: true }
);

export default models.Inquiry || model("Inquiry", InquirySchema);