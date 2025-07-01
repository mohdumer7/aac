import { HRWizardStep } from '@/types/hr-wizard';

export const hrWizardSteps: HRWizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic personal details',
    icon: 'user',
    fields: [
      {
        id: 'firstName',
        label: 'First Name',
        type: 'text',
        required: true,
        modelPath: 'firstName',
        validation: {
          min: 2,
          errorMessage: 'First name must be at least 2 characters'
        }
      },
      {
        id: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        modelPath: 'lastName',
        validation: {
          min: 2,
          errorMessage: 'Last name must be at least 2 characters'
        }
      },
      {
        id: 'email',
        label: 'Email',
        type: 'text',
        required: true,
        modelPath: 'email',
        validation: {
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          errorMessage: 'Please enter a valid email address'
        }
      },
      {
        id: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        modelPath: 'personalDetails.gender',
        options: [
          { label: 'Male', value: 'Male' },
          { label: 'Female', value: 'Female' },
          { label: 'Other', value: 'Other' }
        ]
      },
      {
        id: 'dateOfBirth',
        label: 'Date of Birth',
        type: 'date',
        required: true,
        modelPath: 'personalDetails.dateOfBirth'
      },
      {
        id: 'maritalStatus',
        label: 'Marital Status',
        type: 'select',
        required: true,
        modelPath: 'personalDetails.maritalStatus',
        options: [
          { label: 'Single', value: 'Single' },
          { label: 'Married', value: 'Married' },
          { label: 'Divorced', value: 'Divorced' },
          { label: 'Widowed', value: 'Widowed' }
        ]
      },
      {
        id: 'nationality',
        label: 'Nationality',
        type: 'text',
        required: true,
        modelPath: 'personalDetails.nationality'
      },
      {
        id: 'personalMobileNo',
        label: 'Personal Mobile Number',
        type: 'text',
        required: true,
        modelPath: 'personalDetails.personalMobileNo'
      }
    ]
  },
  {
    id: 'employment',
    title: 'Employment Details',
    description: 'Job and position information',
    icon: 'briefcase',
    fields: [
      {
        id: 'empId',
        label: 'Employee ID',
        type: 'text',
        required: true,
        modelPath: 'empId'
      },
      {
        id: 'department',
        label: 'Department',
        type: 'select',
        required: true,
        modelPath: 'employmentDetails.department',
        options: []
      },
      {
        id: 'designation',
        label: 'Designation',
        type: 'select',
        required: true,
        modelPath: 'employmentDetails.designation',
        options: []
      },
      {
        id: 'reportingTo',
        label: 'Reports To',
        type: 'select',
        required: true,
        modelPath: 'employmentDetails.reportingTo',
        options: []
      },
      {
        id: 'employeeType',
        label: 'Employee Type',
        type: 'select',
        required: true,
        modelPath: 'employmentDetails.employeeType',
        options: []
      },
      {
        id: 'joiningDate',
        label: 'Joining Date',
        type: 'date',
        required: true,
        modelPath: 'employmentDetails.joiningDate'
      },
      {
        id: 'status',
        label: 'Employment Status',
        type: 'select',
        required: true,
        modelPath: 'employmentDetails.status',
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'On Leave', value: 'On Leave' },
          { label: 'Terminated', value: 'Terminated' },
          { label: 'Resigned', value: 'Resigned' }
        ]
      }
    ]
  },
  // Add more steps for other sections like visa, identification, etc.
  {
    id: 'visa',
    title: 'Visa & Work Permit',
    description: 'Visa and work permit information',
    icon: 'passport',
    fields: [
      {
        id: 'visaType',
        label: 'Visa Type',
        type: 'select',
        required: true,
        modelPath: 'visaDetails.visaType',
        options: []
      },
      {
        id: 'visaIssueDate',
        label: 'Visa Issue Date',
        type: 'date',
        required: true,
        modelPath: 'visaDetails.visaIssueDate'
      },
      {
        id: 'visaExpiryDate',
        label: 'Visa Expiry Date',
        type: 'date',
        required: true,
        modelPath: 'visaDetails.visaExpiryDate'
      },
      {
        id: 'workPermit',
        label: 'Work Permit Number',
        type: 'text',
        required: true,
        modelPath: 'visaDetails.workPermit'
      },
      {
        id: 'labourCardExpiryDate',
        label: 'Labour Card Expiry Date',
        type: 'date',
        required: false,
        modelPath: 'visaDetails.labourCardExpiryDate'
      }
    ]
  },
  {
    id: 'identification',
    title: 'Identification',
    description: 'Passport and ID information',
    icon: 'id-card',
    fields: [
      {
        id: 'passportNumber',
        label: 'Passport Number',
        type: 'text',
        required: true,
        modelPath: 'identification.passportNumber'
      },
      {
        id: 'passportIssueDate',
        label: 'Passport Issue Date',
        type: 'date',
        required: true,
        modelPath: 'identification.passportIssueDate'
      },
      {
        id: 'passportExpiryDate',
        label: 'Passport Expiry Date',
        type: 'date',
        required: true,
        modelPath: 'identification.passportExpiryDate'
      },
      {
        id: 'emiratesId',
        label: 'Emirates ID',
        type: 'text',
        required: true,
        modelPath: 'identification.emiratesId'
      },
      {
        id: 'emiratesIdExpiryDate',
        label: 'Emirates ID Expiry Date',
        type: 'date',
        required: true,
        modelPath: 'identification.emiratesIdExpiryDate'
      }
    ]
  },
  {
    id: 'benefits',
    title: 'Benefits',
    description: 'Employee benefits information',
    icon: 'gift',
    fields: [
      {
        id: 'medicalInsurance',
        label: 'Medical Insurance',
        type: 'text',
        required: false,
        modelPath: 'benefits.medicalInsurance'
      },
      {
        id: 'medicalInsuranceStartDate',
        label: 'Insurance Start Date',
        type: 'date',
        required: false,
        modelPath: 'benefits.medicalInsuranceStartDate'
      },
      {
        id: 'medicalInsuranceEndDate',
        label: 'Insurance End Date',
        type: 'date',
        required: false,
        modelPath: 'benefits.medicalInsuranceEndDate'
      }
    ]
  }
];

// Helper function to get field by ID
export const getFieldById = (fieldId: string) => {
  for (const step of hrWizardSteps) {
    const field = step.fields.find(f => f.id === fieldId);
    if (field) return field;
  }
  return null;
};

// Helper function to get step by ID
export const getStepById = (stepId: string) => {
  return hrWizardSteps.find(step => step.id === stepId);
};
