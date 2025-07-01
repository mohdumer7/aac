import mongoose, { Schema, Document } from "mongoose";

export interface AssetsITAccessDocument extends Document {
  // Form ABS/HR/N/F08 - Assets & IT-Access Form
  formId: string; // "ABS/HR/N/F08"
  version: string; // "25-04-2022 V.1"
  
  // Employee Information
  empName: string;
  designation: mongoose.Types.ObjectId; // Reference to Designation
  departmentSection: mongoose.Types.ObjectId; // Reference to Department
  reportingTo: mongoose.Types.ObjectId; // Reference to User
  dateOfRequest: Date;
  emailId?: string;
  
  // IT Access Requests
  itAccess: Array<{
    systemName: string; // e.g., MBS, AutoCAD, SharePoint
    accessGranted?: boolean;
    grantedDate?: Date;
    grantedBy?: mongoose.Types.ObjectId;
    accessLevel?: string; // Admin, User, Read-only
    notes?: string;
  }>;
  
  // Assets Requested/Provided
  assets: Array<{
    assetName: string; // e.g., Laptop, SIM card, Mobile phone
    assetType?: string; // IT Equipment, Office Equipment, Vehicle
    provided?: boolean;
    providedDate?: Date;
    providedBy?: mongoose.Types.ObjectId;
    assetId?: string; // Asset tag or serial number
    condition?: string; // New, Used, Refurbished
    returnDate?: Date; // Expected return date if applicable
    notes?: string;
  }>;
  
  // Approvals & Declaration
  budgetedPosition?: boolean;
  
  // Approval Signatures
  hodSign?: mongoose.Types.ObjectId; // Head of Department
  hodSignDate?: Date;
  headOfHrAdminSign?: mongoose.Types.ObjectId;
  headOfHrAdminSignDate?: Date;
  itSign?: mongoose.Types.ObjectId; // IT Department approval
  itSignDate?: Date;
  cooCfoSign?: mongoose.Types.ObjectId;
  cooCfoSignDate?: Date;
  
  // Employee Declaration
  employeeDeclarationSign?: string;
  employeeDeclarationDate?: Date;
  declarationText?: string; // Standard declaration text
  
  // Status and Workflow
  status: 'draft' | 'pending_hod' | 'pending_hr_admin' | 'pending_it' | 'pending_coo_cfo' | 'approved' | 'rejected' | 'assets_provided';
  approvalFlowId?: mongoose.Types.ObjectId;
  currentApprovalStep?: number;
  
  // Linked Records
  linkedNewEmployeeJoining?: mongoose.Types.ObjectId;
  linkedUser?: mongoose.Types.ObjectId; // Employee user record
  
  // Asset Management
  allAssetsProvided?: boolean;
  allITAccessGranted?: boolean;
  assetHandoverCompleted?: boolean;
  
  // Draft Management
  isDraft: boolean;
  draftSavedAt?: Date;
  
  // Audit fields
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssetsITAccessSchema = new Schema<AssetsITAccessDocument>(
  {
    formId: { type: String, default: "ABS/HR/N/F08" },
    version: { type: String, default: "25-04-2022 V.1" },
    
    // Employee Information
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
    reportingTo: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      autopopulate: {
        select: "firstName lastName displayName email empId"
      }
    },
    dateOfRequest: { type: Date, default: Date.now },
    emailId: { 
      type: String,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    
    // IT Access Requests
    itAccess: [{
      systemName: { type: String, required: true },
      accessGranted: { type: Boolean, default: false },
      grantedDate: { type: Date },
      grantedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      accessLevel: { 
        type: String,
        enum: ['Admin', 'User', 'Read-only', 'Guest']
      },
      notes: { type: String }
    }],
    
    // Assets Requested/Provided
    assets: [{
      assetName: { type: String, required: true },
      assetType: { 
        type: String,
        enum: ['IT Equipment', 'Office Equipment', 'Vehicle', 'Safety Equipment', 'Other']
      },
      provided: { type: Boolean, default: false },
      providedDate: { type: Date },
      providedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        autopopulate: {
          select: "firstName lastName displayName"
        }
      },
      assetId: { type: String }, // Asset tag or serial number
      condition: { 
        type: String,
        enum: ['New', 'Used', 'Refurbished']
      },
      returnDate: { type: Date },
      notes: { type: String }
    }],
    
    // Approvals & Declaration
    budgetedPosition: { type: Boolean },
    
    // Approval Signatures
    hodSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    hodSignDate: { type: Date },
    headOfHrAdminSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    headOfHrAdminSignDate: { type: Date },
    itSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    itSignDate: { type: Date },
    cooCfoSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    cooCfoSignDate: { type: Date },
    
    // Employee Declaration
    employeeDeclarationSign: { type: String },
    employeeDeclarationDate: { type: Date },
    declarationText: { 
      type: String,
      default: "I acknowledge receipt of the above mentioned assets and IT access. I understand that these are company property and I am responsible for their proper use and care. I agree to return all assets upon termination of employment."
    },
    
    // Status and Workflow
    status: { 
      type: String, 
      enum: [
        'draft', 
        'pending_hod', 
        'pending_hr_admin', 
        'pending_it', 
        'pending_coo_cfo', 
        'approved', 
        'rejected', 
        'assets_provided'
      ],
      default: 'draft'
    },
    approvalFlowId: { type: Schema.Types.ObjectId, ref: 'ApprovalFlow' },
    currentApprovalStep: { type: Number, default: 0 },
    
    // Linked Records
    linkedNewEmployeeJoining: { 
      type: Schema.Types.ObjectId, 
      ref: 'NewEmployeeJoining',
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
    
    // Asset Management
    allAssetsProvided: { type: Boolean, default: false },
    allITAccessGranted: { type: Boolean, default: false },
    assetHandoverCompleted: { type: Boolean, default: false },
    
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
AssetsITAccessSchema.plugin(require('mongoose-autopopulate'));

// Generate unique form ID
AssetsITAccessSchema.pre('save', async function(next) {
  if (this.isNew && !this.formId.includes('-')) {
    const count = await mongoose.model('AssetsITAccess').countDocuments();
    this.formId = `AIA-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Check if all assets are provided
AssetsITAccessSchema.pre('save', function(next) {
  if (this.assets && this.assets.length > 0) {
    this.allAssetsProvided = this.assets.every(asset => asset.provided);
  }
  
  if (this.itAccess && this.itAccess.length > 0) {
    this.allITAccessGranted = this.itAccess.every(access => access.accessGranted);
  }
  
  // Update status if everything is provided
  if (this.allAssetsProvided && this.allITAccessGranted && this.status === 'approved') {
    this.status = 'assets_provided';
  }
  
  next();
});

// Index for efficient queries
AssetsITAccessSchema.index({ empName: 1 });
AssetsITAccessSchema.index({ status: 1 });
AssetsITAccessSchema.index({ departmentSection: 1, status: 1 });
AssetsITAccessSchema.index({ linkedNewEmployeeJoining: 1 });
AssetsITAccessSchema.index({ linkedUser: 1 });
AssetsITAccessSchema.index({ dateOfRequest: -1 });
AssetsITAccessSchema.index({ createdAt: -1 });

export default (mongoose.models?.AssetsITAccess as mongoose.Model<AssetsITAccessDocument>) || 
  mongoose.model<AssetsITAccessDocument>("AssetsITAccess", AssetsITAccessSchema);