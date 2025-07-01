import mongoose, { Schema, Document } from "mongoose";

export interface ManpowerRequisitionDocument extends Document {
  requestedBy: mongoose.Types.ObjectId;
  requestDate: Date;
  department: mongoose.Types.ObjectId;
  requestedPosition: string;
  
  // Position Information
  vacancyReason: 'New Position' | 'Replacement';
  isNewPositionBudgeted: boolean;
  nonBudgeted: boolean;
  vacantPositionsCount: number;
  
  // Previous Employee Details (if replacement)
  previousEmployeeName?: string;
  previousEmployeeId?: string;
  previousEmployeeDesignation?: string;
  previousEmployeeDepartment?: string;
  previousEmployeeDOE?: Date; // Date of Exit
  previousEmployeeSalary?: number;
  
  // Candidate Information
  selectedCandidateName?: string;
  expectedJoiningDate?: Date;
  proposedSalary?: number;
  benefits?: string;
  designation?: string;
  
  // Candidate Type
  candidateType: 'Internal' | 'External' | 'Foreign Recruitment';
  
  // Approvals
  remarks?: string;
  departmentHeadApproval: {
    approved: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvalDate?: Date;
  };
  
  hrAdminReview: {
    position: string;
    budgeted: boolean;
    actualHeadCount: number;
    variance: number;
    approved: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvalDate?: Date;
  };
  
  financeApproval: {
    approved: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvalDate?: Date;
  };
  
  hrHeadApproval: {
    approved: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvalDate?: Date;
  };
  
  cfoApproval: {
    approved: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvalDate?: Date;
  };
  
  ceoApproval: {
    approved: boolean;
    approvedBy?: mongoose.Types.ObjectId;
    approvalDate?: Date;
  };
  
  status: 'Draft' | 'Pending Department Head' | 'Pending HR Review' | 'Pending Finance' | 
          'Pending HR Head' | 'Pending CFO' | 'Pending CEO' | 'Approved' | 'Rejected';
  
  // Reference to job posting if created
  jobPosting?: mongoose.Types.ObjectId;
  
  // Tracking
  createdAt: Date;
  updatedAt: Date;
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const ManpowerRequisitionSchema = new Schema<ManpowerRequisitionDocument>(
  {
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestDate: { type: Date, default: Date.now },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    requestedPosition: { type: String, required: true },
    
    // Position Information
    vacancyReason: { 
      type: String, 
      enum: ['New Position', 'Replacement'], 
      required: true 
    },
    isNewPositionBudgeted: { type: Boolean, default: false },
    nonBudgeted: { type: Boolean, default: false },
    vacantPositionsCount: { type: Number, default: 1 },
    
    // Previous Employee Details
    previousEmployeeName: { type: String },
    previousEmployeeId: { type: String },
    previousEmployeeDesignation: { type: String },
    previousEmployeeDepartment: { type: String },
    previousEmployeeDOE: { type: Date },
    previousEmployeeSalary: { type: Number },
    
    // Candidate Information
    selectedCandidateName: { type: String },
    expectedJoiningDate: { type: Date },
    proposedSalary: { type: Number },
    benefits: { type: String },
    designation: { type: String },
    
    // Candidate Type
    candidateType: { 
      type: String, 
      enum: ['Internal', 'External', 'Foreign Recruitment'], 
      default: 'External' 
    },
    
    // Approvals
    remarks: { type: String },
    departmentHeadApproval: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvalDate: { type: Date }
    },
    
    hrAdminReview: {
      position: { type: String },
      budgeted: { type: Boolean, default: false },
      actualHeadCount: { type: Number },
      variance: { type: Number },
      approved: { type: Boolean, default: false },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvalDate: { type: Date }
    },
    
    financeApproval: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvalDate: { type: Date }
    },
    
    hrHeadApproval: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvalDate: { type: Date }
    },
    
    cfoApproval: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvalDate: { type: Date }
    },
    
    ceoApproval: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      approvalDate: { type: Date }
    },
    
    status: { 
      type: String, 
      enum: [
        'Draft', 
        'Pending Department Head', 
        'Pending HR Review', 
        'Pending Finance', 
        'Pending HR Head', 
        'Pending CFO', 
        'Pending CEO', 
        'Approved', 
        'Rejected'
      ],
      default: 'Draft'
    },
    
    // Reference to job posting if created
    jobPosting: { type: Schema.Types.ObjectId, ref: 'JobPosting' },
    
    // Tracking
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.models.ManpowerRequisition || 
  mongoose.model<ManpowerRequisitionDocument>("ManpowerRequisition", ManpowerRequisitionSchema); 