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

// API Response types
export interface HRMSApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

export interface HRMSPaginatedResponse<T = any> {
  success: boolean;
  data: {
    forms?: T[];
    instances?: T[];
    flows?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Dashboard statistics
export interface HRMSDashboardStats {
  formStats: {
    [formType: string]: {
      total: number;
      drafts: number;
      submitted: number;
      approved: number;
      rejected: number;
      pending: number;
    };
  };
  approvalStats: Array<{
    _id: string;
    totalInstances: number;
    averageProcessingTime: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
  }>;
  timestamp: string;
}

// Approval Flow types
export interface HRMSApprovalFlowStep {
  stepOrder: number;
  stepName: string;
  stepDescription?: string;
  approverType: 'specific_user' | 'role_based' | 'department_head' | 'reporting_manager' | 'conditional';
  specificUsers?: string[];
  requiredRoles?: string[];
  departmentBased?: {
    useSameDepartment: boolean;
    specificDepartments?: string[];
    headOnly: boolean;
  };
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
    value: any;
    skipStep?: boolean;
    alternateApprovers?: string[];
  }>;
  isRequired: boolean;
  allowParallelApproval: boolean;
  requireAllApprovers: boolean;
  autoApprove?: boolean;
  timeoutDays?: number;
  escalationTo?: string[];
  notifyOnSubmission: boolean;
  reminderDays?: number;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
}

export interface HRMSApprovalFlow {
  _id: string;
  flowName: string;
  flowDescription?: string;
  formType: string;
  isActive: boolean;
  isDefault: boolean;
  applicableDepartments: string[];
  applicableLocations: string[];
  applicableEmployeeTypes: string[];
  steps: HRMSApprovalFlowStep[];
  settings: {
    allowWithdrawal: boolean;
    allowDelegation: boolean;
    requireComments: boolean;
    autoArchive: boolean;
    maxProcessingDays?: number;
  };
  flowDesign?: {
    nodes: any[];
    edges: any[];
    viewport?: { x: number; y: number; zoom: number };
  };
  stats?: {
    totalSubmissions: number;
    averageProcessingTime: number;
    approvalRate: number;
    lastUsed?: string;
  };
  createdBy: string;
  updatedBy: string;
  organisation: string;
  createdAt: string;
  updatedAt: string;
}

// Approval Instance types
export interface HRMSApprovalAction {
  actionBy: string;
  actionByName: string;
  actionType: 'approve' | 'reject' | 'request_changes' | 'escalate' | 'delegate';
  actionDate: string;
  comments?: string;
  attachments?: string[];
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
}

export interface HRMSApprovalStepProgress {
  stepOrder: number;
  stepName: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'skipped' | 'escalated';
  assignedApprovers: Array<{
    userId: string;
    userName: string;
    userRole?: string;
    isDelegated?: boolean;
    delegatedBy?: string;
    delegatedDate?: string;
  }>;
  approvalActions: HRMSApprovalAction[];
  stepStartDate?: string;
  stepEndDate?: string;
  stepDurationHours?: number;
  escalationDate?: string;
  remindersSent?: number;
}

export interface HRMSApprovalInstance {
  _id: string;
  formType: string;
  formId: string;
  formNumber?: string;
  approvalFlowId: string;
  flowName: string;
  submittedBy: string;
  submittedDate: string;
  submissionNotes?: string;
  currentStatus: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'withdrawn' | 'escalated' | 'expired';
  currentStepOrder: number;
  currentStepName?: string;
  stepProgress: HRMSApprovalStepProgress[];
  totalProcessingTimeHours?: number;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  isOverdue?: boolean;
  escalations: Array<{
    fromStep: number;
    toUsers: string[];
    escalationReason: 'timeout' | 'manual' | 'auto_rule';
    escalationDate: string;
    resolvedDate?: string;
    resolution?: string;
  }>;
  withdrawalDetails?: {
    withdrawnBy: string;
    withdrawnDate: string;
    withdrawalReason: string;
    canResubmit: boolean;
  };
  finalResolution?: {
    resolvedBy: string;
    resolvedDate: string;
    finalStatus: 'approved' | 'rejected';
    finalComments?: string;
    nextActions?: Array<{
      action: string;
      assignedTo?: string;
      dueDate?: string;
    }>;
  };
  metadata: {
    formData?: any;
    departmentContext?: string;
    locationContext?: string;
    urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
    businessImpact?: string;
    estimatedValue?: number;
  };
  isArchived: boolean;
  archivedDate?: string;
  retentionDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Form field types
export interface HRMSFormField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file' | 'email' | 'tel';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
  dependsOn?: string;
  showIf?: (values: any) => boolean;
}

export interface HRMSFormSection {
  id: string;
  title: string;
  description?: string;
  fields: HRMSFormField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface HRMSFormConfig {
  formType: string;
  title: string;
  description?: string;
  sections: HRMSFormSection[];
  submitLabel?: string;
  saveDraftLabel?: string;
  validationSchema?: any;
}

// Filter and search types
export interface HRMSFormFilters {
  status?: string;
  isDraft?: boolean;
  department?: string;
  addedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface HRMSApprovalInstanceFilters {
  formType?: string;
  currentStatus?: string;
  submittedBy?: string;
  viewType?: 'approver' | 'submitter' | 'all';
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// User and configuration types
export interface HRMSUser {
  _id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  email: string;
  empId?: string;
  employmentDetails?: {
    department?: { _id: string; name: string };
    designation?: { _id: string; name: string };
    role?: { _id: string; name: string };
  };
}

export interface HRMSDepartment {
  _id: string;
  name: string;
  depId: string;
  isActive: boolean;
}

export interface HRMSRole {
  _id: string;
  name: string;
  isActive: boolean;
}

// Flow testing types
export interface HRMSFlowTestResult {
  flowId: string;
  flowName: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  steps: Array<{
    stepOrder: number;
    stepName: string;
    approverType: string;
    approvers: Array<{
      userId: string;
      userName: string;
      email: string;
      type: string;
    }>;
    issues: string[];
  }>;
}

// Flow statistics types
export interface HRMSFlowStats {
  flow: {
    _id: string;
    flowName: string;
    formType: string;
    isActive: boolean;
  };
  statistics: {
    totalInstances: number;
    averageProcessingTime: number;
    approvedCount: number;
    rejectedCount: number;
    pendingCount: number;
    withdrawnCount: number;
    approvalRate: number;
  };
}

export interface HRMSStepPerformanceStats {
  _id: {
    stepOrder: number;
    stepName: string;
  };
  totalSteps: number;
  averageDuration: number;
  approvedSteps: number;
  rejectedSteps: number;
  pendingSteps: number;
}