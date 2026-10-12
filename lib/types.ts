export type ClientType = "Individual" | "Business";
export type RequirementType = "Product" | "Service";

export interface InquiryData {
  fullName: string;
  email: string;
  phone: string;
  clientType: ClientType;
  companyName?: string;
  designation?: string;
  requirementType?: RequirementType;

  productType?: string;
  productName?: string;
  productFeatures?: string[];
  productBudget?: string;
  productDelivery?: string;
  productRefs?: string;

  serviceType?: string;
  projectDescription?: string;
  techPreference?: string[];
  pagesOrScreens?: number;
  serviceFeatures?: string[];
  serviceBudget?: string;
  timeline?: string;
  serviceRefs?: string;

  projectTitle?: string;
  projectGoals?: string;
  targetAudience?: string;
  existingWebsite?: string;
  additionalNotes?: string;

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