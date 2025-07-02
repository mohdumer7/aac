import mongoose, { Schema, Document } from "mongoose";

export interface EmployeeInformationDocument extends Document {
  // Form ABS/HR/N/F05 - Employee Information Form
  formId: string; // "ABS/HR/N/F05"
  version: string; // "25-04-2022 V.1"
  
  // Basic Information
  empName: string;
  empId: string;
  designation: mongoose.Types.ObjectId; // Reference to Designation
  grade?: string;
  department: mongoose.Types.ObjectId; // Reference to Department
  location: mongoose.Types.ObjectId; // Reference to Location
  dateOfJoining: Date;
  dateOfBirth: Date;
  category: 'management' | 'manager' | 'staff' | 'worker';
  gender: 'male' | 'female';
  nationality: mongoose.Types.ObjectId; // Reference to Country
  religion?: string;
  bloodGroup?: string;
  maritalStatus: 'single' | 'married';
  homeTown?: string;
  airportName?: string;
  
  // Family Details
  familyDetails: {
    fatherName?: string;
    fatherNationality?: mongoose.Types.ObjectId;
    motherName?: string;
    motherNationality?: mongoose.Types.ObjectId;
    spouseName?: string;
    spouseNationality?: mongoose.Types.ObjectId;
    children?: Array<{
      childName: string;
      childNationality: mongoose.Types.ObjectId;
    }>;
  };
  
  // Contact Information
  contacts: {
    contactAddressUAE?: string;
    phoneNumbersUAE?: string;
    contactAddressHomeCountry?: string;
    phoneNumbersHomeCountry?: string;
    emailId?: string;
    emergencyContactNumbers?: string;
  };
  
  // Passport Information
  passport: {
    passportNo?: string;
    dateOfIssue?: Date;
    dateOfExpiry?: Date;
  };
  
  // Salary Details (HR use only)
  salaryDetails: {
    basic?: number;
    housingAllowance?: number;
    transportAllowance?: number;
    miscAllowance?: number;
    mobileAllowance?: number;
    foodAllowance?: number;
    companyCarAllow?: number;
    petrolCard?: number;
    otherAllowance?: number;
    totalSalary?: number;
  };
  
  // Approvals & Signatures
  employeeSignature?: string;
  employeeSignatureDate?: Date;
  checkedBy?: mongoose.Types.ObjectId;
  checkedByDate?: Date;
  headOfHrAdminApproval?: mongoose.Types.ObjectId;
  headOfHrAdminApprovalDate?: Date;
  
  // Status and Workflow
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  
  // Linked Records
  linkedUser?: mongoose.Types.ObjectId; // Reference to User record
  linkedNewEmployeeJoining?: mongoose.Types.ObjectId;
  
  // Draft Management
  isDraft: boolean;
  draftSavedAt?: Date;
  
  // Audit fields
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeInformationSchema = new Schema<EmployeeInformationDocument>(
  {
    formId: { type: String, default: "ABS/HR/N/F05" },
    version: { type: String, default: "25-04-2022 V.1" },
    
    // Basic Information
    empName: { type: String, required: true },
    empId: { type: String, required: true, unique: true },
    designation: { 
      type: Schema.Types.ObjectId, 
      ref: 'Designation', 
      required: true,
      autopopulate: true
    },
    grade: { type: String },
    department: { 
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
    dateOfJoining: { type: Date, required: true },
    dateOfBirth: { type: Date, required: true },
    category: { 
      type: String, 
      enum: ['management', 'manager', 'staff', 'worker'], 
      required: true 
    },
    gender: { 
      type: String, 
      enum: ['male', 'female'], 
      required: true 
    },
    nationality: { 
      type: Schema.Types.ObjectId, 
      ref: 'Country', 
      required: true,
      autopopulate: true
    },
    religion: { type: String },
    bloodGroup: { type: String },
    maritalStatus: { 
      type: String, 
      enum: ['single', 'married'], 
      required: true 
    },
    homeTown: { type: String },
    airportName: { type: String },
    
    // Family Details
    familyDetails: {
      fatherName: { type: String },
      fatherNationality: { 
        type: Schema.Types.ObjectId, 
        ref: 'Country',
        autopopulate: true
      },
      motherName: { type: String },
      motherNationality: { 
        type: Schema.Types.ObjectId, 
        ref: 'Country',
        autopopulate: true
      },
      spouseName: { type: String },
      spouseNationality: { 
        type: Schema.Types.ObjectId, 
        ref: 'Country',
        autopopulate: true
      },
      children: [{
        childName: { type: String, required: true },
        childNationality: { 
          type: Schema.Types.ObjectId, 
          ref: 'Country',
          autopopulate: true
        }
      }]
    },
    
    // Contact Information
    contacts: {
      contactAddressUAE: { type: String },
      phoneNumbersUAE: { type: String },
      contactAddressHomeCountry: { type: String },
      phoneNumbersHomeCountry: { type: String },
      emailId: { 
        type: String,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
      },
      emergencyContactNumbers: { type: String }
    },
    
    // Passport Information
    passport: {
      passportNo: { type: String },
      dateOfIssue: { type: Date },
      dateOfExpiry: { type: Date }
    },
    
    // Salary Details (HR use only)
    salaryDetails: {
      basic: { type: Number, min: 0 },
      housingAllowance: { type: Number, min: 0 },
      transportAllowance: { type: Number, min: 0 },
      miscAllowance: { type: Number, min: 0 },
      mobileAllowance: { type: Number, min: 0 },
      foodAllowance: { type: Number, min: 0 },
      companyCarAllow: { type: Number, min: 0 },
      petrolCard: { type: Number, min: 0 },
      otherAllowance: { type: Number, min: 0 },
      totalSalary: { type: Number, min: 0 }
    },
    
    // Approvals & Signatures
    employeeSignature: { type: String },
    employeeSignatureDate: { type: Date },
    checkedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    checkedByDate: { type: Date },
    headOfHrAdminApproval: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      autopopulate: {
        select: "firstName lastName displayName"
      }
    },
    headOfHrAdminApprovalDate: { type: Date },
    
    // Status and Workflow
    status: { 
      type: String, 
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
      default: 'draft'
    },
    
    // Linked Records
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
EmployeeInformationSchema.plugin(require('mongoose-autopopulate'));

// Generate unique form ID
EmployeeInformationSchema.pre('save', async function(next) {
  if (this.isNew && !this.formId.includes('-')) {
    const count = await mongoose.model('EmployeeInformation').countDocuments();
    this.formId = `EIF-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate total salary automatically
EmployeeInformationSchema.pre('save', function(next) {
  if (this.salaryDetails) {
    const {
      basic = 0,
      housingAllowance = 0,
      transportAllowance = 0,
      miscAllowance = 0,
      mobileAllowance = 0,
      foodAllowance = 0,
      companyCarAllow = 0,
      petrolCard = 0,
      otherAllowance = 0
    } = this.salaryDetails;
    
    this.salaryDetails.totalSalary = basic + housingAllowance + transportAllowance + 
      miscAllowance + mobileAllowance + foodAllowance + companyCarAllow + 
      petrolCard + otherAllowance;
  }
  next();
});

// Validation: passport expiry should be in future
EmployeeInformationSchema.pre('save', function(next) {
  if (this.passport?.dateOfExpiry && this.passport.dateOfExpiry <= new Date()) {
    next(new Error('Passport expiry date must be in the future'));
  } else {
    next();
  }
});

// Auto-generate unique empId if not provided or handle conflicts
EmployeeInformationSchema.pre('save', async function(next) {
  if (!this.empId || this.empId === '' || this.empId === '123321') {
    try {
      // Generate unique employee ID
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const newEmpId = `EMP${timestamp}${randomNum}`;
      
      // Check if this ID already exists
      const existing = await mongoose.model('EmployeeInformation').findOne({ empId: newEmpId });
      if (!existing) {
        this.empId = newEmpId;
        console.log('📝 AUTO-GENERATED empId:', newEmpId);
      } else {
        // If by chance it exists, add more randomness
        this.empId = `EMP${Date.now()}${Math.floor(Math.random() * 10000)}`;
      }
    } catch (error) {
      console.error('Error generating empId:', error);
      // Fallback to timestamp-based ID
      this.empId = `EMP${Date.now()}`;
    }
  }
  next();
});

// Index for efficient queries
EmployeeInformationSchema.index({ empId: 1 });
EmployeeInformationSchema.index({ empName: 1 });
EmployeeInformationSchema.index({ status: 1 });
EmployeeInformationSchema.index({ department: 1, status: 1 });
EmployeeInformationSchema.index({ linkedUser: 1 });
EmployeeInformationSchema.index({ linkedNewEmployeeJoining: 1 });
EmployeeInformationSchema.index({ createdAt: -1 });

export default (mongoose.models?.EmployeeInformation as mongoose.Model<EmployeeInformationDocument>) || 
  mongoose.model<EmployeeInformationDocument>("EmployeeInformation", EmployeeInformationSchema);