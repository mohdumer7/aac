import { UserDocument } from "@/types";
import { UserPersonalDetailsDocument } from "@/models/master/UserPersonalDetails.model";
import { UserEmploymentDetailsDocument } from "@/models/master/UserEmploymentDetails.model";
import { UserVisaDetailsDocument } from "@/models/master/UserVisaDetails.model";
import { UserIdentificationDocument } from "@/models/master/UserIdentification.model";
import { UserBenefitsDocument } from "@/models/master/UserBenefits.model";

// Base interfaces
interface BaseApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

// HR Wizard Document Upload Response
export interface HrWizardDocumentUploadResponse extends BaseApiResponse {
  fileUrl?: string;
  fileName?: string;
}

// HR Wizard API Response
export interface HrWizardApiResponse extends BaseApiResponse {
  data?: {
    userId: string;
    nextStep?: string;
    completedSteps?: string[];
  };
}

// HR Wizard Step Data
export interface HrWizardStepData {
  stepId: string;
  data: Record<string, any>;
  isDraft?: boolean;
}

// Re-export types for backward compatibility
export type HRWizardFormData = HrWizardUserData;
export type HRWizardStep = HrWizardStepData;
export type HRWizardApiResponse = HrWizardApiResponse;
export type HRWizardDocumentUploadResponse = HrWizardDocumentUploadResponse;

// HR Wizard User Data
export interface HrWizardUserData {
  // Core user information (from User model)
  empId?: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  
  // Personal details
  personalDetails: Partial<UserPersonalDetailsDocument>;
  
  // Employment details
  employmentDetails: Partial<UserEmploymentDetailsDocument>;
  
  // Visa and work authorization
  visaDetails: Partial<UserVisaDetailsDocument>;
  
  // Identification documents
  identification: Partial<UserIdentificationDocument>;
  
  // Benefits information
  benefits: Partial<UserBenefitsDocument>;
  
  // Documents (file uploads)
  documents: {
    resume?: File | string;
    offerLetter?: File | string;
    idDocument?: File | string;
    visaDocument?: File | string;
    [key: string]: File | string | undefined;
  };
  
  // Additional metadata
  isDraft?: boolean;
  completedSteps?: string[];
}


