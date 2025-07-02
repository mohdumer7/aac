import mongoose, { Schema, Document } from 'mongoose';

export interface HRMSWorkflowInstanceDocument extends Document {
  workflowId: string;
  workflowName: string;
  workflowType: 'recruitment' | 'onboarding' | 'business_travel' | 'custom';
  candidateId?: string;
  employeeId?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  currentStep: string;
  completedSteps: string[];
  stepsData: Record<string, any>;
  metadata: {
    candidateName?: string;
    employeeName?: string;
    position?: string;
    department?: string;
    startDate?: Date;
    expectedEndDate?: Date;
  };
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  createdBy: string;
  assignedTo: string[];
  stepLogs?: Array<{
    stepId: string;
    stepName: string;
    action: 'started' | 'completed' | 'skipped' | 'reassigned';
    userId: string;
    timestamp: Date;
    comments?: string;
  }>;
}

const HRMSWorkflowInstanceSchema = new Schema<HRMSWorkflowInstanceDocument>({
  workflowId: {
    type: String,
    required: true,
    unique: true
  },
  workflowName: {
    type: String,
    required: true
  },
  workflowType: {
    type: String,
    required: true,
    enum: ['recruitment', 'onboarding', 'business_travel', 'custom']
  },
  candidateId: {
    type: String,
    sparse: true
  },
  employeeId: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  currentStep: {
    type: String,
    required: true
  },
  completedSteps: [{
    type: String
  }],
  stepsData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    candidateName: String,
    employeeName: String,
    position: String,
    department: String,
    startDate: Date,
    expectedEndDate: Date
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  completedAt: Date,
  createdBy: {
    type: String,
    required: true
  },
  assignedTo: [{
    type: String
  }],
  stepLogs: [{
    stepId: String,
    stepName: String,
    action: {
      type: String,
      enum: ['started', 'completed', 'skipped', 'reassigned']
    },
    userId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    comments: String
  }]
}, {
  timestamps: false // We're handling this manually
});

// Indexes for performance
HRMSWorkflowInstanceSchema.index({ workflowType: 1, status: 1 });
HRMSWorkflowInstanceSchema.index({ createdBy: 1 });
HRMSWorkflowInstanceSchema.index({ assignedTo: 1 });
HRMSWorkflowInstanceSchema.index({ candidateId: 1 });
HRMSWorkflowInstanceSchema.index({ employeeId: 1 });
HRMSWorkflowInstanceSchema.index({ startedAt: -1 });

// Update the updatedAt field before saving
HRMSWorkflowInstanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default (mongoose.models?.HRMSWorkflowInstance as mongoose.Model<HRMSWorkflowInstanceDocument>) || 
  mongoose.model<HRMSWorkflowInstanceDocument>("HRMSWorkflowInstance", HRMSWorkflowInstanceSchema);