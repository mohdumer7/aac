import mongoose, { Schema, Document } from "mongoose";

export interface CandidateInformationDocument extends Document {
  // Form ABS/HR/C/F02 - Candidate Information Form
  formId: string; // "ABS/HR/C/F02"
  version: string; // "25-04-2022 V.1"
  
  // Personal Details
  positionApplied: string;
  name: string;
  dateOfBirth: Date;
  nationality: mongoose.Types.ObjectId; // Reference to Country
  gender: 'male' | 'female';
  maritalStatus: 'single' | 'married' | 'divorced';
  fatherName: string;
  motherName: string;
  spouseName?: string;
  
  // Children Information
  children: Array<{
    name: string;
    gender: string;
    age: number;
  }>;
  
  // Work Experience
  workExperience: Array<{
    employerName: string;
    years: number;
  }>;
  
  // Contacts & Addresses
  contactAddressUAE: string;
  phoneNumbersUAE: string;
  contactAddressHomeCountry: string;
  phoneNumbersHomeCountry: string;
  email: string;
  homeTownCityIntlAirport: string;
  
  // Passport & Employment
  passportNo: string;
  passportExpiry: Date;
  currentWorkLocation: string;
  currentSalaryPackage: number;
  noticePeriod: string;
  expectedDOJ: Date;
  
  // Visa-Cancellation Options (UAE based)
  joinDirectlyAfterCancellation?: boolean;
  travelToHomeCountry?: boolean;
  reasonForTravel?: string;
  daysStayHomeCountry?: number;
  
  // Referral Information
  sourceOfPositionInfo: string;
  friendsRelativesInABS?: boolean;
  referrals: Array<{
    name: string;
    relation: string;
    contactNo: string;
  }>;
  
  // Declarations & Signatures
  candidateSignature?: string;
  candidateSignatureDate?: Date;
  checkedByHR?: mongoose.Types.ObjectId;
  headOfHRSign?: mongoose.Types.ObjectId;
  cooCfoCeoSign?: mongoose.Types.ObjectId;
  
  // Status and Workflow
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  linkedManpowerRequisition?: mongoose.Types.ObjectId;
  
  // Draft Management
  isDraft: boolean;
  draftSavedAt?: Date;
  
  // Audit fields
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateInformationSchema = new Schema<CandidateInformationDocument>(
  {
    formId: { type: String, default: "ABS/HR/C/F02" },
    version: { type: String, default: "25-04-2022 V.1" },
    
    // Personal Details
    positionApplied: { type: String, required: true },
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    nationality: { 
      type: Schema.Types.ObjectId, 
      ref: 'Country', 
      required: true,
      autopopulate: true
    },
    gender: { 
      type: String, 
      enum: ['male', 'female'], 
      required: true 
    },
    maritalStatus: { 
      type: String, 
      enum: ['single', 'married', 'divorced'], 
      required: true 
    },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    spouseName: { type: String },
    
    // Children Information
    children: [{
      name: { type: String, required: true },
      gender: { type: String, required: true },
      age: { type: Number, required: true, min: 0 }
    }],
    
    // Work Experience
    workExperience: [{
      employerName: { type: String, required: true },
      years: { type: Number, required: true, min: 0 }
    }],
    
    // Contacts & Addresses
    contactAddressUAE: { type: String, required: true },
    phoneNumbersUAE: { type: String, required: true },
    contactAddressHomeCountry: { type: String, required: true },
    phoneNumbersHomeCountry: { type: String, required: true },
    email: { 
      type: String, 
      required: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    homeTownCityIntlAirport: { type: String, required: true },
    
    // Passport & Employment
    passportNo: { type: String, required: true },
    passportExpiry: { type: Date, required: true },
    currentWorkLocation: { type: String, required: true },
    currentSalaryPackage: { type: Number, required: true, min: 0 },
    noticePeriod: { type: String, required: true },
    expectedDOJ: { type: Date, required: true },
    
    // Visa-Cancellation Options
    joinDirectlyAfterCancellation: { type: Boolean },
    travelToHomeCountry: { type: Boolean },
    reasonForTravel: { type: String },
    daysStayHomeCountry: { type: Number, min: 0 },
    
    // Referral Information
    sourceOfPositionInfo: { type: String, required: true },
    friendsRelativesInABS: { type: Boolean },
    referrals: [{
      name: { type: String, required: true },
      relation: { type: String, required: true },
      contactNo: { type: String, required: true }
    }],
    
    // Declarations & Signatures
    candidateSignature: { type: String },
    candidateSignatureDate: { type: Date },
    checkedByHR: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    headOfHRSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    cooCfoCeoSign: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    
    // Status and Workflow
    status: { 
      type: String, 
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
      default: 'draft'
    },
    linkedManpowerRequisition: { 
      type: Schema.Types.ObjectId, 
      ref: 'ManpowerRequisition' 
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
CandidateInformationSchema.plugin(require('mongoose-autopopulate'));

// Generate unique candidate ID
CandidateInformationSchema.pre('save', async function(next) {
  if (this.isNew && !this.formId.includes('-')) {
    const count = await mongoose.model('CandidateInformation').countDocuments();
    this.formId = `CAN-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Validation: Expected DOJ should be in future
CandidateInformationSchema.pre('save', function(next) {
  if (this.expectedDOJ && this.expectedDOJ <= new Date()) {
    next(new Error('Expected Date of Joining must be in the future'));
  } else {
    next();
  }
});

// Index for efficient queries
CandidateInformationSchema.index({ email: 1 });
CandidateInformationSchema.index({ passportNo: 1 });
CandidateInformationSchema.index({ status: 1 });
CandidateInformationSchema.index({ linkedManpowerRequisition: 1 });
CandidateInformationSchema.index({ createdAt: -1 });

export default mongoose.models.CandidateInformation || 
  mongoose.model<CandidateInformationDocument>("CandidateInformation", CandidateInformationSchema);