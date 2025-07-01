import mongoose, { Schema, Document } from "mongoose";

export interface NonDisclosureAgreementDocument extends Document {
  // Form ABS/HR/C/F06 - Nondisclosure Agreement
  formId: string; // "ABS/HR/C/F06"
  version: string; // "25-04-2022 V.1"
  
  // Parties & Date
  agreementDate: Date;
  employeeName: string;
  employeeId: string;
  companyRepName: string;
  companyRepDesignation?: mongoose.Types.ObjectId;
  
  // Employee Details
  employeeDesignation: mongoose.Types.ObjectId; // Reference to Designation
  employeeDepartment: mongoose.Types.ObjectId; // Reference to Department
  employeeEmail?: string;
  
  // NDA Terms & Content
  ndaType: 'standard' | 'custom';
  
  // Standard NDA Terms (predefined)
  standardTerms: {
    confidentialityPeriod: number; // Years (e.g., 2, 5, indefinite)
    includeTradeSecrets: boolean;
    includeClientInformation: boolean;
    includeBusinessProcesses: boolean;
    includeFinancialInformation: boolean;
    includeTechnicalInformation: boolean;
    includeMarketingInformation: boolean;
  };
  
  // Custom Terms (if ndaType is custom)
  customTerms?: {
    customClausesText?: string;
    additionalRestrictions?: string;
    specificConfidentialItems?: Array<string>;
    nonCompetePeriod?: number; // Months
    nonSolicitationPeriod?: number; // Months
  };
  
  // Agreement Text (generated or custom)
  agreementText: string;
  
  // Consequences & Penalties
  consequences: {
    terminationClause: boolean;
    legalActionClause: boolean;
    monetaryPenaltyClause: boolean;
    monetaryPenaltyAmount?: number;
    injunctiveReliefClause: boolean;
  };
  
  // Signatures
  companySignature?: string;
  companySignDate?: Date;
  companySignedBy?: mongoose.Types.ObjectId; // Reference to User who signed for company
  
  employeeSignature?: string;
  employeeSignDate?: Date;
  employeeIpAddress?: string; // For digital signature tracking
  employeeSignatureMethod: 'physical' | 'digital' | 'electronic';
  
  // Witnesses (if required)
  witnesses?: Array<{
    witnessName: string;
    witnessDesignation: string;
    witnessSignature?: string;
    witnessSignDate?: Date;
  }>;
  
  // Status and Workflow
  status: 'draft' | 'pending_employee_signature' | 'pending_company_signature' | 'executed' | 'expired' | 'terminated';
  
  // Validity Period
  effectiveDate: Date;
  expiryDate?: Date; // If applicable
  isIndefinite: boolean; // True if NDA doesn't expire
  
  // Linked Records
  linkedEmployeeInformation?: mongoose.Types.ObjectId;
  linkedUser?: mongoose.Types.ObjectId;
  linkedNewEmployeeJoining?: mongoose.Types.ObjectId;
  
  // Legal & Compliance
  governingLaw: string; // e.g., "UAE Law", "Dubai International Financial Centre Law"
  jurisdiction: string; // e.g., "Dubai Courts"
  
  // Amendment & Renewal
  canBeAmended: boolean;
  amendmentHistory?: Array<{
    amendmentDate: Date;
    amendmentDetails: string;
    amendedBy: mongoose.Types.ObjectId;
  }>;
  
  // Termination
  terminationDate?: Date;
  terminationReason?: string;
  terminatedBy?: mongoose.Types.ObjectId;
  
  // Draft Management
  isDraft: boolean;
  draftSavedAt?: Date;
  
  // Audit fields
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NonDisclosureAgreementSchema = new Schema<NonDisclosureAgreementDocument>(
  {
    formId: { type: String, default: "ABS/HR/C/F06" },
    version: { type: String, default: "25-04-2022 V.1" },
    
    // Parties & Date
    agreementDate: { type: Date, default: Date.now },
    employeeName: { type: String, required: true },
    employeeId: { type: String, required: true },
    companyRepName: { type: String, required: true },
    companyRepDesignation: { 
      type: Schema.Types.ObjectId, 
      ref: 'Designation',
      autopopulate: true
    },
    
    // Employee Details
    employeeDesignation: { 
      type: Schema.Types.ObjectId, 
      ref: 'Designation', 
      required: true,
      autopopulate: true
    },
    employeeDepartment: { 
      type: Schema.Types.ObjectId, 
      ref: 'Department', 
      required: true,
      autopopulate: true
    },
    employeeEmail: { 
      type: String,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    
    // NDA Terms & Content
    ndaType: { 
      type: String, 
      enum: ['standard', 'custom'], 
      default: 'standard' 
    },
    
    // Standard NDA Terms
    standardTerms: {
      confidentialityPeriod: { 
        type: Number, 
        default: 2, 
        min: 1, 
        max: 99 // 99 for indefinite
      },
      includeTradeSecrets: { type: Boolean, default: true },
      includeClientInformation: { type: Boolean, default: true },
      includeBusinessProcesses: { type: Boolean, default: true },
      includeFinancialInformation: { type: Boolean, default: true },
      includeTechnicalInformation: { type: Boolean, default: true },
      includeMarketingInformation: { type: Boolean, default: true }
    },
    
    // Custom Terms
    customTerms: {
      customClausesText: { type: String },
      additionalRestrictions: { type: String },
      specificConfidentialItems: [{ type: String }],
      nonCompetePeriod: { type: Number, min: 0 },
      nonSolicitationPeriod: { type: Number, min: 0 }
    },
    
    // Agreement Text
    agreementText: { type: String, required: true },
    
    // Consequences & Penalties
    consequences: {
      terminationClause: { type: Boolean, default: true },
      legalActionClause: { type: Boolean, default: true },
      monetaryPenaltyClause: { type: Boolean, default: false },
      monetaryPenaltyAmount: { type: Number, min: 0 },
      injunctiveReliefClause: { type: Boolean, default: true }
    },
    
    // Signatures
    companySignature: { type: String },
    companySignDate: { type: Date },
    companySignedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName designation"
      }
    },
    
    employeeSignature: { type: String },
    employeeSignDate: { type: Date },
    employeeIpAddress: { type: String },
    employeeSignatureMethod: { 
      type: String, 
      enum: ['physical', 'digital', 'electronic'], 
      default: 'digital' 
    },
    
    // Witnesses
    witnesses: [{
      witnessName: { type: String, required: true },
      witnessDesignation: { type: String, required: true },
      witnessSignature: { type: String },
      witnessSignDate: { type: Date }
    }],
    
    // Status and Workflow
    status: { 
      type: String, 
      enum: [
        'draft', 
        'pending_employee_signature', 
        'pending_company_signature', 
        'executed', 
        'expired', 
        'terminated'
      ],
      default: 'draft'
    },
    
    // Validity Period
    effectiveDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    isIndefinite: { type: Boolean, default: false },
    
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
    linkedNewEmployeeJoining: { 
      type: Schema.Types.ObjectId, 
      ref: 'NewEmployeeJoining',
      autopopulate: {
        select: "empName empId designation"
      }
    },
    
    // Legal & Compliance
    governingLaw: { 
      type: String, 
      default: "UAE Federal Law" 
    },
    jurisdiction: { 
      type: String, 
      default: "Dubai Courts" 
    },
    
    // Amendment & Renewal
    canBeAmended: { type: Boolean, default: true },
    amendmentHistory: [{
      amendmentDate: { type: Date, required: true },
      amendmentDetails: { type: String, required: true },
      amendedBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        autopopulate: {
          select: "firstName lastName displayName"
        }
      }
    }],
    
    // Termination
    terminationDate: { type: Date },
    terminationReason: { type: String },
    terminatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    
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
NonDisclosureAgreementSchema.plugin(require('mongoose-autopopulate'));

// Generate unique form ID
NonDisclosureAgreementSchema.pre('save', async function(next) {
  if (this.isNew && !this.formId.includes('-')) {
    const count = await mongoose.model('NonDisclosureAgreement').countDocuments();
    this.formId = `NDA-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Set expiry date based on confidentiality period
NonDisclosureAgreementSchema.pre('save', function(next) {
  if (!this.isIndefinite && this.standardTerms?.confidentialityPeriod) {
    if (this.standardTerms.confidentialityPeriod === 99) {
      // 99 means indefinite
      this.isIndefinite = true;
      this.expiryDate = undefined;
    } else {
      // Calculate expiry date
      const expiryDate = new Date(this.effectiveDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + this.standardTerms.confidentialityPeriod);
      this.expiryDate = expiryDate;
    }
  }
  next();
});

// Auto-generate agreement text if not provided
NonDisclosureAgreementSchema.pre('save', function(next) {
  if (!this.agreementText && this.ndaType === 'standard') {
    this.agreementText = generateStandardNDAText(this);
  }
  next();
});

// Update status based on signatures
NonDisclosureAgreementSchema.pre('save', function(next) {
  if (this.companySignature && this.employeeSignature) {
    this.status = 'executed';
  } else if (this.companySignature && !this.employeeSignature) {
    this.status = 'pending_employee_signature';
  } else if (!this.companySignature && this.employeeSignature) {
    this.status = 'pending_company_signature';
  }
  next();
});

// Helper function to generate standard NDA text
function generateStandardNDAText(nda: any): string {
  const confidentialityPeriod = nda.isIndefinite ? 'indefinite period' : `${nda.standardTerms.confidentialityPeriod} years`;
  
  return `
NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on ${nda.agreementDate?.toDateString()} between:

Company: Acero Building Systems, represented by ${nda.companyRepName}
Employee: ${nda.employeeName} (Employee ID: ${nda.employeeId})

The Employee acknowledges that during the course of employment, they may have access to confidential and proprietary information belonging to the Company. 

The Employee agrees to maintain strict confidentiality for a period of ${confidentialityPeriod} regarding:
${nda.standardTerms.includeTradeSecrets ? '• Trade secrets and proprietary information\n' : ''}
${nda.standardTerms.includeClientInformation ? '• Client information and customer data\n' : ''}
${nda.standardTerms.includeBusinessProcesses ? '• Business processes and methodologies\n' : ''}
${nda.standardTerms.includeFinancialInformation ? '• Financial information and pricing\n' : ''}
${nda.standardTerms.includeTechnicalInformation ? '• Technical information and specifications\n' : ''}
${nda.standardTerms.includeMarketingInformation ? '• Marketing strategies and plans\n' : ''}

Breach of this agreement may result in:
${nda.consequences.terminationClause ? '• Immediate termination of employment\n' : ''}
${nda.consequences.legalActionClause ? '• Legal action and prosecution\n' : ''}
${nda.consequences.monetaryPenaltyClause ? `• Monetary penalty of AED ${nda.consequences.monetaryPenaltyAmount || 'TBD'}\n` : ''}
${nda.consequences.injunctiveReliefClause ? '• Injunctive relief to prevent further disclosure\n' : ''}

This agreement is governed by ${nda.governingLaw} and subject to the jurisdiction of ${nda.jurisdiction}.
  `.trim();
}

// Index for efficient queries
NonDisclosureAgreementSchema.index({ employeeId: 1, status: 1 });
NonDisclosureAgreementSchema.index({ employeeName: 1 });
NonDisclosureAgreementSchema.index({ status: 1 });
NonDisclosureAgreementSchema.index({ employeeDepartment: 1, status: 1 });
NonDisclosureAgreementSchema.index({ effectiveDate: 1 });
NonDisclosureAgreementSchema.index({ expiryDate: 1 });
NonDisclosureAgreementSchema.index({ linkedEmployeeInformation: 1 });
NonDisclosureAgreementSchema.index({ linkedUser: 1 });
NonDisclosureAgreementSchema.index({ linkedNewEmployeeJoining: 1 });
NonDisclosureAgreementSchema.index({ createdAt: -1 });

export default (mongoose.models?.NonDisclosureAgreement as mongoose.Model<NonDisclosureAgreementDocument>) || 
  mongoose.model<NonDisclosureAgreementDocument>("NonDisclosureAgreement", NonDisclosureAgreementSchema);