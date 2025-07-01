import mongoose, { Schema, Document } from "mongoose";

export interface BeneficiaryDeclarationDocument extends Document {
  // Form ABS/HR/C/F02-BEN - Beneficiary Declaration Form
  formId: string; // "ABS/HR/C/F02-BEN"
  version: string; // "25-04-2022 V.1"
  
  // Declaration
  employeeName: string;
  passportNo: string;
  nomineeName: string;
  nomineeRelationship: string;
  nomineeAddressPhone: string;
  
  // Employee Details
  empName: string;
  empId: string;
  department: mongoose.Types.ObjectId; // Reference to Department
  designation: mongoose.Types.ObjectId; // Reference to Designation
  empSign?: string;
  empSignDate?: Date;
  
  // Multiple Beneficiaries Support
  beneficiaries: Array<{
    name: string;
    relationship: string;
    percentage: number; // Percentage of benefits (should total 100%)
    address: string;
    phoneNumber: string;
    alternateContact?: string;
    idDocument?: string; // Passport/ID number
    priority: number; // 1 = Primary, 2 = Secondary, etc.
  }>;
  
  // Benefit Types
  benefitTypes: {
    lifeInsurance?: boolean;
    medicalInsurance?: boolean;
    endOfServiceBenefits?: boolean;
    gratuity?: boolean;
    leaveEncashment?: boolean;
    other?: string;
  };
  
  // Emergency Contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    address: string;
  };
  
  // For HR / ADMIN Use
  hrAdminRemarks?: string;
  hrAdminDepartmentSign?: mongoose.Types.ObjectId;
  hrAdminSignDate?: Date;
  headOfHrAdminSign?: mongoose.Types.ObjectId;
  headOfHrSignDate?: Date;
  
  // Status and Workflow
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_revision';
  
  // Validation
  beneficiaryPercentageTotal?: number; // Should be 100%
  isPercentageValid?: boolean;
  
  // Linked Records
  linkedEmployeeInformation?: mongoose.Types.ObjectId;
  linkedUser?: mongoose.Types.ObjectId;
  
  // Version Control (for updates to beneficiaries)
  versionNumber: number;
  previousVersionId?: mongoose.Types.ObjectId;
  effectiveDate?: Date;
  
  // Draft Management
  isDraft: boolean;
  draftSavedAt?: Date;
  
  // Audit fields
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BeneficiaryDeclarationSchema = new Schema<BeneficiaryDeclarationDocument>(
  {
    formId: { type: String, default: "ABS/HR/C/F02-BEN" },
    version: { type: String, default: "25-04-2022 V.1" },
    
    // Declaration (legacy fields for backward compatibility)
    employeeName: { type: String, required: true },
    passportNo: { type: String, required: true },
    nomineeName: { type: String, required: true },
    nomineeRelationship: { type: String, required: true },
    nomineeAddressPhone: { type: String, required: true },
    
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
    empSign: { type: String },
    empSignDate: { type: Date },
    
    // Multiple Beneficiaries Support
    beneficiaries: [{
      name: { type: String, required: true },
      relationship: { 
        type: String, 
        required: true,
        enum: ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other']
      },
      percentage: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 100 
      },
      address: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      alternateContact: { type: String },
      idDocument: { type: String },
      priority: { 
        type: Number, 
        required: true, 
        min: 1 
      }
    }],
    
    // Benefit Types
    benefitTypes: {
      lifeInsurance: { type: Boolean, default: true },
      medicalInsurance: { type: Boolean, default: false },
      endOfServiceBenefits: { type: Boolean, default: true },
      gratuity: { type: Boolean, default: true },
      leaveEncashment: { type: Boolean, default: true },
      other: { type: String }
    },
    
    // Emergency Contact
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phoneNumber: { type: String },
      address: { type: String }
    },
    
    // For HR / ADMIN Use
    hrAdminRemarks: { type: String },
    hrAdminDepartmentSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    hrAdminSignDate: { type: Date },
    headOfHrAdminSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    headOfHrSignDate: { type: Date },
    
    // Status and Workflow
    status: { 
      type: String, 
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_revision'],
      default: 'draft'
    },
    
    // Validation
    beneficiaryPercentageTotal: { type: Number, default: 0 },
    isPercentageValid: { type: Boolean, default: false },
    
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
    
    // Version Control
    versionNumber: { type: Number, default: 1 },
    previousVersionId: { 
      type: Schema.Types.ObjectId, 
      ref: 'BeneficiaryDeclaration'
    },
    effectiveDate: { type: Date, default: Date.now },
    
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
BeneficiaryDeclarationSchema.plugin(require('mongoose-autopopulate'));

// Generate unique form ID
BeneficiaryDeclarationSchema.pre('save', async function(next) {
  if (this.isNew && !this.formId.includes('-')) {
    const count = await mongoose.model('BeneficiaryDeclaration').countDocuments();
    this.formId = `BEN-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate and validate beneficiary percentages
BeneficiaryDeclarationSchema.pre('save', function(next) {
  if (this.beneficiaries && this.beneficiaries.length > 0) {
    // Calculate total percentage
    this.beneficiaryPercentageTotal = this.beneficiaries.reduce((total, beneficiary) => {
      return total + (beneficiary.percentage || 0);
    }, 0);
    
    // Validate percentage total
    this.isPercentageValid = Math.abs(this.beneficiaryPercentageTotal - 100) < 0.01; // Allow small floating-point differences
    
    // Sort beneficiaries by priority
    this.beneficiaries.sort((a, b) => a.priority - b.priority);
  } else {
    this.beneficiaryPercentageTotal = 0;
    this.isPercentageValid = false;
  }
  
  next();
});

// Validation: Percentage must total 100%
BeneficiaryDeclarationSchema.pre('save', function(next) {
  if (!this.isDraft && !this.isPercentageValid) {
    next(new Error('Beneficiary percentages must total exactly 100%'));
  } else {
    next();
  }
});

// Validation: No duplicate priorities
BeneficiaryDeclarationSchema.pre('save', function(next) {
  if (this.beneficiaries && this.beneficiaries.length > 1) {
    const priorities = this.beneficiaries.map(b => b.priority);
    const uniquePriorities = [...new Set(priorities)];
    
    if (priorities.length !== uniquePriorities.length) {
      next(new Error('Each beneficiary must have a unique priority'));
    }
  }
  next();
});

// Virtual for formatted percentage total
BeneficiaryDeclarationSchema.virtual('formattedPercentageTotal').get(function() {
  return `${this.beneficiaryPercentageTotal?.toFixed(2)}%`;
});

// Index for efficient queries
BeneficiaryDeclarationSchema.index({ empId: 1, versionNumber: -1 });
BeneficiaryDeclarationSchema.index({ empName: 1 });
BeneficiaryDeclarationSchema.index({ status: 1 });
BeneficiaryDeclarationSchema.index({ department: 1, status: 1 });
BeneficiaryDeclarationSchema.index({ linkedEmployeeInformation: 1 });
BeneficiaryDeclarationSchema.index({ linkedUser: 1 });
BeneficiaryDeclarationSchema.index({ effectiveDate: -1 });
BeneficiaryDeclarationSchema.index({ versionNumber: -1 });
BeneficiaryDeclarationSchema.index({ createdAt: -1 });

export default (mongoose.models?.BeneficiaryDeclaration as mongoose.Model<BeneficiaryDeclarationDocument>) || 
  mongoose.model<BeneficiaryDeclarationDocument>("BeneficiaryDeclaration", BeneficiaryDeclarationSchema);