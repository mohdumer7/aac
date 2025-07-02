import { HRMSFormConfig } from '@/types/hrms';
import { HRMSFormTypes } from '@/types/hrms';

// Form configurations for all HRMS forms
export const HRMS_FORM_CONFIGS: Record<string, HRMSFormConfig> = {
  
  // === Manpower Requisition Form ===
  [HRMSFormTypes.MANPOWER_REQUISITION]: {
    formType: HRMSFormTypes.MANPOWER_REQUISITION,
    title: 'Manpower Requisition Form',
    description: 'Request for new employee recruitment or replacement',
    submitLabel: 'Submit Requisition',
    saveDraftLabel: 'Save Draft',
    sections: [
      {
        id: 'request_info',
        title: 'Request Information',
        description: 'Basic information about the requisition request',
        fields: [
          {
            name: 'requestedBy',
            type: 'select',
            label: 'Requested By',
            required: true,
            options: [] // Will be populated from API
          },
          {
            name: 'requestDate',
            type: 'date',
            label: 'Request Date',
            required: true,
            defaultValue: new Date().toISOString()
          },
          {
            name: 'department',
            type: 'select',
            label: 'Department',
            required: true,
            options: [] // Will be populated from API
          },
          {
            name: 'requestedPosition',
            type: 'text',
            label: 'Requested Position',
            required: true,
            placeholder: 'Enter the position title'
          }
        ]
      },
      {
        id: 'position_info',
        title: 'Position Information',
        description: 'Details about the position and vacancy reason',
        fields: [
          {
            name: 'vacancyReason',
            type: 'radio',
            label: 'Vacancy Reason',
            required: true,
            options: [
              { label: 'New Position', value: 'new_position' },
              { label: 'Replacement', value: 'replacement' }
            ]
          },
          {
            name: 'newPositionBudgeted',
            type: 'checkbox',
            label: 'New Position (Budgeted)',
            showIf: (values) => values.vacancyReason === 'new_position'
          },
          {
            name: 'newPositionNonBudgeted',
            type: 'checkbox',
            label: 'New Position (Non-Budgeted)',
            showIf: (values) => values.vacancyReason === 'new_position'
          },
          {
            name: 'noOfVacantPositions',
            type: 'number',
            label: 'Number of Vacant Positions',
            required: true,
            defaultValue: 1,
            validation: { min: 1, max: 50 }
          }
        ]
      },
      {
        id: 'previous_employee',
        title: 'Previous Employee Details',
        description: 'Information about the employee being replaced (if applicable)',
        fields: [
          {
            name: 'previousEmployee.empName',
            type: 'text',
            label: 'Employee Name',
            showIf: (values) => values.vacancyReason === 'replacement'
          },
          {
            name: 'previousEmployee.empNo',
            type: 'text',
            label: 'Employee Number',
            showIf: (values) => values.vacancyReason === 'replacement'
          },
          {
            name: 'previousEmployee.designation',
            type: 'text',
            label: 'Designation',
            showIf: (values) => values.vacancyReason === 'replacement'
          },
          {
            name: 'previousEmployee.department',
            type: 'text',
            label: 'Department',
            showIf: (values) => values.vacancyReason === 'replacement'
          },
          {
            name: 'previousEmployee.doe',
            type: 'date',
            label: 'Date of Exit',
            showIf: (values) => values.vacancyReason === 'replacement'
          },
          {
            name: 'previousEmployee.salary',
            type: 'number',
            label: 'Last Drawn Salary (AED)',
            showIf: (values) => values.vacancyReason === 'replacement'
          }
        ]
      },
      {
        id: 'candidate_info',
        title: 'Candidate Information',
        description: 'Details about the selected candidate (if available)',
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            name: 'candidateInfo.selectedCandidateName',
            type: 'text',
            label: 'Selected Candidate Name',
            placeholder: 'Enter candidate name if already selected'
          },
          {
            name: 'candidateInfo.expectedDateOfJoining',
            type: 'date',
            label: 'Expected Date of Joining'
          },
          {
            name: 'candidateInfo.designation',
            type: 'text',
            label: 'Designation',
            placeholder: 'Position title for the candidate'
          },
          {
            name: 'candidateInfo.proposedSalary',
            type: 'number',
            label: 'Proposed Salary (AED)',
            validation: { min: 0 }
          },
          {
            name: 'candidateInfo.benefits',
            type: 'textarea',
            label: 'Additional Benefits',
            placeholder: 'Describe any additional benefits offered'
          }
        ]
      }
    ]
  },

  // === Candidate Information Form ===
  [HRMSFormTypes.CANDIDATE_INFORMATION]: {
    formType: HRMSFormTypes.CANDIDATE_INFORMATION,
    title: 'Candidate Information Form',
    description: 'Comprehensive candidate information and background details',
    submitLabel: 'Submit Application',
    saveDraftLabel: 'Save Draft',
    sections: [
      {
        id: 'personal_details',
        title: 'Personal Details',
        description: 'Basic personal information of the candidate',
        fields: [
          {
            name: 'positionApplied',
            type: 'text',
            label: 'Position Applied For',
            required: true,
            placeholder: 'Enter the position you are applying for'
          },
          {
            name: 'name',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name as per passport'
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            label: 'Date of Birth',
            required: true
          },
          {
            name: 'nationality',
            type: 'select',
            label: 'Nationality',
            required: true,
            options: [] // Will be populated from countries API
          },
          {
            name: 'gender',
            type: 'radio',
            label: 'Gender',
            required: true,
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' }
            ]
          },
          {
            name: 'maritalStatus',
            type: 'radio',
            label: 'Marital Status',
            required: true,
            options: [
              { label: 'Single', value: 'single' },
              { label: 'Married', value: 'married' },
              { label: 'Divorced', value: 'divorced' }
            ]
          }
        ]
      },
      {
        id: 'family_details',
        title: 'Family Details',
        description: 'Information about family members',
        fields: [
          {
            name: 'fatherName',
            type: 'text',
            label: "Father's Name",
            required: true,
            placeholder: "Enter your father's full name"
          },
          {
            name: 'motherName',
            type: 'text',
            label: "Mother's Name",
            required: true,
            placeholder: "Enter your mother's full name"
          },
          {
            name: 'spouseName',
            type: 'text',
            label: "Spouse's Name",
            placeholder: "Enter spouse name if married",
            showIf: (values) => values.maritalStatus === 'married'
          }
        ]
      },
      {
        id: 'contact_details',
        title: 'Contact Information',
        description: 'Contact details and addresses',
        fields: [
          {
            name: 'contactAddressUAE',
            type: 'textarea',
            label: 'Contact Address in UAE',
            required: true,
            placeholder: 'Enter your current address in UAE'
          },
          {
            name: 'phoneNumbersUAE',
            type: 'tel',
            label: 'Phone Number (UAE)',
            required: true,
            placeholder: '+971-XX-XXXXXXX'
          },
          {
            name: 'contactAddressHomeCountry',
            type: 'textarea',
            label: 'Contact Address (Home Country)',
            required: true,
            placeholder: 'Enter your address in home country'
          },
          {
            name: 'phoneNumbersHomeCountry',
            type: 'tel',
            label: 'Phone Number (Home Country)',
            required: true,
            placeholder: 'Include country code'
          },
          {
            name: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'your.email@example.com'
          },
          {
            name: 'homeTownCityIntlAirport',
            type: 'text',
            label: 'Home Town/City/International Airport',
            required: true,
            placeholder: 'Nearest major city or airport'
          }
        ]
      },
      {
        id: 'passport_employment',
        title: 'Passport & Employment Details',
        description: 'Passport information and current employment status',
        fields: [
          {
            name: 'passportNo',
            type: 'text',
            label: 'Passport Number',
            required: true,
            placeholder: 'Enter passport number'
          },
          {
            name: 'passportExpiry',
            type: 'date',
            label: 'Passport Expiry Date',
            required: true
          },
          {
            name: 'currentWorkLocation',
            type: 'text',
            label: 'Current Work Location',
            required: true,
            placeholder: 'City, Country'
          },
          {
            name: 'currentSalaryPackage',
            type: 'number',
            label: 'Current Salary Package (AED)',
            required: true,
            validation: { min: 0 }
          },
          {
            name: 'noticePeriod',
            type: 'text',
            label: 'Notice Period',
            required: true,
            placeholder: 'e.g., 30 days, 2 months'
          },
          {
            name: 'expectedDOJ',
            type: 'date',
            label: 'Expected Date of Joining',
            required: true
          }
        ]
      },
      {
        id: 'visa_options',
        title: 'Visa-Cancellation Options (UAE Based)',
        description: 'Options for UAE visa holders',
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            name: 'joinDirectlyAfterCancellation',
            type: 'checkbox',
            label: 'Join directly after visa cancellation'
          },
          {
            name: 'travelToHomeCountry',
            type: 'checkbox',
            label: 'Need to travel to home country first'
          },
          {
            name: 'reasonForTravel',
            type: 'text',
            label: 'Reason for Travel',
            showIf: (values) => values.travelToHomeCountry,
            placeholder: 'Specify reason for travel'
          },
          {
            name: 'daysStayHomeCountry',
            type: 'number',
            label: 'Days to Stay in Home Country',
            showIf: (values) => values.travelToHomeCountry,
            validation: { min: 1, max: 365 }
          }
        ]
      },
      {
        id: 'referral_info',
        title: 'Referral Information',
        description: 'How you learned about this position',
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            name: 'sourceOfPositionInfo',
            type: 'text',
            label: 'Source of Position Information',
            required: true,
            placeholder: 'e.g., Job portal, referral, company website'
          },
          {
            name: 'friendsRelativesInABS',
            type: 'checkbox',
            label: 'Do you have friends or relatives working in ABS?'
          }
        ]
      }
    ]
  },

  // === Business Trip Request Form ===
  [HRMSFormTypes.BUSINESS_TRIP_REQUEST]: {
    formType: HRMSFormTypes.BUSINESS_TRIP_REQUEST,
    title: 'Business Trip Request Form',
    description: 'Request for business travel and related approvals',
    submitLabel: 'Submit Request',
    saveDraftLabel: 'Save Draft',
    sections: [
      {
        id: 'employee_details',
        title: 'Employee Details',
        description: 'Information about the traveler',
        fields: [
          {
            name: 'empOrGuestName',
            type: 'text',
            label: 'Employee/Guest Name',
            required: true,
            placeholder: 'Enter full name of traveler'
          },
          {
            name: 'empId',
            type: 'text',
            label: 'Employee ID',
            placeholder: 'Leave empty for guests'
          },
          {
            name: 'designation',
            type: 'select',
            label: 'Designation',
            required: true,
            options: [] // Will be populated from API
          },
          {
            name: 'department',
            type: 'select',
            label: 'Department',
            required: true,
            options: [] // Will be populated from API
          }
        ]
      },
      {
        id: 'trip_details',
        title: 'Trip Details',
        description: 'Information about the business trip',
        fields: [
          {
            name: 'placeOfVisit',
            type: 'text',
            label: 'Place of Visit (Country & City)',
            required: true,
            placeholder: 'e.g., Dubai, UAE'
          },
          {
            name: 'purposeOfVisit',
            type: 'textarea',
            label: 'Purpose of Visit',
            required: true,
            placeholder: 'Describe the business purpose of this trip'
          },
          {
            name: 'periodFrom',
            type: 'date',
            label: 'Travel Date From',
            required: true
          },
          {
            name: 'periodTo',
            type: 'date',
            label: 'Travel Date To',
            required: true
          }
        ]
      },
      {
        id: 'logistics',
        title: 'Logistics & Arrangements',
        description: 'Travel and accommodation arrangements',
        fields: [
          {
            name: 'cashAdvanceRequired',
            type: 'checkbox',
            label: 'Cash Advance Required'
          },
          {
            name: 'cashAdvanceAmount',
            type: 'number',
            label: 'Cash Advance Amount (AED)',
            showIf: (values) => values.cashAdvanceRequired,
            validation: { min: 0 }
          },
          {
            name: 'airTicketArrangedBy',
            type: 'radio',
            label: 'Air Ticket Arranged By',
            required: true,
            options: [
              { label: 'Company', value: 'company' },
              { label: 'Guest/Employee', value: 'guest' },
              { label: 'Not Required', value: 'not_required' }
            ]
          },
          {
            name: 'hotelArrangedBy',
            type: 'radio',
            label: 'Hotel Arranged By',
            required: true,
            options: [
              { label: 'Company', value: 'company' },
              { label: 'Guest/Employee', value: 'guest' },
              { label: 'Not Required', value: 'not_required' }
            ]
          },
          {
            name: 'airTicketReimbursed',
            type: 'checkbox',
            label: 'Air Ticket to be Reimbursed',
            showIf: (values) => values.airTicketArrangedBy === 'guest'
          },
          {
            name: 'remarks',
            type: 'textarea',
            label: 'Additional Remarks',
            placeholder: 'Any additional information or special requirements'
          }
        ]
      }
    ]
  },

  // === New Employee Joining Form ===
  [HRMSFormTypes.NEW_EMPLOYEE_JOINING]: {
    formType: HRMSFormTypes.NEW_EMPLOYEE_JOINING,
    title: 'New Employee Joining Form',
    description: 'Employee onboarding and joining formalities',
    submitLabel: 'Submit Joining Form',
    saveDraftLabel: 'Save Draft',
    sections: [
      {
        id: 'basic_info',
        title: 'Basic Information',
        description: 'Essential details for the new employee',
        fields: [
          {
            name: 'empName',
            type: 'text',
            label: 'Employee Name',
            required: true,
            placeholder: 'Full name of the new employee'
          },
          {
            name: 'designation',
            type: 'select',
            label: 'Designation',
            required: true,
            options: [] // Will be populated from API
          },
          {
            name: 'departmentSection',
            type: 'select',
            label: 'Department/Section',
            required: true,
            options: [] // Will be populated from API
          },
          {
            name: 'location',
            type: 'select',
            label: 'Work Location',
            required: true,
            options: [] // Will be populated from API
          },
          {
            name: 'reportingTo',
            type: 'select',
            label: 'Reporting To',
            required: true,
            options: [] // Will be populated from managers/supervisors
          },
          {
            name: 'dateOfReporting',
            type: 'date',
            label: 'Date of Reporting',
            required: true
          },
          {
            name: 'remarks',
            type: 'textarea',
            label: 'Remarks',
            placeholder: 'Any additional notes or instructions'
          }
        ]
      },
      {
        id: 'hr_admin_section',
        title: 'For HR/ADMIN Use Only',
        description: 'Section to be filled by HR/Admin team',
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            name: 'dateOfJoining',
            type: 'date',
            label: 'Actual Date of Joining'
          },
          {
            name: 'empId',
            type: 'text',
            label: 'Employee ID',
            placeholder: 'Will be auto-generated if not provided'
          }
        ]
      },
      {
        id: 'linked_records',
        title: 'Linked Records',
        description: 'References to related forms and records',
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            name: 'linkedCandidateInformation',
            type: 'select',
            label: 'Linked Candidate Information',
            options: [] // Will be populated from candidate forms
          },
          {
            name: 'linkedManpowerRequisition',
            type: 'select',
            label: 'Linked Manpower Requisition',
            options: [] // Will be populated from requisition forms
          }
        ]
      }
    ]
  },

  // === Assets & IT Access Form ===
  [HRMSFormTypes.ASSETS_IT_ACCESS]: {
    formType: HRMSFormTypes.ASSETS_IT_ACCESS,
    title: 'Assets & IT Access Form',
    description: 'IT access and asset allocation for employees',
    submitLabel: 'Submit Request',
    saveDraftLabel: 'Save Draft',
    sections: [
      {
        id: 'employee_info',
        title: 'Employee Information',
        description: 'Basic employee details',
        fields: [
          {
            name: 'empName',
            type: 'text',
            label: 'Employee Name',
            required: true
          },
          {
            name: 'designation',
            type: 'select',
            label: 'Designation',
            required: true,
            options: []
          },
          {
            name: 'departmentSection',
            type: 'select',
            label: 'Department/Section',
            required: true,
            options: []
          },
          {
            name: 'reportingTo',
            type: 'select',
            label: 'Reporting To',
            required: true,
            options: []
          },
          {
            name: 'dateOfRequest',
            type: 'date',
            label: 'Date of Request',
            required: true,
            defaultValue: new Date().toISOString()
          },
          {
            name: 'emailId',
            type: 'email',
            label: 'Email ID',
            placeholder: 'Corporate email address'
          }
        ]
      },
      {
        id: 'it_access',
        title: 'IT Access Requirements',
        description: 'Systems and applications access needed',
        fields: [
          {
            name: 'budgetedPosition',
            type: 'checkbox',
            label: 'This is a budgeted position'
          }
        ]
      }
    ]
  },

  // === Employee Information Form ===
  [HRMSFormTypes.EMPLOYEE_INFORMATION]: {
    formType: HRMSFormTypes.EMPLOYEE_INFORMATION,
    title: 'Employee Information Form',
    description: 'Comprehensive employee information and details',
    submitLabel: 'Submit Information',
    saveDraftLabel: 'Save Draft',
    sections: [
      {
        id: 'basic_info',
        title: 'Basic Information',
        description: 'Essential employee details',
        fields: [
          {
            name: 'empName',
            type: 'text',
            label: 'Employee Name',
            required: true,
            placeholder: 'Full name of the employee'
          },
          {
            name: 'empId',
            type: 'text',
            label: 'Employee ID',
            required: true,
            placeholder: 'Employee identification number'
          },
          {
            name: 'designation',
            type: 'select',
            label: 'Designation',
            required: true,
            options: []
          },
          {
            name: 'grade',
            type: 'text',
            label: 'Grade',
            placeholder: 'Employee grade/level'
          },
          {
            name: 'department',
            type: 'select',
            label: 'Department',
            required: true,
            options: []
          },
          {
            name: 'location',
            type: 'select',
            label: 'Location',
            required: true,
            options: []
          },
          {
            name: 'dateOfJoining',
            type: 'date',
            label: 'Date of Joining',
            required: true
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            label: 'Date of Birth',
            required: true
          },
          {
            name: 'category',
            type: 'radio',
            label: 'Category',
            required: true,
            options: [
              { label: 'Management', value: 'management' },
              { label: 'Manager', value: 'manager' },
              { label: 'Staff', value: 'staff' },
              { label: 'Worker', value: 'worker' }
            ]
          },
          {
            name: 'gender',
            type: 'radio',
            label: 'Gender',
            required: true,
            options: [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' }
            ]
          },
          {
            name: 'nationality',
            type: 'select',
            label: 'Nationality',
            required: true,
            options: []
          },
          {
            name: 'religion',
            type: 'text',
            label: 'Religion',
            placeholder: 'Employee religion'
          },
          {
            name: 'bloodGroup',
            type: 'text',
            label: 'Blood Group',
            placeholder: 'e.g., A+, B-, O+'
          },
          {
            name: 'maritalStatus',
            type: 'radio',
            label: 'Marital Status',
            required: true,
            options: [
              { label: 'Single', value: 'single' },
              { label: 'Married', value: 'married' }
            ]
          },
          {
            name: 'homeTown',
            type: 'text',
            label: 'Home Town',
            placeholder: 'Employee home town'
          },
          {
            name: 'airportName',
            type: 'text',
            label: 'Nearest Airport',
            placeholder: 'Nearest international airport'
          }
        ]
      },
      {
        id: 'family_details',
        title: 'Family Details',
        description: 'Information about family members',
        fields: [
          {
            name: 'familyDetails.fatherName',
            type: 'text',
            label: "Father's Name",
            placeholder: "Enter father's full name"
          },
          {
            name: 'familyDetails.fatherNationality',
            type: 'select',
            label: "Father's Nationality",
            options: []
          },
          {
            name: 'familyDetails.motherName',
            type: 'text',
            label: "Mother's Name",
            placeholder: "Enter mother's full name"
          },
          {
            name: 'familyDetails.motherNationality',
            type: 'select',
            label: "Mother's Nationality",
            options: []
          },
          {
            name: 'familyDetails.spouseName',
            type: 'text',
            label: "Spouse's Name",
            placeholder: "Enter spouse name if married",
            showIf: (values) => values.maritalStatus === 'married'
          },
          {
            name: 'familyDetails.spouseNationality',
            type: 'select',
            label: "Spouse's Nationality",
            options: [],
            showIf: (values) => values.maritalStatus === 'married'
          }
        ]
      },
      {
        id: 'contact_info',
        title: 'Contact Information',
        description: 'Contact details and addresses',
        fields: [
          {
            name: 'contacts.contactAddressUAE',
            type: 'textarea',
            label: 'Contact Address (UAE)',
            placeholder: 'Current address in UAE'
          },
          {
            name: 'contacts.phoneNumbersUAE',
            type: 'tel',
            label: 'Phone Number (UAE)',
            placeholder: '+971-XX-XXXXXXX'
          },
          {
            name: 'contacts.contactAddressHomeCountry',
            type: 'textarea',
            label: 'Contact Address (Home Country)',
            placeholder: 'Address in home country'
          },
          {
            name: 'contacts.phoneNumbersHomeCountry',
            type: 'tel',
            label: 'Phone Number (Home Country)',
            placeholder: 'Include country code'
          },
          {
            name: 'contacts.emailId',
            type: 'email',
            label: 'Email Address',
            placeholder: 'employee.email@company.com'
          },
          {
            name: 'contacts.emergencyContactNumbers',
            type: 'tel',
            label: 'Emergency Contact Numbers',
            placeholder: 'Emergency contact numbers'
          }
        ]
      }
    ]
  },

  // === Accommodation/Transport Consent Form ===
  [HRMSFormTypes.ACCOMMODATION_TRANSPORT_CONSENT]: {
    formType: HRMSFormTypes.ACCOMMODATION_TRANSPORT_CONSENT,
    title: 'Accommodation/Transportation Consent Form',
    description: 'Employee consent for accommodation and transportation',
    submitLabel: 'Submit Consent',
    saveDraftLabel: 'Save Draft',
    sections: [
      {
        id: 'employee_details',
        title: 'Employee Details',
        description: 'Basic employee information',
        fields: [
          {
            name: 'empName',
            type: 'text',
            label: 'Employee Name',
            required: true,
            placeholder: 'Full name of the employee'
          },
          {
            name: 'empId',
            type: 'text',
            label: 'Employee ID',
            required: true,
            placeholder: 'Employee identification number'
          },
          {
            name: 'designation',
            type: 'select',
            label: 'Designation',
            required: true,
            options: []
          },
          {
            name: 'department',
            type: 'select',
            label: 'Department',
            required: true,
            options: []
          },
          {
            name: 'dateOfJoining',
            type: 'date',
            label: 'Date of Joining',
            required: true
          }
        ]
      },
      {
        id: 'accommodation_options',
        title: 'Accommodation Options',
        description: 'Choose your accommodation preference',
        fields: [
          {
            name: 'accommodationPreference',
            type: 'radio',
            label: 'Accommodation Preference',
            required: true,
            options: [
              { label: 'Company Provided Accommodation', value: 'company_provided' },
              { label: 'Own Accommodation', value: 'own_accommodation' }
            ]
          },
          {
            name: 'accommodationDetails',
            type: 'textarea',
            label: 'Accommodation Details',
            placeholder: 'Provide details about your accommodation choice',
            showIf: (values) => values.accommodationPreference
          }
        ]
      },
      {
        id: 'transportation_options',
        title: 'Transportation Options',
        description: 'Choose your transportation preference',
        fields: [
          {
            name: 'transportationPreference',
            type: 'radio',
            label: 'Transportation Preference',
            required: true,
            options: [
              { label: 'Company Provided Transportation', value: 'company_provided' },
              { label: 'Own Transportation', value: 'own_transportation' }
            ]
          },
          {
            name: 'transportationDetails',
            type: 'textarea',
            label: 'Transportation Details',
            placeholder: 'Provide details about your transportation choice',
            showIf: (values) => values.transportationPreference
          }
        ]
      },
      {
        id: 'consent_declaration',
        title: 'Consent & Declaration',
        description: 'Employee consent and declarations',
        fields: [
          {
            name: 'consentGiven',
            type: 'checkbox',
            label: 'I hereby give my consent for the above selections',
            required: true
          },
          {
            name: 'declarationDate',
            type: 'date',
            label: 'Declaration Date',
            required: true,
            defaultValue: new Date().toISOString()
          },
          {
            name: 'employeeSignature',
            type: 'text',
            label: 'Employee Signature',
            placeholder: 'Type your full name as signature',
            required: true
          }
        ]
      }
    ]
  },

  // === Beneficiary Declaration Form ===
  [HRMSFormTypes.BENEFICIARY_DECLARATION]: {
    formType: HRMSFormTypes.BENEFICIARY_DECLARATION,
    title: 'Beneficiary Declaration Form',
    description: 'Declaration of beneficiaries for employee benefits',
    submitLabel: 'Submit Declaration',
    saveDraftLabel: 'Save Draft',
    sections: [
      {
        id: 'employee_info',
        title: 'Employee Information',
        description: 'Basic employee details',
        fields: [
          {
            name: 'empName',
            type: 'text',
            label: 'Employee Name',
            required: true,
            placeholder: 'Full name of the employee'
          },
          {
            name: 'empId',
            type: 'text',
            label: 'Employee ID',
            required: true,
            placeholder: 'Employee identification number'
          },
          {
            name: 'designation',
            type: 'select',
            label: 'Designation',
            required: true,
            options: []
          },
          {
            name: 'department',
            type: 'select',
            label: 'Department',
            required: true,
            options: []
          },
          {
            name: 'dateOfJoining',
            type: 'date',
            label: 'Date of Joining',
            required: true
          }
        ]
      },
      {
        id: 'beneficiary_details',
        title: 'Beneficiary Details',
        description: 'Information about your beneficiaries',
        fields: [
          {
            name: 'primaryBeneficiary.name',
            type: 'text',
            label: 'Primary Beneficiary Name',
            required: true,
            placeholder: 'Full name of primary beneficiary'
          },
          {
            name: 'primaryBeneficiary.relationship',
            type: 'select',
            label: 'Relationship',
            required: true,
            options: [
              { label: 'Spouse', value: 'spouse' },
              { label: 'Father', value: 'father' },
              { label: 'Mother', value: 'mother' },
              { label: 'Son', value: 'son' },
              { label: 'Daughter', value: 'daughter' },
              { label: 'Brother', value: 'brother' },
              { label: 'Sister', value: 'sister' },
              { label: 'Other', value: 'other' }
            ]
          },
          {
            name: 'primaryBeneficiary.percentage',
            type: 'number',
            label: 'Percentage (%)',
            required: true,
            validation: { min: 1, max: 100 },
            defaultValue: 100
          },
          {
            name: 'primaryBeneficiary.contactDetails',
            type: 'textarea',
            label: 'Contact Details',
            required: true,
            placeholder: 'Address and phone number of beneficiary'
          }
        ]
      },
      {
        id: 'secondary_beneficiary',
        title: 'Secondary Beneficiary (Optional)',
        description: 'Additional beneficiary information',
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            name: 'secondaryBeneficiary.name',
            type: 'text',
            label: 'Secondary Beneficiary Name',
            placeholder: 'Full name of secondary beneficiary'
          },
          {
            name: 'secondaryBeneficiary.relationship',
            type: 'select',
            label: 'Relationship',
            options: [
              { label: 'Spouse', value: 'spouse' },
              { label: 'Father', value: 'father' },
              { label: 'Mother', value: 'mother' },
              { label: 'Son', value: 'son' },
              { label: 'Daughter', value: 'daughter' },
              { label: 'Brother', value: 'brother' },
              { label: 'Sister', value: 'sister' },
              { label: 'Other', value: 'other' }
            ]
          },
          {
            name: 'secondaryBeneficiary.percentage',
            type: 'number',
            label: 'Percentage (%)',
            validation: { min: 1, max: 100 }
          },
          {
            name: 'secondaryBeneficiary.contactDetails',
            type: 'textarea',
            label: 'Contact Details',
            placeholder: 'Address and phone number of beneficiary'
          }
        ]
      },
      {
        id: 'declaration',
        title: 'Declaration',
        description: 'Employee declaration and consent',
        fields: [
          {
            name: 'declarationStatement',
            type: 'checkbox',
            label: 'I declare that the information provided above is true and accurate',
            required: true
          },
          {
            name: 'changeNotification',
            type: 'checkbox',
            label: 'I understand that I must notify HR of any changes to beneficiary information',
            required: true
          },
          {
            name: 'declarationDate',
            type: 'date',
            label: 'Declaration Date',
            required: true,
            defaultValue: new Date().toISOString()
          },
          {
            name: 'employeeSignature',
            type: 'text',
            label: 'Employee Signature',
            placeholder: 'Type your full name as signature',
            required: true
          }
        ]
      }
    ]
  }
};

// Helper function to get form config by type
export function getFormConfig(formType: string): HRMSFormConfig | undefined {
  return HRMS_FORM_CONFIGS[formType];
}

// Helper function to get all form types
export function getAllFormTypes(): string[] {
  return Object.keys(HRMS_FORM_CONFIGS);
}

// Helper function to validate required fields
export function getRequiredFields(formType: string): string[] {
  const config = getFormConfig(formType);
  if (!config) return [];
  
  const requiredFields: string[] = [];
  config.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.required) {
        requiredFields.push(field.name);
      }
    });
  });
  
  return requiredFields;
}

// Form validation schemas (to be expanded as needed)
export const FORM_VALIDATION_SCHEMAS = {
  [HRMSFormTypes.MANPOWER_REQUISITION]: {
    requestedBy: { required: true },
    department: { required: true },
    requestedPosition: { required: true, minLength: 2 },
    vacancyReason: { required: true },
    noOfVacantPositions: { required: true, min: 1 }
  },
  [HRMSFormTypes.CANDIDATE_INFORMATION]: {
    name: { required: true, minLength: 2 },
    positionApplied: { required: true },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    passportNo: { required: true },
    nationality: { required: true }
  },
  [HRMSFormTypes.BUSINESS_TRIP_REQUEST]: {
    empOrGuestName: { required: true },
    placeOfVisit: { required: true },
    purposeOfVisit: { required: true, minLength: 10 },
    periodFrom: { required: true },
    periodTo: { required: true }
  },
  [HRMSFormTypes.NEW_EMPLOYEE_JOINING]: {
    empName: { required: true },
    designation: { required: true },
    departmentSection: { required: true },
    reportingTo: { required: true },
    dateOfReporting: { required: true }
  },
  [HRMSFormTypes.ASSETS_IT_ACCESS]: {
    empName: { required: true },
    designation: { required: true },
    departmentSection: { required: true },
    reportingTo: { required: true }
  },
  [HRMSFormTypes.EMPLOYEE_INFORMATION]: {
    empName: { required: true },
    empId: { required: true },
    designation: { required: true },
    department: { required: true },
    location: { required: true },
    dateOfJoining: { required: true },
    dateOfBirth: { required: true },
    category: { required: true },
    gender: { required: true },
    nationality: { required: true },
    maritalStatus: { required: true }
  },
  [HRMSFormTypes.ACCOMMODATION_TRANSPORT_CONSENT]: {
    empName: { required: true },
    empId: { required: true },
    designation: { required: true },
    department: { required: true },
    dateOfJoining: { required: true },
    accommodationPreference: { required: true },
    transportationPreference: { required: true },
    consentGiven: { required: true },
    declarationDate: { required: true },
    employeeSignature: { required: true }
  },
  [HRMSFormTypes.BENEFICIARY_DECLARATION]: {
    empName: { required: true },
    empId: { required: true },
    designation: { required: true },
    department: { required: true },
    dateOfJoining: { required: true },
    'primaryBeneficiary.name': { required: true },
    'primaryBeneficiary.relationship': { required: true },
    'primaryBeneficiary.percentage': { required: true, min: 1, max: 100 },
    'primaryBeneficiary.contactDetails': { required: true },
    declarationStatement: { required: true },
    changeNotification: { required: true },
    declarationDate: { required: true },
    employeeSignature: { required: true }
  },
  [HRMSFormTypes.NON_DISCLOSURE_AGREEMENT]: {
    employeeName: { required: true },
    employeeId: { required: true },
    designation: { required: true },
    department: { required: true },
    startDate: { required: true },
    confidentialityPeriod: { required: true },
    scopeOfConfidentiality: { required: true },
    understandTerms: { required: true },
    acknowledgeViolations: { required: true },
    agreementDate: { required: true },
    employeeSignature: { required: true }
  }
};