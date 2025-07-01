import mongoose, { Schema, Document } from "mongoose";

export interface ManpowerRequisitionDocument extends Document {
  // Form ABS/HR/N/F01 - Manpower Requisition Form
  formId: string; // "ABS/HR/N/F01"
  version: string; // "25-04-2022 V.1"
  
  // Request Information
  requestedBy: mongoose.Types.ObjectId; // Reference to User
  requestDate: Date;
  department: mongoose.Types.ObjectId; // Reference to Department
  requestedPosition: string;
  
  // Position Information
  vacancyReason: 'new_position' | 'replacement';
  newPositionBudgeted: boolean;
  newPositionNonBudgeted: boolean;
  noOfVacantPositions: number;
  
  // Previous Employee Details (if replacement)
  previousEmployee?: {
    empName?: string;
    empNo?: string;
    designation?: string;
    department?: string;
    doe?: Date; // Date of exit
    salary?: number;
  };
  
  // Candidate Information
  candidateInfo?: {
    selectedCandidateName?: string;
    expectedDateOfJoining?: Date;
    designation?: string;
    proposedSalary?: number;
    benefits?: string;
  };
  
  // Department Head Approval
  departmentHeadApproval: {
    internalCandidate?: boolean;
    externalCandidate?: boolean;
    foreignRecruitment?: boolean;
    remarks?: string;
    approved?: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvalDate?: Date;
  };
  
  // HR/ADMIN Review
  hrAdminReview: {
    position?: string;
    budgeted?: boolean;
    actualHeadCount?: number;
    variance?: number;
    approved?: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvalDate?: Date;
  };
  
  // Final Approvals
  approvals: {
    financeManpowerBudgetConfirmation?: boolean;
    financeApprovedBy?: mongoose.Types.ObjectId;
    financeApprovalDate?: Date;
    
    headOfHrAdminApproved?: boolean;
    headOfHrAdminApprovedBy?: mongoose.Types.ObjectId;
    headOfHrAdminApprovalDate?: Date;
    
    cooCfoApproved?: boolean;
    cooCfoApprovedBy?: mongoose.Types.ObjectId;
    cooCfoApprovalDate?: Date;
    
    ceoApproved?: boolean;
    ceoApprovedBy?: mongoose.Types.ObjectId;
    ceoApprovalDate?: Date;
  };
  
  // Form Status
  status: 'draft' | 'pending_department_head' | 'pending_hr_review' | 'pending_finance' | 
          'pending_hr_head' | 'pending_coo_cfo' | 'pending_ceo' | 'approved' | 'rejected';
  
  // Workflow
  approvalFlowId?: mongoose.Types.ObjectId;
  currentApprovalStep?: number;
  
  // Draft Management
  isDraft: boolean;
  draftSavedAt?: Date;
  
  // Audit fields
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ManpowerRequisitionSchema = new Schema<ManpowerRequisitionDocument>(
  {
    formId: { type: String, default: "ABS/HR/N/F01" },
    version: { type: String, default: "25-04-2022 V.1" },
    
    // Request Information
    requestedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      autopopulate: {
        select: "firstName lastName displayName email empId"
      }
    },
    requestDate: { type: Date, default: Date.now },
    department: { 
      type: Schema.Types.ObjectId, 
      ref: 'Department', 
      required: true,
      autopopulate: true
    },
    requestedPosition: { type: String, required: true },
    
    // Position Information
    vacancyReason: { 
      type: String, 
      enum: ['new_position', 'replacement'], 
      required: true 
    },
    newPositionBudgeted: { type: Boolean, default: false },
    newPositionNonBudgeted: { type: Boolean, default: false },
    noOfVacantPositions: { type: Number, default: 1, min: 1 },
    
    // Previous Employee Details
    previousEmployee: {
      empName: { type: String },
      empNo: { type: String },
      designation: { type: String },
      department: { type: String },
      doe: { type: Date },
      salary: { type: Number }
    },
    
    // Candidate Information
    candidateInfo: {
      selectedCandidateName: { type: String },
      expectedDateOfJoining: { type: Date },
      designation: { type: String },
      proposedSalary: { type: Number },
      benefits: { type: String }
    },
    
    // Department Head Approval
    departmentHeadApproval: {
      internalCandidate: { type: Boolean },
      externalCandidate: { type: Boolean },
      foreignRecruitment: { type: Boolean },
      remarks: { type: String },
      approved: { type: Boolean, default: false },
      approvedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      approvalDate: { type: Date }
    },
    
    // HR/ADMIN Review
    hrAdminReview: {
      position: { type: String },
      budgeted: { type: Boolean },
      actualHeadCount: { type: Number },
      variance: { type: Number },
      approved: { type: Boolean, default: false },
      approvedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      approvalDate: { type: Date }
    },
    
    // Final Approvals
    approvals: {
      financeManpowerBudgetConfirmation: { type: Boolean },
      financeApprovedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      financeApprovalDate: { type: Date },
      
      headOfHrAdminApproved: { type: Boolean },
      headOfHrAdminApprovedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      headOfHrAdminApprovalDate: { type: Date },
      
      cooCfoApproved: { type: Boolean },
      cooCfoApprovedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      cooCfoApprovalDate: { type: Date },
      
      ceoApproved: { type: Boolean },
      ceoApprovedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      ceoApprovalDate: { type: Date }
    },
    
    // Form Status
    status: { 
      type: String, 
      enum: [
        'draft', 
        'pending_department_head', 
        'pending_hr_review', 
        'pending_finance', 
        'pending_hr_head', 
        'pending_coo_cfo', 
        'pending_ceo', 
        'approved', 
        'rejected'
      ],
      default: 'draft'
    },
    
    // Workflow
    approvalFlowId: { type: Schema.Types.ObjectId, ref: 'ApprovalFlow' },
    currentApprovalStep: { type: Number, default: 0 },
    
    // Draft Management
    isDraft: { type: Boolean, default: true },
    draftSavedAt: { type: Date },
    
    // Audit fields
    addedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add autopopulate plugin
ManpowerRequisitionSchema.plugin(require('mongoose-autopopulate'));

// Generate unique requisition number
ManpowerRequisitionSchema.pre('save', async function(next) {
  if (this.isNew && !this.formId) {
    const count = await mongoose.model('ManpowerRequisition').countDocuments();
    this.formId = `MPR-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for efficient queries
ManpowerRequisitionSchema.index({ requestedBy: 1, status: 1 });
ManpowerRequisitionSchema.index({ department: 1, status: 1 });
ManpowerRequisitionSchema.index({ createdAt: -1 });

export default (mongoose.models?.ManpowerRequisition as mongoose.Model<ManpowerRequisitionDocument>) || 
  mongoose.model<ManpowerRequisitionDocument>("ManpowerRequisition", ManpowerRequisitionSchema);