import { Schema, models, model } from "mongoose";

const InquirySchema = new Schema(
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

    /* Step 1 */
    fullName: String,
    email: String,
    phone: String,
    clientType: String,
    companyName: String,
    designation: String,

    /* Step 2 */
    requirementType: String,

    /* Step 3 */
    projectTitle: String,
    projectGoals: String,
    targetAudience: String,
    existingWebsite: String,
    additionalNotes: String,

    /* Step 4A - Commodity */
    commodityType: String,
    commodityName: String,
    commodityFeatures: [String],
    commodityDelivery: String,
    commodityRefs: String,

    /* Step 4B - Service */
    serviceType: String,
    projectDescription: String,
    serviceFeatures: [String],
    timeline: String,
    serviceRefs: String,

    /* Step 4C - Logo */
    logoMessage: String,
    likedLogos: String,
    logoType: String,
    colorPreferences: String,
    tagline: String,
    competitorBranding: String,
    audienceDetail: String,

    /* Step 4D - Web */
    businessDescription: String,
    usp: String,
    businessKeywords: String,
    referenceWebsites: String,
    pagesNeeded: String,
    featuresNeeded: String,
    websiteGoal: String,
    launchDate: String,
    additionalSuggestions: String,

    /* Step 4E - Digital Marketing */
    brandName: String,
    natureOfBusiness: String,
    businessActivities: String,
    majorClients: String,
    countryWiseMarket: String,
    targetAudienceFull: String,
    businessKeywords50: String,
    totalProducts: String,
    topRatedProducts: String,
    topProductKeywords: String,
    importantPageOrProduct: String,
    socialMediaCredentials: String,
    sampleBanners: String,
    sampleBlogs: String,
    sampleCopywriting: String,
    gscDetails: String,
    dynamicUrlRecs: String,
    existingSearchSubmissions: String,
    relevantLink: String,
    communityEngagements: String,
    serpPositioning: String,
    competitorNamesUrls: String,

    /* Step 5 */
    preferredContactMethod: String,
    preferredContactTime: String,
    agreeToTerms: Boolean,
    subscribeUpdates: Boolean,
  },
  { timestamps: true, strict: true }
);

export default models.Inquiry || model("Inquiry", InquirySchema);