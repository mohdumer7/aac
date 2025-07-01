import mongoose, { Schema, Document } from "mongoose";

export interface ApprovalInstanceDocument extends Document {
  approvalFlow: mongoose.Types.ObjectId;
  entityId: mongoose.Types.ObjectId;
  entityType: string;
  
  // Current status
  currentStep: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  
  // Track each step's progress
  stepHistory: {
    stepOrder: number;
    stepName: string;
    role: mongoose.Types.ObjectId;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
    
    // Approval info
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    approvalComments?: string;
    
    // Rejection info
    rejectedBy?: mongoose.Types.ObjectId;
    rejectedAt?: Date;
    rejectionReason?: string;
    
    // Skipping info
    skippedBy?: mongoose.Types.ObjectId;
    skippedAt?: Date;
    skipReason?: string;
    
    // Delegation info
    delegatedTo?: mongoose.Types.ObjectId;
    delegatedBy?: mongoose.Types.ObjectId;
    delegatedAt?: Date;
    
    // Notifications
    notifications: {
      sentTo: string; // Email or userId
      sentAt: Date;
      type: 'Initial' | 'Reminder' | 'Escalation';
    }[];
  }[];
  
  // Overall info
  initiatedBy: mongoose.Types.ObjectId;
  initiatedAt: Date;
  completedAt?: Date;
  lastActionAt: Date;
  lastActionBy: mongoose.Types.ObjectId;
  comments?: string;
  
  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalInstanceSchema = new Schema<ApprovalInstanceDocument>(
  {
    approvalFlow: { type: Schema.Types.ObjectId, ref: 'ApprovalFlow', required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityType: { type: String, required: true },
    
    // Current status
    currentStep: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], 
      default: 'Pending' 
    },
    
    // Track each step's progress
    stepHistory: [
      {
        stepOrder: { type: Number, required: true },
        stepName: { type: String, required: true },
        role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
        status: { 
          type: String, 
          enum: ['Pending', 'Approved', 'Rejected', 'Skipped'], 
          default: 'Pending' 
        },
        
        // Approval info
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date },
        approvalComments: { type: String },
        
        // Rejection info
        rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        rejectedAt: { type: Date },
        rejectionReason: { type: String },
        
        // Skipping info
        skippedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        skippedAt: { type: Date },
        skipReason: { type: String },
        
        // Delegation info
        delegatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
        delegatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        delegatedAt: { type: Date },
        
        // Notifications
        notifications: [
          {
            sentTo: { type: String, required: true },
            sentAt: { type: Date, default: Date.now },
            type: { 
              type: String, 
              enum: ['Initial', 'Reminder', 'Escalation'], 
              default: 'Initial' 
            }
          }
        ]
      }
    ],
    
    // Overall info
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    initiatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    lastActionAt: { type: Date, default: Date.now },
    lastActionBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comments: { type: String },
    
    // Audit trail - handled by timestamps
  },
  { timestamps: true }
);

// Indexes for performance
ApprovalInstanceSchema.index({ entityId: 1, entityType: 1 });
ApprovalInstanceSchema.index({ status: 1 });
ApprovalInstanceSchema.index({ initiatedBy: 1 });
ApprovalInstanceSchema.index({ 'stepHistory.role': 1, status: 1 });

export default mongoose.models.ApprovalInstance || 
  mongoose.model<ApprovalInstanceDocument>("ApprovalInstance", ApprovalInstanceSchema); 