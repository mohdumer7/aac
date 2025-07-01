import mongoose, { Schema, Document } from "mongoose";

export interface BusinessTripRequestDocument extends Document {
  // Form ABS/HR/N/F12 - Business Trip Request Form
  formId: string; // "ABS/HR/N/F12"
  version: string; // "25-04-2022 V.1"
  
  // Employee Details
  empOrGuestName: string;
  empId?: string;
  designation: mongoose.Types.ObjectId; // Reference to Designation
  department: mongoose.Types.ObjectId; // Reference to Department
  
  // Trip Details
  placeOfVisit: string; // Country & city
  purposeOfVisit: string;
  periodFrom: Date;
  periodTo: Date;
  
  // Logistics
  cashAdvanceRequired: boolean;
  airTicketArrangedBy: 'company' | 'guest' | 'not_required';
  hotelArrangedBy: 'company' | 'guest' | 'not_required';
  remarks?: string;
  
  // Cash Advance / Reimbursement
  cashAdvanceAmount?: number;
  airTicketReimbursed?: boolean;
  
  // Approvals & Signatures
  empSign?: string;
  empSignDate?: Date;
  departmentHeadSign?: mongoose.Types.ObjectId;
  departmentHeadSignDate?: Date;
  headOfHrAdminSign?: mongoose.Types.ObjectId;
  headOfHrAdminSignDate?: Date;
  cooCfoSign?: mongoose.Types.ObjectId;
  cooCfoSignDate?: Date;
  ceoSign?: mongoose.Types.ObjectId;
  ceoSignDate?: Date;
  
  // Status and Workflow
  status: 'draft' | 'pending_department_head' | 'pending_hr_admin' | 'pending_coo_cfo' | 'pending_ceo' | 'approved' | 'rejected';
  approvalFlowId?: mongoose.Types.ObjectId;
  currentApprovalStep?: number;
  
  // Draft Management
  isDraft: boolean;
  draftSavedAt?: Date;
  
  // Trip Completion
  isCompleted?: boolean;
  completionDate?: Date;
  expensesClaimed?: boolean;
  
  // Audit fields
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessTripRequestSchema = new Schema<BusinessTripRequestDocument>(
  {
    formId: { type: String, default: "ABS/HR/N/F12" },
    version: { type: String, default: "25-04-2022 V.1" },
    
    // Employee Details
    empOrGuestName: { type: String, required: true },
    empId: { type: String },
    designation: { 
      type: Schema.Types.ObjectId, 
      ref: 'Designation', 
      required: true,
      autopopulate: true
    },
    department: { 
      type: Schema.Types.ObjectId, 
      ref: 'Department', 
      required: true,
      autopopulate: true
    },
    
    // Trip Details
    placeOfVisit: { type: String, required: true },
    purposeOfVisit: { type: String, required: true },
    periodFrom: { type: Date, required: true },
    periodTo: { type: Date, required: true },
    
    // Logistics
    cashAdvanceRequired: { type: Boolean, default: false },
    airTicketArrangedBy: { 
      type: String, 
      enum: ['company', 'guest', 'not_required'], 
      required: true 
    },
    hotelArrangedBy: { 
      type: String, 
      enum: ['company', 'guest', 'not_required'], 
      required: true 
    },
    remarks: { type: String },
    
    // Cash Advance / Reimbursement
    cashAdvanceAmount: { type: Number, min: 0 },
    airTicketReimbursed: { type: Boolean },
    
    // Approvals & Signatures
    empSign: { type: String },
    empSignDate: { type: Date },
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
    ceoSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    ceoSignDate: { type: Date },
    
    // Status and Workflow
    status: { 
      type: String, 
      enum: [
        'draft', 
        'pending_department_head', 
        'pending_hr_admin', 
        'pending_coo_cfo', 
        'pending_ceo', 
        'approved', 
        'rejected'
      ],
      default: 'draft'
    },
    approvalFlowId: { type: Schema.Types.ObjectId, ref: 'ApprovalFlow' },
    currentApprovalStep: { type: Number, default: 0 },
    
    // Draft Management
    isDraft: { type: Boolean, default: true },
    draftSavedAt: { type: Date },
    
    // Trip Completion
    isCompleted: { type: Boolean, default: false },
    completionDate: { type: Date },
    expensesClaimed: { type: Boolean, default: false },
    
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
BusinessTripRequestSchema.plugin(require('mongoose-autopopulate'));

// Generate unique trip request ID
BusinessTripRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.formId.includes('-')) {
    const count = await mongoose.model('BusinessTripRequest').countDocuments();
    this.formId = `BTR-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Validation: periodTo should be after periodFrom
BusinessTripRequestSchema.pre('save', function(next) {
  if (this.periodTo && this.periodFrom && this.periodTo <= this.periodFrom) {
    next(new Error('Trip end date must be after start date'));
  } else {
    next();
  }
});

// Validation: If cash advance required, amount should be specified
BusinessTripRequestSchema.pre('save', function(next) {
  if (this.cashAdvanceRequired && !this.cashAdvanceAmount) {
    next(new Error('Cash advance amount is required when cash advance is requested'));
  } else {
    next();
  }
});

// Index for efficient queries
BusinessTripRequestSchema.index({ empId: 1, status: 1 });
BusinessTripRequestSchema.index({ department: 1, status: 1 });
BusinessTripRequestSchema.index({ periodFrom: 1, periodTo: 1 });
BusinessTripRequestSchema.index({ status: 1 });
BusinessTripRequestSchema.index({ createdAt: -1 });

export default (mongoose.models?.BusinessTripRequest as mongoose.Model<BusinessTripRequestDocument>) || 
  mongoose.model<BusinessTripRequestDocument>("BusinessTripRequest", BusinessTripRequestSchema);