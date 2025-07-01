import mongoose, { Schema, Document } from "mongoose";

export interface NewEmployeeJoiningDocument extends Document {
  // Form ABS/HR/N/F04 - New Employee Joining Form
  formId: string; // "ABS/HR/N/F04"
  version: string; // "25-04-2022 V.1"
  
  // Basic Information
  empName: string;
  designation: mongoose.Types.ObjectId; // Reference to Designation
  departmentSection: mongoose.Types.ObjectId; // Reference to Department
  location: mongoose.Types.ObjectId; // Reference to Location
  reportingTo: mongoose.Types.ObjectId; // Reference to User
  dateOfReporting: Date;
  remarks?: string;
  
  // Approvals
  empSign?: string;
  empSignDate?: Date;
  sectionHeadSign?: mongoose.Types.ObjectId;
  sectionHeadSignDate?: Date;
  departmentHeadSign?: mongoose.Types.ObjectId;
  departmentHeadSignDate?: Date;
  headOfHrAdminSign?: mongoose.Types.ObjectId;
  headOfHrAdminSignDate?: Date;
  cooCfoSign?: mongoose.Types.ObjectId;
  cooCfoSignDate?: Date;
  
  // For HR / ADMIN
  dateOfJoining?: Date;
  empId?: string; // Generated or provided
  hrAdminSectionSign?: mongoose.Types.ObjectId;
  hrAdminSectionSignDate?: Date;
  payrollSectionSign?: mongoose.Types.ObjectId;
  payrollSectionSignDate?: Date;
  
  // Status and Workflow
  status: 'draft' | 'pending_section_head' | 'pending_department_head' | 'pending_hr_admin' | 'pending_coo_cfo' | 'approved' | 'joined' | 'rejected';
  approvalFlowId?: mongoose.Types.ObjectId;
  currentApprovalStep?: number;
  
  // Linked Records
  linkedCandidateInformation?: mongoose.Types.ObjectId;
  linkedManpowerRequisition?: mongoose.Types.ObjectId;
  createdUserRecord?: mongoose.Types.ObjectId; // User record created after joining
  
  // Draft Management
  isDraft: boolean;
  draftSavedAt?: Date;
  
  // Onboarding Checklist
  onboardingCompleted?: boolean;
  assetsProvided?: boolean;
  itAccessProvided?: boolean;
  accommodationArranged?: boolean;
  
  // Audit fields
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NewEmployeeJoiningSchema = new Schema<NewEmployeeJoiningDocument>(
  {
    formId: { type: String, default: "ABS/HR/N/F04" },
    version: { type: String, default: "25-04-2022 V.1" },
    
    // Basic Information
    empName: { type: String, required: true },
    designation: { 
      type: Schema.Types.ObjectId, 
      ref: 'Designation', 
      required: true,
      autopopulate: true
    },
    departmentSection: { 
      type: Schema.Types.ObjectId, 
      ref: 'Department', 
      required: true,
      autopopulate: true
    },
    location: { 
      type: Schema.Types.ObjectId, 
      ref: 'Location', 
      required: true,
      autopopulate: true
    },
    reportingTo: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      autopopulate: {
        select: "firstName lastName displayName email empId"
      }
    },
    dateOfReporting: { type: Date, required: true },
    remarks: { type: String },
    
    // Approvals
    empSign: { type: String },
    empSignDate: { type: Date },
    sectionHeadSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    sectionHeadSignDate: { type: Date },
    departmentHeadSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    departmentHeadSignDate: { type: Date },
    headOfHrAdminSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    headOfHrAdminSignDate: { type: Date },
    cooCfoSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    cooCfoSignDate: { type: Date },
    
    // For HR / ADMIN
    dateOfJoining: { type: Date },
    empId: { type: String }, // Will be generated if not provided
    hrAdminSectionSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    hrAdminSectionSignDate: { type: Date },
    payrollSectionSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    payrollSectionSignDate: { type: Date },
    
    // Status and Workflow
    status: { 
      type: String, 
      enum: [
        'draft', 
        'pending_section_head', 
        'pending_department_head', 
        'pending_hr_admin', 
        'pending_coo_cfo', 
        'approved', 
        'joined', 
        'rejected'
      ],
      default: 'draft'
    },
    approvalFlowId: { type: Schema.Types.ObjectId, ref: 'ApprovalFlow' },
    currentApprovalStep: { type: Number, default: 0 },
    
    // Linked Records
    linkedCandidateInformation: { 
      type: Schema.Types.ObjectId, 
      ref: 'CandidateInformation',
      autopopulate: {
        select: "name email passportNo"
      }
    },
    linkedManpowerRequisition: { 
      type: Schema.Types.ObjectId, 
      ref: 'ManpowerRequisition',
      autopopulate: {
        select: "requestedPosition department"
      }
    },
    createdUserRecord: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName empId email"
      }
    },
    
    // Draft Management
    isDraft: { type: Boolean, default: true },
    draftSavedAt: { type: Date },
    
    // Onboarding Checklist
    onboardingCompleted: { type: Boolean, default: false },
    assetsProvided: { type: Boolean, default: false },
    itAccessProvided: { type: Boolean, default: false },
    accommodationArranged: { type: Boolean, default: false },
    
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
NewEmployeeJoiningSchema.plugin(require('mongoose-autopopulate'));

// Generate unique joining form ID and employee ID
NewEmployeeJoiningSchema.pre('save', async function(next) {
  if (this.isNew && !this.formId.includes('-')) {
    const count = await mongoose.model('NewEmployeeJoining').countDocuments();
    this.formId = `NEJ-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Generate employee ID if not provided
  if (!this.empId && this.status === 'approved') {
    const empCount = await mongoose.model('User').countDocuments();
    this.empId = `EMP-${String(empCount + 1).padStart(6, '0')}`;
  }
  
  next();
});

// Validation: dateOfReporting should be in future or today
NewEmployeeJoiningSchema.pre('save', function(next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (this.dateOfReporting && this.dateOfReporting < today) {
    next(new Error('Date of reporting cannot be in the past'));
  } else {
    next();
  }
});

// Index for efficient queries
NewEmployeeJoiningSchema.index({ empId: 1 });
NewEmployeeJoiningSchema.index({ empName: 1 });
NewEmployeeJoiningSchema.index({ status: 1 });
NewEmployeeJoiningSchema.index({ departmentSection: 1, status: 1 });
NewEmployeeJoiningSchema.index({ linkedCandidateInformation: 1 });
NewEmployeeJoiningSchema.index({ linkedManpowerRequisition: 1 });
NewEmployeeJoiningSchema.index({ dateOfJoining: -1 });
NewEmployeeJoiningSchema.index({ createdAt: -1 });

export default (mongoose.models?.NewEmployeeJoining as mongoose.Model<NewEmployeeJoiningDocument>) || 
  mongoose.model<NewEmployeeJoiningDocument>("NewEmployeeJoining", NewEmployeeJoiningSchema);