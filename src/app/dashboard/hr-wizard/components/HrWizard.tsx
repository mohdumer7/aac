import React, { useCallback, useEffect, useState, useMemo, useRef, FC } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, SubmitHandler, UseFormReturn, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { X, Loader2 } from 'lucide-react';

// API
import { 
  useSaveWizardStepMutation, 
  useSubmitWizardMutation, 
  useUploadDocumentMutation,
  useDeleteDocumentMutation
} from '@/services/endpoints/hrWizardApi';

// Types
import { HRWizardFormData } from '../schemas/hrWizardSchema';

// UI Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Schema
import { hrWizardSchema } from '../schemas/hrWizardSchema';

// Step Components
import { PersonalStep } from './steps/PersonalStep';
import { EmploymentStep } from './steps/EmploymentStep';
import { VisaStep } from './steps/VisaStep';
import { IdStep } from './steps/IdStep';
import { BenefitsStep } from './steps/BenefitsStep';
import { DocumentsStep } from './steps/DocumentsStep';
import { LeaveStep } from './steps/LeaveStep';
import { BankStep } from './steps/BankStep';
import { ReviewStep } from './steps/ReviewStep';

// Wizard Props Interface
export interface HrWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
  empId?: string;
  onSuccess?: () => void;
}

// Interface for props passed to each step component
interface StepComponentProps {
  formMethods: UseFormReturn<HRWizardFormData>;
  uploadDocument?: (file: File, docType: string) => Promise<void>;
  deleteDocument?: (documentUrl: string) => Promise<void>;
  isEditing?: boolean;
  isLastStep?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onSaveDraft?: () => Promise<boolean>;
  isFirstStep?: boolean;
  isSubmitting?: boolean;
  isSaving?: boolean;
}

// Define StepComponent type for consistent typing across step components
type StepComponent = FC<StepComponentProps>;

// Local interface that matches what DocumentsStep expects
interface LocalDocumentsStepProps {
  formMethods: UseFormReturn<HRWizardFormData>;
  onUpload?: (file: File, documentType: string) => Promise<void>;
  onDelete?: (documentUrl: string) => Promise<void>;
  onNext?: () => void;
  onBack?: () => void;
  onSaveDraft?: () => Promise<any>;
  isSubmitting?: boolean;
  isLastStep?: boolean;
  isFirstStep?: boolean;
}

// Wrapper component for DocumentsStep to handle special props
const DocumentsStepComponent: StepComponent = (props) => {
  const { 
    formMethods, 
    isEditing, 
    isLastStep, 
    onNext, 
    onBack, 
    onSaveDraft,
    isFirstStep, 
    isSubmitting, 
    isSaving,
    uploadDocument,
    deleteDocument 
  } = props;
  
  // Create props object that matches what DocumentsStep expects
  const documentsStepProps: LocalDocumentsStepProps = {
    formMethods,
    onUpload: uploadDocument,
    onDelete: deleteDocument,
    onNext,
    onBack,
    onSaveDraft,
    isSubmitting,
    isLastStep,
    isFirstStep
  };
  
  return <DocumentsStep {...documentsStepProps} />;
};

// Interface defining a step in the wizard
interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: StepComponent;
}

// Define all steps in the wizard
const STEPS: WizardStep[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic personal details',
    component: PersonalStep as StepComponent
  },
  {
    id: 'employment',
    title: 'Employment Details',
    description: 'Job and employment information',
    component: EmploymentStep as StepComponent
  },
  {
    id: 'visa',
    title: 'Visa Information',
    description: 'Visa and immigration details',
    component: VisaStep as StepComponent
  },
  {
    id: 'id',
    title: 'ID Information',
    description: 'Identification details',
    component: IdStep as StepComponent
  },
  {
    id: 'benefits',
    title: 'Benefits',
    description: 'Employee benefits information',
    component: BenefitsStep as StepComponent
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload required documents',
    component: DocumentsStepComponent
  },
  {
    id: 'leave',
    title: 'Leave',
    description: 'Leave management details',
    component: LeaveStep as StepComponent
  },
  {
    id: 'bank',
    title: 'Bank Details',
    description: 'Payment and banking information',
    component: BankStep as StepComponent
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review and submit all information',
    component: ReviewStep as StepComponent
  }
];

const HrWizard: FC<HrWizardProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  isEditing,
  empId,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const formMethods = useForm<HRWizardFormData>({
    resolver: zodResolver(hrWizardSchema),
    defaultValues: {
      personal: {
        firstName: '',
        lastName: '',
        // Only include properties that exist in the type
        dateOfBirth: '',
        gender: '',
        maritalStatus: '',
        nationality: '',
        middleName: '',
        email: '',
        phone: '',
        address: '',
      },
      employment: {
        position: '',
        department: '',
        startDate: '',
        employmentType: '',
        salary: '',
        managerName: '',
        workLocation: ''
      },
      documents: {
        idCard: null,
        passport: null,
        resume: null,
        offerLetter: null
      },
      emergency: {
        contactName: '',
        relationship: '',
        phone: ''
      },
      education: {
        degree: '',
        institution: '',
        completionYear: ''
      },
      bank: {
        accountName: '',
        accountNumber: '',
        bankName: '',
        branchName: '',
        iban: ''
      },
      // Add default values for other steps here
    },
    mode: 'onChange',
  });
  
  // API mutation hooks
  const [saveWizardStep, { isLoading: isSavingApi }] = useSaveWizardStepMutation();
  const [submitWizard, { isLoading: isSubmittingApi }] = useSubmitWizardMutation();
  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] = useDeleteDocumentMutation();
  
  // Effect to load draft data when the dialog opens and there's a draftId
  // Use a ref to track if we've loaded the draft to prevent infinite loops
  const draftLoadedRef = useRef(false);
  
  useEffect(() => {
    // Only try to load draft when dialog opens and we haven't loaded yet
    if (isOpen && empId && empId.startsWith('draft-') && !draftLoadedRef.current) {
      // This is a local draft, load from localStorage
      try {
        const draftKey = 'hr-wizard-draft-new';
        const allDrafts = JSON.parse(localStorage.getItem(draftKey) || '{}');
        
        if (allDrafts[empId]) {
          const draftData = allDrafts[empId];
          console.log('Loading draft data:', draftData);
          
          // Set current step if available
          if (typeof draftData._currentStep === 'number') {
            setCurrentStep(draftData._currentStep);
          }
          
          // Reset form with draft data
          formMethods.reset(draftData);
          draftLoadedRef.current = true;
        }
      } catch (error) {
        console.error('Error loading draft data:', error);
      }
    } else if (!isOpen) {
      // Reset the flag when dialog closes
      draftLoadedRef.current = false;
    }
  }, [isOpen, empId]); // Only depend on isOpen and empId
  
  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Derived state
  const CurrentStepComponent = STEPS[currentStep]?.component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;
  
  // Document handlers
  const handleUploadDocument = async (file: File, docType: string) => {
    try {
      await uploadDocument({ file, documentType: docType, userId: empId || '' }).unwrap();
      toast.success('Document uploaded successfully');
      return Promise.resolve();
    } catch (error) {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
      return Promise.resolve();
    }
  };
  
  const handleDeleteDocument = async (documentUrl: string) => {
    try {
      await deleteDocument({ documentUrl, userId: empId || '' }).unwrap();
      toast.success('Document deleted successfully');
      return Promise.resolve();
    } catch (error) {
      toast.error('Failed to delete document');
      console.error('Delete error:', error);
      return Promise.resolve();
    }
  };
  
  // Simple direct navigation with no restrictions
  const navigateToStep = (stepIndex: number) => {
    console.log(`Freely navigating to step: ${stepIndex + 1} from step ${currentStep + 1}`);
    
    // We're not saving per-step drafts anymore, so we don't need to save/load here
    // Allow navigation to any step without restrictions
    setCurrentStep(stepIndex);
  };

  // Navigation handlers
  const handleNext = async () => {
    // Get the current step ID
    const stepId = STEPS[currentStep].id;
    console.log('Next button clicked. Current step:', stepId, 'Step index:', currentStep);
    
    try {
      // For documents and review steps, always allow proceeding
      if (stepId === 'documents' || stepId === 'review') {
        console.log('Skipping validation for', stepId, 'step');
        if (currentStep < STEPS.length - 1) {
          console.log('Advancing to next step...');
          setCurrentStep(prev => prev + 1);
        }
        return;
      }
      
      // Get current form values for debugging
      const formValues = formMethods.getValues();
      // Use type assertion to avoid TypeScript error when accessing by dynamic key
      console.log('Current form values for', stepId, ':', (formValues as any)[stepId]);
      
      // Clear previous errors (this may help with stale validation state)
      formMethods.clearErrors();
      
      // Use a simpler validation approach - just validate the current step fields
      console.log('Validating', stepId, 'fields...');
      let isValid = false;
      
      try {
        if (stepId === 'personal') {
          isValid = await formMethods.trigger('personal');
        } else if (stepId === 'employment') {
          isValid = await formMethods.trigger('employment');
        } else if (stepId === 'visa') {
          isValid = await formMethods.trigger('visa');
        } else if (stepId === 'id') {
          isValid = await formMethods.trigger('id');
        } else if (stepId === 'benefits') {
          isValid = await formMethods.trigger('benefits');
        } else if (stepId === 'leave') {
          isValid = await formMethods.trigger('leave');
        } else if (stepId === 'bank') {
          isValid = await formMethods.trigger('bank');
        } else {
          // Default to true for steps we're not validating
          isValid = true;
        }
      } catch (validationError) {
        console.error('Validation error:', validationError);
        isValid = false;
      }
      
      console.log('Validation result:', isValid ? 'Valid' : 'Invalid');
      console.log('Form errors:', formMethods.formState.errors);
      
      // Handle validation result
      if (!isValid) {
        // Show toast with error message
        toast.error("Please complete all required fields - Some fields are missing or contain invalid data.");
        return;
      }
      
      // If validation passes, move to next step
      if (currentStep < STEPS.length - 1) {
        console.log('Advancing to next step...');
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error during form validation:', error);
      toast.error('An error occurred during validation');
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  
  // Form submission
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const data = formMethods.getValues();
      
      // If we have an empId, save to the API
      if (empId) {
        console.log('Saving draft for user:', empId, 'step:', STEPS[currentStep].id);
        
        await saveWizardStep({
          data,
          stepId: STEPS[currentStep].id,
          userId: empId,
          isDraft: true
        }).unwrap();
        
        toast.success('Draft saved successfully');
        setIsSaving(false);
        
        // Close the wizard dialog after successful save
        if (onOpenChange) {
          onOpenChange(false);
        }
        
        return true;
      } else {
        // Create a unique ID for this draft with timestamp and random string
        const tempId = `draft-${new Date().getTime()}-${Math.random().toString(36).substring(2, 10)}`;
        
        // Use localStorage as a fallback when no empId exists
        const draftKey = `hr-wizard-draft-new`;
        const allDrafts = JSON.parse(localStorage.getItem(draftKey) || '{}');
        
        // Save form data with draft name
        const draftName = data.personal?.firstName && data.personal?.lastName 
          ? `${data.personal.firstName} ${data.personal.lastName}` 
          : `Draft ${Object.keys(allDrafts).length + 1}`;
        
        // Save all form data, not just current step
        allDrafts[tempId] = {
          ...data,
          _tempId: tempId,
          _draftName: draftName,
          _lastUpdated: new Date().toISOString(),
          _currentStep: currentStep,
          _isDraft: true
        };
        
        localStorage.setItem(draftKey, JSON.stringify(allDrafts));
        console.log('Saved draft with temporary ID:', tempId);
        toast.success('Draft saved locally');
        
        // Close the wizard dialog after successful save
        if (onOpenChange) {
          onOpenChange(false);
        }
        
        setIsSaving(false);
        return true;
      }
    } catch (error) {
      toast.error('Failed to save draft');
      console.error('Save error:', error);
      setIsSaving(false);
      return false;
    }
  };

  // Handle form submission
  const handleFormSubmit: SubmitHandler<HRWizardFormData> = async (formData) => {
    setIsSubmitting(true);
    try {
      const response = await submitWizard({
        data: formData,
        userId: empId || '',
      }).unwrap();
      
      toast.success('Form submitted successfully');
      setIsSubmitting(false);
      
      // Close dialog and trigger success callback
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed to submit form');
      console.error('Submit error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        
        {/* Step indicator with numbers */}
        <div className="flex flex-col space-y-2 p-1">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span className="font-medium">Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}% Complete</span>
          </div>
          
          {/* ULTRA SIMPLE STEPS - RAW HTML FOR GUARANTEED CLICK HANDLING */}
          <div className="mb-6 px-4">
            {/* Dynamic progress bar at top */}
            <div className="h-1 bg-gray-200 mb-4 w-full">
              <div className="h-full bg-blue-500" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} />
            </div>
            
            <div className="flex justify-between items-center">
              {STEPS.map((step, index) => {
                // For free navigation, all steps are clickable
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isFuture = index > currentStep;
                
                // Different style based on step state, but all are clickable
                const bgColor = isActive ? '#ef4444' : isCompleted ? '#3b82f6' : '#d1d5db';
                const textColor = (isActive || isCompleted) ? 'white' : '#666';
                const border = isActive ? '2px solid #fee2e2' : 'none';
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <button
                      onClick={() => navigateToStep(index)}
                      style={{
                        width: '36px', 
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: bgColor,
                        color: textColor,
                        fontWeight: 'bold',
                        cursor: 'pointer', // All steps are clickable
                        border: border,
                        margin: '0',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                      }}
                    >
                      {index + 1}
                    </button>
                    <div className="text-xs mt-1" style={{maxWidth: '60px', textAlign: 'center'}}>
                      {step.title.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Show current step info */}
            <div className="text-center mt-3 text-sm font-medium">
              Step {currentStep + 1}: {STEPS[currentStep]?.title}
            </div>
          </div>
        </div>
        
        <FormProvider {...formMethods}>
          {/* Form only contains the step content, not the navigation buttons */}
          <form onSubmit={(e) => { e.preventDefault(); }} className="flex flex-col">
            <div className="overflow-y-auto px-4 py-6 max-h-[calc(60vh-120px)]">
              {CurrentStepComponent && (
                <CurrentStepComponent
                  formMethods={formMethods}
                  uploadDocument={handleUploadDocument}
                  deleteDocument={handleDeleteDocument}
                  isEditing={isEditing}
                  isLastStep={isLastStep}
                  onNext={handleNext}
                  onBack={handleBack}
                  onSaveDraft={handleSaveDraft}
                  isFirstStep={isFirstStep}
                  isSubmitting={isSubmitting || isSubmittingApi}
                  isSaving={isSaving || isSavingApi}
                />
              )}
            </div>
          </form>
          
          {/* Form errors will appear inline under each field */}
          
          {/* Navigation buttons outside the form to prevent event capture issues */}
          <div className="flex flex-wrap justify-between sm:justify-end gap-2 p-4 border-t sticky bottom-0 bg-white shadow-sm">
            {/* Back button - only show if not on first step */}
            {currentStep > 0 && (
              <Button
                type="button" 
                variant="outline"
                onClick={() => {
                  console.log('Back button clicked');
                  handleBack();
                }}
                disabled={isSubmitting || isSaving}
                className="mr-auto"
              >
                Back
              </Button>
            )}
            
            {/* Save Draft button */}
            <Button
              type="button" 
              variant="outline"
              onClick={() => {
                console.log('Save Draft button clicked');
                handleSaveDraft();
              }}
              disabled={isSubmitting || isSaving}
            >
              Save Draft
            </Button>
            
            {isLastStep ? (
              <Button
                type="button"
                disabled={isSubmitting || isSaving}
                onClick={() => {
                  console.log('Submit button clicked');
                  formMethods.handleSubmit(handleFormSubmit)();
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={async () => {
                  console.log('Next button clicked');
                  
                  // Get the current step ID
                  const stepId = STEPS[currentStep].id;
                  console.log('Current step ID:', stepId);
                  
                  // Skip validation for documents and review steps
                  if (stepId === 'documents' || stepId === 'review') {
                    console.log('Skipping validation for special step:', stepId);
                    if (currentStep < STEPS.length - 1) {
                      setCurrentStep(currentStep + 1);
                    }
                    return;
                  }
                  
                  // Get current form values for debugging
                  const formValues = formMethods.getValues();
                  // Using type assertion to avoid TypeScript error
                  const stepValues = (formValues as any)[stepId];
                  console.log('Current step values:', stepValues);
                  
                  // Validate current step
                  try {
                    console.log('Validating step:', stepId);
                    let isValid = false;
                    
                    // Trigger validation for the current step
                    isValid = await formMethods.trigger(stepId as any);
                    console.log('Validation result:', isValid ? 'VALID' : 'INVALID');
                    console.log('Form errors:', formMethods.formState.errors);
                    
                        // Check validation result
                    if (!isValid) {
                      console.log('Validation failed - inline errors will be shown');
                      // Let React Hook Form handle displaying the errors under each field
                      return;
                    } else {
                      // If validation passes, move to next step
                      if (currentStep < STEPS.length - 1) {
                        console.log('Validation passed - moving to next step');
                        setCurrentStep(currentStep + 1);
                      }
                    }
                  } catch (error) {
                    console.error('Validation error:', error);
                  }
                }}
                disabled={isSubmitting || isSaving}
              >
                Next
              </Button>
            )}
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default HrWizard;
