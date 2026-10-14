export type ClientType = "Individual" | "Business";
export type RequirementType = "Commodity" | "Service";

export interface InquiryData {
  fullName: string;
  email: string;
  phone: string;
  clientType: ClientType;
  companyName?: string;
  designation?: string;
  requirementType?: RequirementType;

  /* Commodity */
  commodityType?: string;
  commodityName?: string;
  commodityFeatures?: string[];
  commodityBudget?: string;
  commodityDelivery?: string;
  commodityRefs?: string;

  /* Service */
  serviceType?: string;
  projectDescription?: string;
  serviceFeatures?: string[];
  serviceBudget?: string;
  timeline?: string;
  serviceRefs?: string;

  /* Project */
  projectTitle?: string;
  projectGoals?: string;
  targetAudience?: string;
  existingWebsite?: string;
  additionalNotes?: string;

  /* Consent */
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