export type ClientType = "Individual" | "Business";

export type ServiceCategory =
  | "Automation Software"
  | "Web Development"
  | "Logo Design"
  | "Digital Marketing";

export type RequirementType = "Commodity" | "Service";

export interface InquiryData {
  /* Step 0 */
  serviceCategory?: ServiceCategory;

  /* Step 1 - Client */
  fullName: string;
  email: string;
  phone: string;
  clientType: ClientType;
  consultantName: string; // ← NEW: Mandatory field
  companyName?: string;
  designation?: string;

  /* Step 2 - only for Automation Software */
  requirementType?: RequirementType;

  /* Step 3 - Project (shared) */
  projectTitle?: string;
  projectGoals?: string;
  targetAudience?: string;
  existingWebsite?: string;
  additionalNotes?: string;

  /* Step 4A - Commodity (Automation Software only) */
  commodityType?: string;
  commodityName?: string;
  commodityFeatures?: string[];
  commodityDelivery?: string;
  commodityRefs?: string;

  /* Step 4B - Service (Automation Software only) */
  serviceType?: string;
  projectDescription?: string;
  serviceFeatures?: string[];
  timeline?: string;
  serviceRefs?: string;

  /* Step 4C - Logo Design */
  logoMessage?: string;
  likedLogos?: string;
  logoType?: string;
  colorPreferences?: string;
  tagline?: string;
  competitorBranding?: string;
  audienceDetail?: string;

  /* Step 4D - Web Development */
  businessDescription?: string;
  usp?: string;
  businessKeywords?: string;
  referenceWebsites?: string;
  pagesNeeded?: string;
  featuresNeeded?: string;
  websiteGoal?: string;
  launchDate?: string;
  additionalSuggestions?: string;

  /* Step 4E - Digital Marketing */
  brandName?: string;
  natureOfBusiness?: string;
  businessActivities?: string;
  majorClients?: string;
  countryWiseMarket?: string;
  targetAudienceFull?: string;
  businessKeywords50?: string;
  totalProducts?: string;
  topRatedProducts?: string;
  topProductKeywords?: string;
  importantPageOrProduct?: string;
  socialMediaCredentials?: string;
  sampleBanners?: string;
  sampleBlogs?: string;
  sampleCopywriting?: string;
  gscDetails?: string;
  dynamicUrlRecs?: string;
  existingSearchSubmissions?: string;
  relevantLink?: string;
  communityEngagements?: string;
  serpPositioning?: string;
  competitorNamesUrls?: string;

  /* Step 5 - Consent */
  preferredContactMethod?: string;
  preferredContactTime?: string;
  agreeToTerms: boolean;
  subscribeUpdates?: boolean;
}

export interface InquiryDoc extends InquiryData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}