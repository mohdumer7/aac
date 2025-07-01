'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider, UseFormReturn, FieldValues } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { WizardSteps } from './WizardSteps';
import { FormField } from './FormField';
import { Loader2, ChevronRight, FileCheck } from 'lucide-react';
import { UserDocument } from '@/types';

interface WizardFormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'checkbox' | 'radio' | 'number';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  fields: WizardFormField[];
}

interface HrwWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  user?: UserDocument;
  onSuccess?: () => void;
}

const defaultSteps: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal',
    description: 'Personal Information',
    fields: [
      {
        id: 'personalDetails.firstName',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'John',
        validation: { min: 2, max: 50 }
      },
      {
        id: 'personalDetails.lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Doe',
        validation: { min: 2, max: 50 }
      },
      {
        id: 'personalDetails.email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'john.doe@example.com',
        validation: { 
          pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$' 
        }
      },
      {
        id: 'personalDetails.phone',
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: '+1 (555) 123-4567',
        validation: {
          pattern: '^[+\d\s-()]{10,}$'
        }
      },
    ],
  },
  // Employment Step
  {
    id: 'employment',
    title: 'Employment',
    description: 'Employment Details',
    fields: [
      {
        id: 'employmentDetails.position',
        label: 'Position',
        type: 'text',
        required: true,
        placeholder: 'e.g., Software Engineer'
      },
      {
        id: 'employmentDetails.department',
        label: 'Department',
        type: 'text',
        required: true,
        placeholder: 'e.g., Engineering'
      },
      {
        id: 'employmentDetails.startDate',
        label: 'Start Date',
        type: 'date',
        required: true
      },
      {
        id: 'employmentDetails.empId',
        label: 'Employee ID',
        type: 'text',
        required: true,
        placeholder: 'EMP-12345'
      },
    ]
  },
  // Visa Step
  {
    id: 'visa',
    title: 'Visa',
    description: 'Visa and Work Authorization',
    fields: [
      {
        id: 'visaDetails.visaType',
        label: 'Visa Type',
        type: 'select',
        required: true,
        options: [
          { label: 'H-1B', value: 'h1b' },
          { label: 'L-1', value: 'l1' },
          { label: 'F-1 OPT', value: 'f1_opt' },
          { label: 'Green Card', value: 'green_card' },
          { label: 'Citizen', value: 'citizen' },
          { label: 'Other', value: 'other' }
        ]
      },
      {
        id: 'visaDetails.visaNumber',
        label: 'Visa Number',
        type: 'text',
        required: true,
        placeholder: 'Enter visa number',
        validation: { min: 5, max: 20 }
      },
      {
        id: 'visaDetails.visaExpiry',
        label: 'Visa Expiry Date',
        type: 'date',
        required: true
      },
      {
        id: 'visaDetails.i94Number',
        label: 'I-94 Number',
        type: 'text',
        placeholder: 'Enter I-94 number',
        validation: { pattern: '^[0-9]{11}$' }
      }
    ]
  },
  // ID Step
  {
    id: 'identification',
    title: 'ID',
    description: 'Identification Documents',
    fields: [
      {
        id: 'identification.passportNumber',
        label: 'Passport Number',
        type: 'text',
        required: true,
        placeholder: 'Enter passport number',
        validation: { min: 5, max: 20 }
      },
      {
        id: 'identification.passportExpiry',
        label: 'Passport Expiry Date',
        type: 'date',
        required: true
      },
      {
        id: 'identification.ssn',
        label: 'Social Security Number',
        type: 'text',
        required: true,
        placeholder: 'XXX-XX-XXXX',
        validation: { pattern: '^\d{3}-\d{2}-\d{4}$' }
      },
      {
        id: 'identification.driversLicense',
        label: "Driver's License Number",
        type: 'text',
        placeholder: 'Enter driver\'s license number'
      }
    ]
  },
  // Benefits Step
  {
    id: 'benefits',
    title: 'Benefits',
    description: 'Employee Benefits Selection',
    fields: [
      {
        id: 'benefits.medicalPlan',
        label: 'Medical Plan',
        type: 'select',
        required: true,
        options: [
          { label: 'Select Medical Plan', value: '' },
          { label: 'PPO Basic', value: 'ppo_basic' },
          { label: 'PPO Premium', value: 'ppo_premium' },
          { label: 'HDHP with HSA', value: 'hdhp_hsa' },
          { label: 'HMO', value: 'hmo' },
          { label: 'Waive Coverage', value: 'waived' }
        ]
      },
      {
        id: 'benefits.dentalPlan',
        label: 'Dental Plan',
        type: 'select',
        options: [
          { label: 'Select Dental Plan', value: '' },
          { label: 'Basic', value: 'basic' },
          { label: 'Premium', value: 'premium' },
          { label: 'Waive Coverage', value: 'waived' }
        ]
      },
      {
        id: 'benefits.visionPlan',
        label: 'Vision Plan',
        type: 'select',
        options: [
          { label: 'Select Vision Plan', value: '' },
          { label: 'Standard', value: 'standard' },
          { label: 'Premium', value: 'premium' },
          { label: 'Waive Coverage', value: 'waived' }
        ]
      },
      {
        id: 'benefits.retirementPlan',
        label: '401(k) Contribution',
        type: 'number',
        placeholder: '0-100%',
        validation: { min: 0, max: 100 }
      }
    ]
  },
  // Documents Step
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload Required Documents',
    fields: [
      {
        id: 'documents.resume',
        label: 'Resume/CV',
        type: 'file',
        required: true,
        accept: '.pdf,.doc,.docx'
      },
      {
        id: 'documents.offerLetter',
        label: 'Signed Offer Letter',
        type: 'file',
        required: true,
        accept: '.pdf'
      },
      {
        id: 'documents.identification',
        label: 'Government ID (Passport/Driver\'s License)',
        type: 'file',
        required: true,
        accept: '.pdf,.jpg,.jpeg,.png'
      },
      {
        id: 'documents.visaDocuments',
        label: 'Visa/Work Authorization',
        type: 'file',
        accept: '.pdf,.jpg,.jpeg,.png',
        description: 'Required for non-citizens'
      }
    ]
  },
  // Leave Step
  {
    id: 'leave',
    title: 'Leave',
    description: 'Leave and Time Off',
    fields: [
      {
        id: 'leave.annualLeave',
        label: 'Annual Leave Days',
        type: 'number',
        required: true,
        defaultValue: 20,
        validation: { min: 0, max: 30 }
      },
      {
        id: 'leave.sickLeave',
        label: 'Sick Leave Days',
        type: 'number',
        required: true,
        defaultValue: 10,
        validation: { min: 0, max: 30 }
      },
      {
        id: 'leave.otherLeave',
        label: 'Other Leave Days',
        type: 'number',
        validation: { min: 0, max: 30 }
      },
      {
        id: 'leave.leaveNotes',
        label: 'Special Leave Notes',
        type: 'textarea',
        placeholder: 'Any special leave arrangements or notes'
      }
    ]
  },
  // Bank Step
  {
    id: 'bank',
    title: 'Bank',
    description: 'Bank Account Details',
    fields: [
      {
        id: 'bank.accountHolderName',
        label: 'Account Holder Name',
        type: 'text',
        required: true,
        placeholder: 'As it appears on bank account'
      },
      {
        id: 'bank.accountNumber',
        label: 'Account Number',
        type: 'text',
        required: true,
        validation: { pattern: '^[0-9]{8,17}$' }
      },
      {
        id: 'bank.routingNumber',
        label: 'Routing Number',
        type: 'text',
        required: true,
        validation: { pattern: '^[0-9]{9}$' }
      },
      {
        id: 'bank.accountType',
        label: 'Account Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Checking', value: 'checking' },
          { label: 'Savings', value: 'savings' }
        ]
      }
    ]
  },
  // Review Step
  {
    id: 'review',
    title: 'Review',
    description: 'Review and Submit',
    fields: [
      {
        id: 'review.termsAccepted',
        label: 'I certify that all information provided is accurate and complete.',
        type: 'checkbox',
        required: true
      },
      {
        id: 'review.privacyPolicy',
        label: 'I have read and agree to the privacy policy and terms of service.',
        type: 'checkbox',
        required: true
      },
      {
        id: 'review.signature',
        label: 'Electronic Signature',
        type: 'text',
        required: true,
        placeholder: 'Type your full name as signature'
      },
      {
        id: 'review.notes',
        label: 'Additional Notes',
        type: 'textarea',
        placeholder: 'Any additional information or special requests'
      }
    ]
  }
];

export function HrwWizard({ open, onOpenChange, userId, user, onSuccess }: HrwWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [steps] = useState<WizardStep[]>(defaultSteps);
  
  const formMethods = useForm({
    defaultValues: user || { personalDetails: {} },
  });

  const { register, handleSubmit, formState: { errors }, reset } = formMethods as UseFormReturn<FieldValues>;
  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;

  // Reset form when dialog opens or user changes
  useEffect(() => {
    if (open) {
      reset(user || { personalDetails: {} });
    }
  }, [open, user, reset]);

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveDraft = async () => {
    try {
      setIsSubmitting(true);
      const formData = formMethods.getValues();
      console.log('Saving draft:', formData);
      // TODO: Implement draft save logic
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: FieldValues) => {
    try {
      setIsSubmitting(true);
      console.log('Submitting form:', data);
      // TODO: Implement form submission logic
      toast.success(userId ? 'User updated successfully' : 'User created successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormFields = () => {
    if (!currentStep?.fields) return null;
    
    return currentStep.fields.map((field) => (
      <FormField
        key={field.id}
        id={field.id}
        label={field.label}
        type={field.type}
        options={field.options}
        placeholder={field.placeholder}
        required={field.required}
        validation={field.validation}
      />
    ));
  };

  if (!currentStep) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{userId ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {userId ? 'Update user information' : 'Fill in the details to add a new user'}
          </DialogDescription>
        </DialogHeader>
        
        <FormProvider {...formMethods}>
          <div className="space-y-6 py-4">
            <WizardSteps 
              steps={steps} 
              activeStep={activeStep} 
              onStepClick={setActiveStep} 
            />
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderFormFields()}
              </div>
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                  >
                    Save Draft
                  </Button>
                  
                  {!isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isLastStep ? 'Saving...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          {isLastStep ? 'Complete Onboarding' : 'Next'}
                          {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
