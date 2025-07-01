import mongoose, { Schema, Document } from "mongoose";

export interface AccommodationTransportConsentDocument extends Document {
  // Form ABS/HR/N/F09 - Consent Form (Accommodation / Transportation)
  formId: string; // "ABS/HR/N/F09"
  version: string; // "25-04-2022 V.1"
  
  // Employee Details
  empName: string;
  empId: string;
  department: mongoose.Types.ObjectId; // Reference to Department
  designation: mongoose.Types.ObjectId; // Reference to Designation
  dateOfRequest: Date;
  category: 'staff' | 'worker';
  
  // Transportation (Staff)
  transportation?: {
    placePickupPoint?: string;
    city?: string;
    companyProvidedTransport?: boolean;
    deductionAmount?: number; // AED per month
  };
  
  // Accommodation (Staff)
  accommodationStaff?: {
    flatRoomNo?: string;
    accommodatedDate?: Date;
    location?: string;
    deductionAmount?: number; // AED per month
  };
  
  // Accommodation (Worker)
  accommodationWorker?: {
    flatRoomNo?: string;
    accommodatedDate?: Date;
    location?: string;
    accommodationItems?: Array<{
      itemName: string; // Steel Cot, Mattress, Pillow, Blanket, Locker
      provided: boolean;
      condition?: string; // New, Used
      serialNumber?: string;
    }>;
    issuedBySign?: mongoose.Types.ObjectId;
    issuedDate?: Date;
  };
  
  // Signatures & Approvals
  empSign?: string;
  empSignDate?: Date;
  accommodationInChargeSign?: mongoose.Types.ObjectId;
  accommodationInChargeSignDate?: Date;
  transportationInChargeSign?: mongoose.Types.ObjectId;
  transportationInChargeSignDate?: Date;
  hrAdminDeptSign?: mongoose.Types.ObjectId;
  hrAdminDeptSignDate?: Date;
  headOfHrAdminSign?: mongoose.Types.ObjectId;
  headOfHrAdminSignDate?: Date;
  
  // Status and Workflow
  status: 'draft' | 'pending_accommodation_incharge' | 'pending_transport_incharge' | 'pending_hr_admin' | 'pending_hr_head' | 'approved' | 'rejected';
  approvalFlowId?: mongoose.Types.ObjectId;
  currentApprovalStep?: number;
  
  // Service Details
  transportationArranged?: boolean;
  accommodationArranged?: boolean;
  allItemsProvided?: boolean;
  
  // Linked Records
  linkedEmployeeInformation?: mongoose.Types.ObjectId;
  linkedUser?: mongoose.Types.ObjectId;
  
  // Draft Management
  isDraft: boolean;
  draftSavedAt?: Date;
  
  // Monthly Deductions
  monthlyTransportDeduction?: number;
  monthlyAccommodationDeduction?: number;
  totalMonthlyDeduction?: number;
  
  // Audit fields
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccommodationTransportConsentSchema = new Schema<AccommodationTransportConsentDocument>(
  {
    formId: { type: String, default: "ABS/HR/N/F09" },
    version: { type: String, default: "25-04-2022 V.1" },
    
    // Employee Details
    empName: { type: String, required: true },
    empId: { type: String, required: true },
    department: { 
      type: Schema.Types.ObjectId, 
      ref: 'Department', 
      required: true,
      autopopulate: true
    },
    designation: { 
      type: Schema.Types.ObjectId, 
      ref: 'Designation', 
      required: true,
      autopopulate: true
    },
    dateOfRequest: { type: Date, default: Date.now },
    category: { 
      type: String, 
      enum: ['staff', 'worker'], 
      required: true 
    },
    
    // Transportation (Staff)
    transportation: {
      placePickupPoint: { type: String },
      city: { type: String },
      companyProvidedTransport: { type: Boolean },
      deductionAmount: { type: Number, min: 0 }
    },
    
    // Accommodation (Staff)
    accommodationStaff: {
      flatRoomNo: { type: String },
      accommodatedDate: { type: Date },
      location: { type: String },
      deductionAmount: { type: Number, min: 0 }
    },
    
    // Accommodation (Worker)
    accommodationWorker: {
      flatRoomNo: { type: String },
      accommodatedDate: { type: Date },
      location: { type: String },
      accommodationItems: [{
        itemName: { 
          type: String, 
          enum: ['Steel Cot', 'Mattress', 'Pillow', 'Blanket', 'Locker', 'Other'],
          required: true 
        },
        provided: { type: Boolean, default: false },
        condition: { 
          type: String,
          enum: ['New', 'Used', 'Refurbished']
        },
        serialNumber: { type: String }
      }],
      issuedBySign: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      issuedDate: { type: Date }
    },
    
    // Signatures & Approvals
    empSign: { type: String },
    empSignDate: { type: Date },
    accommodationInChargeSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    accommodationInChargeSignDate: { type: Date },
    transportationInChargeSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    transportationInChargeSignDate: { type: Date },
    hrAdminDeptSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    hrAdminDeptSignDate: { type: Date },
    headOfHrAdminSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    headOfHrAdminSignDate: { type: Date },
    
    // Status and Workflow
    status: { 
      type: String, 
      enum: [
        'draft', 
        'pending_accommodation_incharge', 
        'pending_transport_incharge', 
        'pending_hr_admin', 
        'pending_hr_head', 
        'approved', 
        'rejected'
      ],
      default: 'draft'
    },
    approvalFlowId: { type: Schema.Types.ObjectId, ref: 'ApprovalFlow' },
    currentApprovalStep: { type: Number, default: 0 },
    
    // Service Details
    transportationArranged: { type: Boolean, default: false },
    accommodationArranged: { type: Boolean, default: false },
    allItemsProvided: { type: Boolean, default: false },
    
    // Linked Records
    linkedEmployeeInformation: { 
      type: Schema.Types.ObjectId, 
      ref: 'EmployeeInformation',
      autopopulate: {
        select: "empName empId designation"
      }
    },
    linkedUser: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName empId email"
      }
    },
    
    // Draft Management
    isDraft: { type: Boolean, default: true },
    draftSavedAt: { type: Date },
    
    // Monthly Deductions
    monthlyTransportDeduction: { type: Number, min: 0, default: 0 },
    monthlyAccommodationDeduction: { type: Number, min: 0, default: 0 },
    totalMonthlyDeduction: { type: Number, min: 0, default: 0 },
    
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
AccommodationTransportConsentSchema.plugin(require('mongoose-autopopulate'));

// Generate unique form ID
AccommodationTransportConsentSchema.pre('save', async function(next) {
  if (this.isNew && !this.formId.includes('-')) {
    const count = await mongoose.model('AccommodationTransportConsent').countDocuments();
    this.formId = `ATC-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate total monthly deduction
AccommodationTransportConsentSchema.pre('save', function(next) {
  let totalDeduction = 0;
  
  // Add transportation deduction
  if (this.category === 'staff' && this.transportation?.deductionAmount) {
    this.monthlyTransportDeduction = this.transportation.deductionAmount;
    totalDeduction += this.transportation.deductionAmount;
  }
  
  // Add accommodation deduction
  if (this.category === 'staff' && this.accommodationStaff?.deductionAmount) {
    this.monthlyAccommodationDeduction = this.accommodationStaff.deductionAmount;
    totalDeduction += this.accommodationStaff.deductionAmount;
  }
  
  this.totalMonthlyDeduction = totalDeduction;
  
  // Check if all accommodation items are provided (for workers)
  if (this.category === 'worker' && this.accommodationWorker?.accommodationItems) {
    this.allItemsProvided = this.accommodationWorker.accommodationItems.every(item => item.provided);
  }
  
  next();
});

// Validation: Category-specific fields
AccommodationTransportConsentSchema.pre('save', function(next) {
  if (this.category === 'staff') {
    // Staff should have either transportation or accommodation (or both)
    if (!this.transportation && !this.accommodationStaff) {
      next(new Error('Staff category requires either transportation or accommodation details'));
    }
  } else if (this.category === 'worker') {
    // Worker should have accommodation details
    if (!this.accommodationWorker) {
      next(new Error('Worker category requires accommodation details'));
    }
  }
  next();
});

// Index for efficient queries
AccommodationTransportConsentSchema.index({ empId: 1 });
AccommodationTransportConsentSchema.index({ empName: 1 });
AccommodationTransportConsentSchema.index({ status: 1 });
AccommodationTransportConsentSchema.index({ category: 1, status: 1 });
AccommodationTransportConsentSchema.index({ department: 1, status: 1 });
AccommodationTransportConsentSchema.index({ linkedEmployeeInformation: 1 });
AccommodationTransportConsentSchema.index({ linkedUser: 1 });
AccommodationTransportConsentSchema.index({ createdAt: -1 });

export default (mongoose.models?.AccommodationTransportConsent as mongoose.Model<AccommodationTransportConsentDocument>) || 
  mongoose.model<AccommodationTransportConsentDocument>("AccommodationTransportConsent", AccommodationTransportConsentSchema);