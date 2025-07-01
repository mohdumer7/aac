import { z } from 'zod';

export const hrWizardSchema = z.object({
  personal: z.object({
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.string().min(1, 'Gender is required'),
    maritalStatus: z.string().min(1, 'Marital status is required'),
    nationality: z.string().min(1, 'Nationality is required'),
  }),
  employment: z.object({
    empId: z.string().min(1, 'Employee ID is required'),
    department: z.string().min(1, 'Department is required'),
    position: z.string().min(1, 'Position is required'),
    employmentType: z.string().min(1, 'Employment type is required'),
    joiningDate: z.string().min(1, 'Joining date is required'),
    reportingManager: z.string().min(1, 'Reporting manager is required'),
    workLocation: z.string().min(1, 'Work location is required'),
  }),
  visa: z.object({
    visaType: z.string().min(1, 'Visa type is required'),
    visaNumber: z.string().min(1, 'Visa number is required'),
    issueDate: z.string().min(1, 'Issue date is required'),
    expiryDate: z.string().min(1, 'Expiry date is required'),
    passportNumber: z.string().min(1, 'Passport number is required'),
    passportExpiry: z.string().min(1, 'Passport expiry is required'),
  }),
  id: z.object({
    idType: z.string().min(1, 'ID type is required'),
    idNumber: z.string().min(1, 'ID number is required'),
    issueDate: z.string().min(1, 'Issue date is required'),
    expiryDate: z.string().min(1, 'Expiry date is required'),
    issueAuthority: z.string().min(1, 'Issuing authority is required'),
  }),
  benefits: z.object({
    medicalInsurance: z.boolean().default(false),
    lifeInsurance: z.boolean().default(false),
    retirementPlan: z.boolean().default(false),
    otherBenefits: z.string().optional(),
  }),
  documents: z.object({
    cv: z.instanceof(File).optional(),
    idProof: z.instanceof(File).optional(),
    addressProof: z.instanceof(File).optional(),
    qualificationCertificates: z.array(z.instanceof(File)).optional(),
  }),
  leave: z.object({
    annualLeaveBalance: z.number().min(0, 'Annual leave balance must be 0 or more'),
    sickLeaveBalance: z.number().min(0, 'Sick leave balance must be 0 or more'),
    otherLeaveBalance: z.number().min(0, 'Other leave balance must be 0 or more').optional(),
  }),
  bank: z.object({
    accountNumber: z.string().min(1, 'Account number is required'),
    accountName: z.string().min(1, 'Account name is required'),
    bankName: z.string().min(1, 'Bank name is required'),
    branch: z.string().min(1, 'Branch is required'),
    ifscCode: z.string().min(1, 'IFSC code is required'),
    accountType: z.string().min(1, 'Account type is required'),
  }),
});

export type HRWizardFormData = z.infer<typeof hrWizardSchema>;
