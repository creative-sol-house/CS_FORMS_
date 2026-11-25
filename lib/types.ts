export type ClientType = "Individual" | "Business";

export type ServiceCategory =
  | "Automation Software"
  | "Web Development"
  | "Logo Design"
  | "Digital Marketing";

export type RequirementType = "Commodity" | "Service";

export type LeadStatus = "Interested" | "Pending" | "Call Back" | "Approved" | "Not Interested";
export type CommunicationMode = "Call" | "WhatsApp Msg" | "WhatsApp Call" | "Text Msg" | "Email" | "Zoom Meeting" | "Onsite Meeting";

export interface AuditLog {
  action: string;
  details?: string;
  performedBy: string;
  timestamp: string;
}

export interface SubmissionLocation {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  userAgent?: string;
  referer?: string;
}

export interface InquiryData {
  serviceCategory?: ServiceCategory;
  fullName?: string;
  email: string;
  phone: string;
  clientType: ClientType;
  consultantName: string;
  consultantId?: string;
country?: string;
  // ✅ NEW — client region classification
  isInternationalClient?: boolean;
  clientRegion?: "Local" | "International";

  companyWebsite?: string;
  socialLinks?: SocialLink[];          // ← changed from string to array
  location?: string;
  jobTitle?: string;
  clientRequirements?: string;
createdBy?: string;
createdById?: string;
  companyName?: string;
  designation?: string;
  requirementType?: RequirementType;
  projectTitle?: string;
  projectGoals?: string;
  targetAudience?: string;
  existingWebsite?: string;
  additionalNotes?: string;
  commodityType?: string;
  commodityName?: string;
  commodityFeatures?: string[];
  commodityDelivery?: string;
  commodityRefs?: string;
  serviceType?: string;
  projectDescription?: string;
  serviceFeatures?: string[];
  timeline?: string;
  serviceRefs?: string;
  logoMessage?: string;
  likedLogos?: string;
  logoType?: string;
  colorPreferences?: string;
  tagline?: string;
  competitorBranding?: string;
  audienceDetail?: string;
  businessDescription?: string;
  usp?: string;
  businessKeywords?: string;
  referenceWebsites?: string;
  pagesNeeded?: string;
  featuresNeeded?: string;
  websiteGoal?: string;
  launchDate?: string;
  additionalSuggestions?: string;
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
  preferredContactMethod?: string;
  preferredContactTime?: string;
 
      agreeToTerms: boolean;
  subscribeUpdates?: boolean;
  attachments?: LeadAttachment[];
      leadCreatedAt?: string; // ISO string
  source?: "form" | "manual" | "import";  // ✅ NEW

  followUps?: FollowUp[]; // <--- Add this here


}

export interface SocialLink {
  name: string;   // e.g. "Facebook", "Instagram", "LinkedIn"
  url: string;    // e.g. "https://facebook.com/company"
}

export interface InquiryDoc extends InquiryData {
  _id: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  status: LeadStatus;
  notes: string;
  messages: ChatMessage[];
  communicationMode?: CommunicationMode;
  onsiteAddress?: string;
  auditLogs: AuditLog[];
  submissionLocation?: SubmissionLocation;
    followUps?: FollowUp[]; // <--- Add this

}

export type Role = "admin" | "business_developer";

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  passwordRequest?: boolean;
  requestDate?: string;
  tempPassword?: string;
}

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: Role;
  profilePicture?: string;
  passwordRequest?: boolean;
}

export interface ChatMessage {
  _id?: string;
  text: string;
  sender: string;
  senderRole?: "admin" | "business_developer";
  timestamp: string;
  readBy: string[];
}

export interface LeadAttachment {
  _id?: string;
  url: string;          // Cloudinary secure_url
  publicId: string;     // For deletion
  fileName: string;     // Original name
  fileType: string;     // mime: application/pdf, application/vnd.openxmlformats...
  fileSize: number;     // bytes
  uploadedBy: string;
  uploadedAt: string;
}

export interface FollowUp {
  _id?: string;
  date: string; // ISO String
  note: string;
  type: "Call" | "Meeting" | "Email" | "Other";
  loggedBy: string;
  loggedAt: string;
}
