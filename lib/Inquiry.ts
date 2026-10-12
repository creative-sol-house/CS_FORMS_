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
    productType: String,
    productName: String,
    productFeatures: [String],
    productBudget: String,
    productDelivery: String,
    productRefs: String,
    serviceType: String,
    projectDescription: String,
    techPreference: [String],
    pagesOrScreens: Number,
    serviceFeatures: [String],
    serviceBudget: String,
    timeline: String,
    serviceRefs: String,
    projectTitle: String,
    projectGoals: String,
    targetAudience: String,
    existingWebsite: String,
    additionalNotes: String,
    preferredContactMethod: String,
    preferredContactTime: String,
    agreeToTerms: Boolean,
    subscribeUpdates: Boolean,
  },
  { timestamps: true }
);

export default models.Inquiry || model("Inquiry", InquirySchema);