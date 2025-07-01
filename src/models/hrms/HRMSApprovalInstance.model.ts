import mongoose, { Schema, Document } from "mongoose";

// Individual approval instance for tracking form submissions through approval flows
export interface HRMSApprovalInstanceDocument extends Document {
  // Reference to the form being approved
  formType: 'manpower_requisition' | 'candidate_information' | 'business_trip_request' | 
           'new_employee_joining' | 'assets_it_access' | 'employee_information' |
           'accommodation_transport_consent' | 'beneficiary_declaration' | 'non_disclosure_agreement';
  formId: mongoose.Types.ObjectId; // ID of the actual form document
  formNumber?: string; // Display number (e.g., MPR-000001)
  
  // Flow Information
  approvalFlowId: mongoose.Types.ObjectId; // Reference to HRMSApprovalFlow
  flowName: string; // Snapshot of flow name for historical tracking
  
  // Submission Details
  submittedBy: mongoose.Types.ObjectId; // User who submitted the form
  submittedDate: Date;
  submissionNotes?: string;
  
  // Current Status
  currentStatus: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'withdrawn' | 'escalated' | 'expired';
  currentStepOrder: number;
  currentStepName?: string;
  
  // Step Progress Tracking
  stepProgress: Array<{
    stepOrder: number;
    stepName: string;
    status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'skipped' | 'escalated';
    
    // Approver Information
    assignedApprovers: Array<{
      userId: mongoose.Types.ObjectId;
      userName: string; // Snapshot for historical tracking
      userRole?: string;
      isDelegated?: boolean;
      delegatedBy?: mongoose.Types.ObjectId;
      delegatedDate?: Date;
    }>;
    
    // Approval Actions
    approvalActions: Array<{
      actionBy: mongoose.Types.ObjectId;
      actionByName: string; // Snapshot
      actionType: 'approve' | 'reject' | 'request_changes' | 'escalate' | 'delegate';
      actionDate: Date;
      comments?: string;
      attachments?: Array<string>; // File paths or URLs
      
      // IP and Device tracking for audit
      ipAddress?: string;
      deviceInfo?: string;
      location?: string; // Geographic location if available
    }>;
    
    // Timing Information
    stepStartDate?: Date;
    stepEndDate?: Date;
    stepDurationHours?: number;
    escalationDate?: Date;
    remindersSent?: number;
    
    // Conditional Logic Results
    conditionsMet?: Array<{
      condition: string;
      result: boolean;
      evaluatedAt: Date;
    }>;
  }>;
  
  // Overall Timing
  totalProcessingTimeHours?: number;
  expectedCompletionDate?: Date;
  actualCompletionDate?: Date;
  isOverdue?: boolean;
  
  // Escalation Tracking
  escalations: Array<{
    fromStep: number;
    toUsers: Array<mongoose.Types.ObjectId>;
    escalationReason: 'timeout' | 'manual' | 'auto_rule';
    escalationDate: Date;
    resolvedDate?: Date;
    resolution?: string;
  }>;
  
  // Withdrawal and Cancellation
  withdrawalDetails?: {
    withdrawnBy: mongoose.Types.ObjectId;
    withdrawnDate: Date;
    withdrawalReason: string;
    canResubmit: boolean;
  };
  
  // Final Resolution
  finalResolution?: {
    resolvedBy: mongoose.Types.ObjectId;
    resolvedDate: Date;
    finalStatus: 'approved' | 'rejected';
    finalComments?: string;
    nextActions?: Array<{
      action: string;
      assignedTo?: mongoose.Types.ObjectId;
      dueDate?: Date;
    }>;
  };
  
  // Integration and Automation
  automationTriggers: Array<{
    triggerType: 'form_update' | 'notification' | 'webhook' | 'record_creation';
    triggerData: any;
    triggeredAt: Date;
    status: 'pending' | 'completed' | 'failed';
    result?: any;
  }>;
  
  // Communication Log
  communications: Array<{
    type: 'email' | 'sms' | 'notification' | 'reminder';
    sentTo: Array<mongoose.Types.ObjectId>;
    sentAt: Date;
    subject?: string;
    content?: string;
    status: 'sent' | 'delivered' | 'failed' | 'bounced';
  }>;
  
  // Metadata and Context
  metadata: {
    formData?: any; // Snapshot of form data at submission time
    departmentContext?: mongoose.Types.ObjectId;
    locationContext?: mongoose.Types.ObjectId;
    urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
    businessImpact?: string;
    estimatedValue?: number; // For financial impact tracking
  };
  
  // Audit and Compliance
  auditTrail: Array<{
    timestamp: Date;
    action: string;
    performedBy: mongoose.Types.ObjectId;
    details: any;
    ipAddress?: string;
  }>;
  
  // Archive Information
  isArchived: boolean;
  archivedDate?: Date;
  retentionDate?: Date; // When this record can be purged
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

const HRMSApprovalInstanceSchema = new Schema<HRMSApprovalInstanceDocument>(
  {
    // Reference to the form being approved
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
    formId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      refPath: 'formType' // Dynamic reference based on formType
    },
    formNumber: { type: String },
    
    // Flow Information
    approvalFlowId: { 
      type: Schema.Types.ObjectId, 
      ref: 'HRMSApprovalFlow', 
      required: true,
      autopopulate: {
        select: "flowName formType steps"
      }
    },
    flowName: { type: String, required: true },
    
    // Submission Details
    submittedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      autopopulate: {
        select: "firstName lastName displayName email"
      }
    },
    submittedDate: { type: Date, default: Date.now },
    submissionNotes: { type: String },
    
    // Current Status
    currentStatus: { 
      type: String, 
      enum: ['pending', 'in_progress', 'approved', 'rejected', 'withdrawn', 'escalated', 'expired'],
      default: 'pending'
    },
    currentStepOrder: { type: Number, default: 1 },
    currentStepName: { type: String },
    
    // Step Progress Tracking
    stepProgress: [{
      stepOrder: { type: Number, required: true },
      stepName: { type: String, required: true },
      status: { 
        type: String, 
        enum: ['pending', 'in_progress', 'approved', 'rejected', 'skipped', 'escalated'],
        default: 'pending'
      },
      
      // Approver Information
      assignedApprovers: [{
        userId: { 
          type: Schema.Types.ObjectId, 
          ref: 'User', 
          required: true,
          autopopulate: {
            select: "firstName lastName displayName email designation"
          }
        },
        userName: { type: String, required: true },
        userRole: { type: String },
        isDelegated: { type: Boolean, default: false },
        delegatedBy: { 
          type: Schema.Types.ObjectId, 
          ref: 'User',
          autopopulate: {
            select: "firstName lastName displayName"
          }
        },
        delegatedDate: { type: Date }
      }],
      
      // Approval Actions
      approvalActions: [{
        actionBy: { 
          type: Schema.Types.ObjectId, 
          ref: 'User', 
          required: true,
          autopopulate: {
            select: "firstName lastName displayName"
          }
        },
        actionByName: { type: String, required: true },
        actionType: { 
          type: String, 
          enum: ['approve', 'reject', 'request_changes', 'escalate', 'delegate'],
          required: true
        },
        actionDate: { type: Date, default: Date.now },
        comments: { type: String },
        attachments: [{ type: String }],
        
        // Audit trail
        ipAddress: { type: String },
        deviceInfo: { type: String },
        location: { type: String }
      }],
      
      // Timing Information
      stepStartDate: { type: Date },
      stepEndDate: { type: Date },
      stepDurationHours: { type: Number },
      escalationDate: { type: Date },
      remindersSent: { type: Number, default: 0 },
      
      // Conditional Logic Results
      conditionsMet: [{
        condition: { type: String, required: true },
        result: { type: Boolean, required: true },
        evaluatedAt: { type: Date, default: Date.now }
      }]
    }],
    
    // Overall Timing
    totalProcessingTimeHours: { type: Number },
    expectedCompletionDate: { type: Date },
    actualCompletionDate: { type: Date },
    isOverdue: { type: Boolean, default: false },
    
    // Escalation Tracking
    escalations: [{
      fromStep: { type: Number, required: true },
      toUsers: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      }],
      escalationReason: { 
        type: String, 
        enum: ['timeout', 'manual', 'auto_rule'],
        required: true
      },
      escalationDate: { type: Date, default: Date.now },
      resolvedDate: { type: Date },
      resolution: { type: String }
    }],
    
    // Withdrawal and Cancellation
    withdrawalDetails: {
      withdrawnBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      withdrawnDate: { type: Date },
      withdrawalReason: { type: String },
      canResubmit: { type: Boolean, default: true }
    },
    
    // Final Resolution
    finalResolution: {
      resolvedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      resolvedDate: { type: Date },
      finalStatus: { 
        type: String, 
        enum: ['approved', 'rejected']
      },
      finalComments: { type: String },
      nextActions: [{
        action: { type: String, required: true },
        assignedTo: { 
          type: Schema.Types.ObjectId, 
          ref: 'User',
          autopopulate: {
            select: "firstName lastName displayName"
          }
        },
        dueDate: { type: Date }
      }]
    },
    
    // Integration and Automation
    automationTriggers: [{
      triggerType: { 
        type: String, 
        enum: ['form_update', 'notification', 'webhook', 'record_creation'],
        required: true
      },
      triggerData: { type: Schema.Types.Mixed },
      triggeredAt: { type: Date, default: Date.now },
      status: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      result: { type: Schema.Types.Mixed }
    }],
    
    // Communication Log
    communications: [{
      type: { 
        type: String, 
        enum: ['email', 'sms', 'notification', 'reminder'],
        required: true
      },
      sentTo: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName email"
        }
      }],
      sentAt: { type: Date, default: Date.now },
      subject: { type: String },
      content: { type: String },
      status: { 
        type: String, 
        enum: ['sent', 'delivered', 'failed', 'bounced'],
        default: 'sent'
      }
    }],
    
    // Metadata and Context
    metadata: {
      formData: { type: Schema.Types.Mixed },
      departmentContext: { 
        type: Schema.Types.ObjectId, 
        ref: 'Department',
        autopopulate: true
      },
      locationContext: { 
        type: Schema.Types.ObjectId, 
        ref: 'Location',
        autopopulate: true
      },
      urgencyLevel: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      businessImpact: { type: String },
      estimatedValue: { type: Number }
    },
    
    // Audit and Compliance
    auditTrail: [{
      timestamp: { type: Date, default: Date.now },
      action: { type: String, required: true },
      performedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      details: { type: Schema.Types.Mixed },
      ipAddress: { type: String }
    }],
    
    // Archive Information
    isArchived: { type: Boolean, default: false },
    archivedDate: { type: Date },
    retentionDate: { type: Date }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add autopopulate plugin
HRMSApprovalInstanceSchema.plugin(require('mongoose-autopopulate'));

// Calculate processing time when status changes
HRMSApprovalInstanceSchema.pre('save', function(next) {
  if (this.currentStatus === 'approved' || this.currentStatus === 'rejected') {
    if (this.submittedDate && !this.totalProcessingTimeHours) {
      const endDate = this.actualCompletionDate || new Date();
      this.totalProcessingTimeHours = 
        (endDate.getTime() - this.submittedDate.getTime()) / (1000 * 60 * 60);
    }
  }
  next();
});

// Check if overdue
HRMSApprovalInstanceSchema.pre('save', function(next) {
  if (this.expectedCompletionDate && !this.actualCompletionDate) {
    this.isOverdue = new Date() > this.expectedCompletionDate;
  }
  next();
});

// Add audit trail entry on save
HRMSApprovalInstanceSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    const modifiedPaths = this.modifiedPaths();
    this.auditTrail.push({
      timestamp: new Date(),
      action: `Updated: ${modifiedPaths.join(', ')}`,
      performedBy: this.updatedBy || this.submittedBy,
      details: { modifiedFields: modifiedPaths }
    });
  }
  next();
});

// Methods for common operations
HRMSApprovalInstanceSchema.methods.getCurrentStep = function() {
  return this.stepProgress.find(step => step.stepOrder === this.currentStepOrder);
};

HRMSApprovalInstanceSchema.methods.moveToNextStep = function() {
  this.currentStepOrder += 1;
  const nextStep = this.stepProgress.find(step => step.stepOrder === this.currentStepOrder);
  if (nextStep) {
    this.currentStepName = nextStep.stepName;
    nextStep.status = 'in_progress';
    nextStep.stepStartDate = new Date();
  } else {
    // No more steps, mark as completed
    this.currentStatus = 'approved';
    this.actualCompletionDate = new Date();
  }
  return this.save();
};

HRMSApprovalInstanceSchema.methods.addApprovalAction = function(stepOrder: number, action: any) {
  const step = this.stepProgress.find(s => s.stepOrder === stepOrder);
  if (step) {
    step.approvalActions.push(action);
    if (action.actionType === 'approve') {
      step.status = 'approved';
      step.stepEndDate = new Date();
      step.stepDurationHours = step.stepStartDate ? 
        (step.stepEndDate.getTime() - step.stepStartDate.getTime()) / (1000 * 60 * 60) : 0;
    } else if (action.actionType === 'reject') {
      step.status = 'rejected';
      this.currentStatus = 'rejected';
      this.actualCompletionDate = new Date();
    }
  }
  return this.save();
};

// Index for efficient queries
HRMSApprovalInstanceSchema.index({ formType: 1, currentStatus: 1 });
HRMSApprovalInstanceSchema.index({ submittedBy: 1, currentStatus: 1 });
HRMSApprovalInstanceSchema.index({ currentStatus: 1, currentStepOrder: 1 });
HRMSApprovalInstanceSchema.index({ 'stepProgress.assignedApprovers.userId': 1, currentStatus: 1 });
HRMSApprovalInstanceSchema.index({ submittedDate: -1 });
HRMSApprovalInstanceSchema.index({ expectedCompletionDate: 1, isOverdue: 1 });
HRMSApprovalInstanceSchema.index({ 'metadata.departmentContext': 1 });
HRMSApprovalInstanceSchema.index({ formId: 1 });

export default (mongoose.models?.HRMSApprovalInstance as mongoose.Model<HRMSApprovalInstanceDocument>) || 
  mongoose.model<HRMSApprovalInstanceDocument>("HRMSApprovalInstance", HRMSApprovalInstanceSchema);