import mongoose, { Schema, Document } from "mongoose";

// Enhanced Approval Flow specifically for HRMS processes
export interface HRMSApprovalFlowDocument extends Document {
  // Basic Information
  flowName: string;
  flowDescription?: string;
  formType: 'manpower_requisition' | 'candidate_information' | 'business_trip_request' | 
           'new_employee_joining' | 'assets_it_access' | 'employee_information' |
           'accommodation_transport_consent' | 'beneficiary_declaration' | 'non_disclosure_agreement';
  
  // Flow Configuration
  isActive: boolean;
  isDefault: boolean; // Default flow for this form type
  
  // Departmental Scope
  applicableDepartments: Array<mongoose.Types.ObjectId>; // If empty, applies to all departments
  applicableLocations: Array<mongoose.Types.ObjectId>; // If empty, applies to all locations
  applicableEmployeeTypes: Array<mongoose.Types.ObjectId>; // If empty, applies to all employee types
  
  // Flow Steps with Enhanced Configuration
  steps: Array<{
    stepOrder: number;
    stepName: string;
    stepDescription?: string;
    
    // Approver Configuration
    approverType: 'specific_user' | 'role_based' | 'department_head' | 'reporting_manager' | 'conditional';
    
    // Specific User Assignment
    specificUsers?: Array<mongoose.Types.ObjectId>; // Multiple users can approve (any one)
    
    // Role-based Assignment
    requiredRoles?: Array<mongoose.Types.ObjectId>; // Users with these roles can approve
    
    // Department-based Assignment
    departmentBased?: {
      useSameDepartment: boolean; // Use department from form
      specificDepartments?: Array<mongoose.Types.ObjectId>; // Or specific departments
      headOnly: boolean; // Only department head, not all users
    };
    
    // Conditional Logic
    conditions?: Array<{
      field: string; // Field from the form to check
      operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
      value: any; // Value to compare against
      skipStep?: boolean; // Skip this step if condition is met
      alternateApprovers?: Array<mongoose.Types.ObjectId>; // Use different approvers if condition is met
    }>;
    
    // Step Configuration
    isRequired: boolean;
    allowParallelApproval: boolean; // Multiple approvers can approve simultaneously
    requireAllApprovers: boolean; // All specified approvers must approve (if parallel)
    autoApprove?: boolean; // Auto-approve under certain conditions
    timeoutDays?: number; // Auto-escalate after X days
    escalationTo?: Array<mongoose.Types.ObjectId>; // Escalation approvers
    
    // Notification Settings
    notifyOnSubmission: boolean;
    reminderDays?: number; // Send reminder after X days
    notifyOnApproval: boolean;
    notifyOnRejection: boolean;
    
    // Custom Actions
    customActions?: Array<{
      actionType: 'email' | 'webhook' | 'create_record' | 'update_field';
      actionConfig: any; // Action-specific configuration
      triggerOn: 'submission' | 'approval' | 'rejection';
    }>;
  }>;
  
  // Flow-level Settings
  settings: {
    allowWithdrawal: boolean; // Allow form creator to withdraw submission
    allowDelegation: boolean; // Allow approvers to delegate to others
    requireComments: boolean; // Require comments on rejection
    autoArchive: boolean; // Archive completed flows
    maxProcessingDays?: number; // Maximum time for entire flow
  };
  
  // Visual Flow Designer Data (React Flow)
  flowDesign?: {
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      data: {
        label: string;
        stepOrder: number;
        approverType: string;
        approvers: Array<any>;
        isRequired: boolean;
      };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      type?: string;
      label?: string;
    }>;
    viewport?: { x: number; y: number; zoom: number };
  };
  
  // Usage Statistics
  stats?: {
    totalSubmissions: number;
    averageProcessingTime: number; // in hours
    approvalRate: number; // percentage
    lastUsed?: Date;
  };
  
  // Audit fields
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  organisation: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HRMSApprovalFlowSchema = new Schema<HRMSApprovalFlowDocument>(
  {
    flowName: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    flowDescription: { 
      type: String,
      maxlength: 500
    },
    formType: { 
      type: String, 
      required: true,
      enum: [
        'manpower_requisition',
        'candidate_information',
        'business_trip_request',
        'new_employee_joining',
        'assets_it_access',
        'employee_information',
        'accommodation_transport_consent',
        'beneficiary_declaration',
        'non_disclosure_agreement'
      ]
    },
    
    // Flow Configuration
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    
    // Departmental Scope
    applicableDepartments: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Department',
      autopopulate: true
    }],
    applicableLocations: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Location',
      autopopulate: true
    }],
    applicableEmployeeTypes: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'EmployeeType',
      autopopulate: true
    }],
    
    // Flow Steps
    steps: [{
      stepOrder: { type: Number, required: true },
      stepName: { type: String, required: true },
      stepDescription: { type: String },
      
      // Approver Configuration
      approverType: { 
        type: String, 
        required: true,
        enum: ['specific_user', 'role_based', 'department_head', 'reporting_manager', 'conditional']
      },
      
      specificUsers: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName email designation"
        }
      }],
      
      requiredRoles: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Role',
        autopopulate: true
      }],
      
      departmentBased: {
        useSameDepartment: { type: Boolean, default: true },
        specificDepartments: [{ 
          type: Schema.Types.ObjectId, 
          ref: 'Department',
          autopopulate: true
        }],
        headOnly: { type: Boolean, default: true }
      },
      
      conditions: [{
        field: { type: String, required: true },
        operator: { 
          type: String, 
          required: true,
          enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists']
        },
        value: { type: Schema.Types.Mixed },
        skipStep: { type: Boolean, default: false },
        alternateApprovers: [{ 
          type: Schema.Types.ObjectId, 
          ref: 'User',
          autopopulate: {
            select: "firstName lastName displayName"
          }
        }]
      }],
      
      // Step Configuration
      isRequired: { type: Boolean, default: true },
      allowParallelApproval: { type: Boolean, default: false },
      requireAllApprovers: { type: Boolean, default: true },
      autoApprove: { type: Boolean, default: false },
      timeoutDays: { type: Number, min: 1, max: 30 },
      escalationTo: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      }],
      
      // Notification Settings
      notifyOnSubmission: { type: Boolean, default: true },
      reminderDays: { type: Number, min: 1, max: 10 },
      notifyOnApproval: { type: Boolean, default: true },
      notifyOnRejection: { type: Boolean, default: true },
      
      // Custom Actions
      customActions: [{
        actionType: { 
          type: String, 
          enum: ['email', 'webhook', 'create_record', 'update_field']
        },
        actionConfig: { type: Schema.Types.Mixed },
        triggerOn: { 
          type: String, 
          enum: ['submission', 'approval', 'rejection']
        }
      }]
    }],
    
    // Flow-level Settings
    settings: {
      allowWithdrawal: { type: Boolean, default: true },
      allowDelegation: { type: Boolean, default: true },
      requireComments: { type: Boolean, default: true },
      autoArchive: { type: Boolean, default: true },
      maxProcessingDays: { type: Number, min: 1, max: 90 }
    },
    
    // Visual Flow Designer Data
    flowDesign: {
      nodes: [{ type: Schema.Types.Mixed }],
      edges: [{ type: Schema.Types.Mixed }],
      viewport: { type: Schema.Types.Mixed }
    },
    
    // Usage Statistics
    stats: {
      totalSubmissions: { type: Number, default: 0 },
      averageProcessingTime: { type: Number, default: 0 },
      approvalRate: { type: Number, default: 0 },
      lastUsed: { type: Date }
    },
    
    // Audit fields
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true
    },
    organisation: { 
      type: Schema.Types.ObjectId, 
      ref: 'Organisation',
      autopopulate: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add autopopulate plugin
HRMSApprovalFlowSchema.plugin(require('mongoose-autopopulate'));

// Ensure only one default flow per form type per organization
HRMSApprovalFlowSchema.index({ 
  formType: 1, 
  organisation: 1, 
  isDefault: 1 
}, { 
  unique: true, 
  partialFilterExpression: { isDefault: true } 
});

// Sort steps by order
HRMSApprovalFlowSchema.pre('save', function(next) {
  if (this.steps && this.steps.length > 0) {
    this.steps.sort((a, b) => a.stepOrder - b.stepOrder);
  }
  next();
});

// Validate step order sequence
HRMSApprovalFlowSchema.pre('save', function(next) {
  if (this.steps && this.steps.length > 0) {
    const orders = this.steps.map(step => step.stepOrder);
    const uniqueOrders = [...new Set(orders)];
    
    if (orders.length !== uniqueOrders.length) {
      next(new Error('Step orders must be unique'));
    } else if (uniqueOrders.some((order, index) => order !== index + 1)) {
      next(new Error('Step orders must be sequential starting from 1'));
    }
  }
  next();
});

// Update statistics when flow is used
HRMSApprovalFlowSchema.methods.updateUsageStats = function(processingTimeHours: number, wasApproved: boolean) {
  if (!this.stats) {
    this.stats = {
      totalSubmissions: 0,
      averageProcessingTime: 0,
      approvalRate: 0
    };
  }
  
  const currentSubmissions = this.stats.totalSubmissions || 0;
  const currentAvgTime = this.stats.averageProcessingTime || 0;
  const currentApprovalRate = this.stats.approvalRate || 0;
  
  // Update average processing time
  this.stats.averageProcessingTime = 
    (currentAvgTime * currentSubmissions + processingTimeHours) / (currentSubmissions + 1);
  
  // Update approval rate
  const currentApprovals = Math.round((currentApprovalRate / 100) * currentSubmissions);
  const newApprovals = currentApprovals + (wasApproved ? 1 : 0);
  this.stats.approvalRate = (newApprovals / (currentSubmissions + 1)) * 100;
  
  // Update total submissions
  this.stats.totalSubmissions = currentSubmissions + 1;
  this.stats.lastUsed = new Date();
  
  return this.save();
};

// Index for efficient queries
HRMSApprovalFlowSchema.index({ formType: 1, isActive: 1 });
HRMSApprovalFlowSchema.index({ organisation: 1, isActive: 1 });
HRMSApprovalFlowSchema.index({ applicableDepartments: 1 });
HRMSApprovalFlowSchema.index({ applicableLocations: 1 });
HRMSApprovalFlowSchema.index({ createdAt: -1 });

export default (mongoose.models?.HRMSApprovalFlow as mongoose.Model<HRMSApprovalFlowDocument>) || 
  mongoose.model<HRMSApprovalFlowDocument>("HRMSApprovalFlow", HRMSApprovalFlowSchema);