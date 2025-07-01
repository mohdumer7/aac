// HRMS Types and Constants - Client Safe
// This file contains only types, enums, and constants that are safe to import on the client side

// HRMS Form Types Enum
export enum HRMSFormTypes {
  MANPOWER_REQUISITION = 'manpower_requisition',
  CANDIDATE_INFORMATION = 'candidate_information',
  BUSINESS_TRIP_REQUEST = 'business_trip_request',
  NEW_EMPLOYEE_JOINING = 'new_employee_joining',
  ASSETS_IT_ACCESS = 'assets_it_access',
  EMPLOYEE_INFORMATION = 'employee_information',
  ACCOMMODATION_TRANSPORT_CONSENT = 'accommodation_transport_consent',
  BENEFICIARY_DECLARATION = 'beneficiary_declaration',
  NON_DISCLOSURE_AGREEMENT = 'non_disclosure_agreement'
}

// HRMS Form Status Types
export enum HRMSFormStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  EXPIRED = 'expired'
}

// Form Categories
export enum HRMSFormCategories {
  RECRUITMENT = 'recruitment',
  ONBOARDING = 'onboarding',
  EMPLOYEE_DATA = 'employee_data',
  EMPLOYEE_SERVICES = 'employee_services',
  EMPLOYEE_BENEFITS = 'employee_benefits',
  TRAVEL = 'travel',
  LEGAL_COMPLIANCE = 'legal_compliance'
}

// Form Configurations
export const HRMS_FORM_CONFIG = {
  [HRMSFormTypes.MANPOWER_REQUISITION]: {
    title: 'Manpower Requisition Form',
    formId: 'ABS/HR/N/F01',
    description: 'Request for new employee recruitment',
    category: 'recruitment',
    requiredFields: ['requestedBy', 'department', 'requestedPosition', 'vacancyReason']
  },
  [HRMSFormTypes.CANDIDATE_INFORMATION]: {
    title: 'Candidate Information Form',
    formId: 'ABS/HR/C/F02',
    description: 'Comprehensive candidate information and background',
    category: 'recruitment',
    requiredFields: ['name', 'positionApplied', 'nationality', 'email', 'passportNo']
  },
  [HRMSFormTypes.BUSINESS_TRIP_REQUEST]: {
    title: 'Business Trip Request Form',
    formId: 'ABS/HR/N/F12',
    description: 'Request for business travel and related approvals',
    category: 'travel',
    requiredFields: ['empOrGuestName', 'department', 'placeOfVisit', 'purposeOfVisit']
  },
  [HRMSFormTypes.NEW_EMPLOYEE_JOINING]: {
    title: 'New Employee Joining Form',
    formId: 'ABS/HR/N/F04',
    description: 'Employee onboarding and joining formalities',
    category: 'onboarding',
    requiredFields: ['empName', 'designation', 'departmentSection', 'reportingTo']
  },
  [HRMSFormTypes.ASSETS_IT_ACCESS]: {
    title: 'Assets & IT-Access Form',
    formId: 'ABS/HR/N/F08',
    description: 'IT access and asset allocation for employees',
    category: 'onboarding',
    requiredFields: ['empName', 'designation', 'departmentSection', 'reportingTo']
  },
  [HRMSFormTypes.EMPLOYEE_INFORMATION]: {
    title: 'Employee Information Form',
    formId: 'ABS/HR/N/F05',
    description: 'Comprehensive employee personal and professional information',
    category: 'employee_data',
    requiredFields: ['empName', 'empId', 'designation', 'department', 'nationality']
  },
  [HRMSFormTypes.ACCOMMODATION_TRANSPORT_CONSENT]: {
    title: 'Accommodation/Transportation Consent Form',
    formId: 'ABS/HR/N/F09',
    description: 'Employee accommodation and transportation arrangements',
    category: 'employee_services',
    requiredFields: ['empName', 'empId', 'department', 'designation', 'category']
  },
  [HRMSFormTypes.BENEFICIARY_DECLARATION]: {
    title: 'Beneficiary Declaration Form',
    formId: 'ABS/HR/C/F02-BEN',
    description: 'Employee beneficiary information for insurance and benefits',
    category: 'employee_benefits',
    requiredFields: ['empName', 'empId', 'nomineeName', 'nomineeRelationship']
  },
  [HRMSFormTypes.NON_DISCLOSURE_AGREEMENT]: {
    title: 'Non-Disclosure Agreement',
    formId: 'ABS/HR/C/F06',
    description: 'Confidentiality agreement between company and employee',
    category: 'legal_compliance',
    requiredFields: ['employeeName', 'employeeId', 'companyRepName', 'agreementText']
  }
};

// Workflow Stages
export const HRMS_WORKFLOW_STAGES = {
  RECRUITMENT: [
    'manpower_requisition',
    'candidate_information',
    'interview_scheduling',
    'offer_letter',
    'acceptance'
  ],
  ONBOARDING: [
    'new_employee_joining',
    'employee_information',
    'assets_it_access',
    'accommodation_transport_consent',
    'beneficiary_declaration',
    'non_disclosure_agreement',
    'training_schedule'
  ]
};

// Common field types for forms
export interface HRMSFormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
}

export interface HRMSFormSection {
  id: string;
  title: string;
  description?: string;
  fields: HRMSFormField[];
  conditional?: {
    dependsOn: string;
    value: any;
  };
}

export interface HRMSFormConfig {
  formType: HRMSFormTypes;
  title: string;
  description: string;
  sections: HRMSFormSection[];
  workflow?: {
    requiresApproval: boolean;
    approvalFlow?: string;
    stages: string[];
  };
}

// Base document interface (without mongoose specifics)
export interface HRMSFormDocument {
  _id?: string;
  formType: HRMSFormTypes;
  formData: Record<string, any>;
  status: HRMSFormStatus;
  submittedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  submittedAt?: Date;
  updatedAt?: Date;
  draftData?: Record<string, any>;
  approvalHistory?: Array<{
    stepName: string;
    approverName: string;
    status: 'pending' | 'approved' | 'rejected';
    actionDate?: Date;
    comments?: string;
  }>;
}

// Approval flow types
export interface HRMSApprovalFlowDocument {
  _id?: string;
  flowName: string;
  flowDescription?: string;
  formType: HRMSFormTypes;
  isActive: boolean;
  flowDesign?: {
    nodes: any[];
    edges: any[];
    viewport?: { x: number; y: number; zoom: number };
  };
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HRMSApprovalInstanceDocument {
  _id?: string;
  formId: string;
  formType: HRMSFormTypes;
  flowId: string;
  currentStepIndex: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'withdrawn';
  submittedBy?: string;
  submittedAt?: Date;
  completedAt?: Date;
  steps: Array<{
    stepName: string;
    stepOrder: number;
    approverType: string;
    assignedApprovers: string[];
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    actionBy?: string;
    actionDate?: Date;
    comments?: string;
  }>;
}