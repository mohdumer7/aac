// HRMS Models Export Index
// This file exports all HRMS models for easy importing

export { default as ManpowerRequisition } from './ManpowerRequisition.model';
export { default as CandidateInformation } from './CandidateInformation.model';
export { default as BusinessTripRequest } from './BusinessTripRequest.model';
export { default as NewEmployeeJoining } from './NewEmployeeJoining.model';
export { default as AssetsITAccess } from './AssetsITAccess.model';
export { default as EmployeeInformation } from './EmployeeInformation.model';
export { default as AccommodationTransportConsent } from './AccommodationTransportConsent.model';
export { default as BeneficiaryDeclaration } from './BeneficiaryDeclaration.model';
export { default as NonDisclosureAgreement } from './NonDisclosureAgreement.model';

// Export types for TypeScript
export type { ManpowerRequisitionDocument } from './ManpowerRequisition.model';
export type { CandidateInformationDocument } from './CandidateInformation.model';
export type { BusinessTripRequestDocument } from './BusinessTripRequest.model';
export type { NewEmployeeJoiningDocument } from './NewEmployeeJoining.model';
export type { AssetsITAccessDocument } from './AssetsITAccess.model';
export type { EmployeeInformationDocument } from './EmployeeInformation.model';
export type { AccommodationTransportConsentDocument } from './AccommodationTransportConsent.model';
export type { BeneficiaryDeclarationDocument } from './BeneficiaryDeclaration.model';
export type { NonDisclosureAgreementDocument } from './NonDisclosureAgreement.model';

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