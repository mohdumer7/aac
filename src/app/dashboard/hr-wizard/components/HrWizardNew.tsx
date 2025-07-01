import React, { useCallback, useEffect, useState, useMemo, useRef, FC } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, SubmitHandler, UseFormReturn, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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

export const HrWizard: FC<HrWizardProps> = ({
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
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: '',
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
      await uploadDocument({ file, docType, userId: empId || '' }).unwrap();
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
  
  // Navigation handlers
  const handleNext = () => {
    // Trigger validation for current step
    formMethods.trigger().then((isValid) => {
      if (isValid && currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    });
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
      const formData = formMethods.getValues();
      await saveWizardStep({
        data: formData,
        stepId: STEPS[currentStep].id,
        userId: empId || '',
        isDraft: true
      }).unwrap();
      
      toast.success('Draft saved successfully');
      setIsSaving(false);
      return true;
    } catch (error) {
      toast.error('Failed to save draft');
      console.error('Save error:', error);
      setIsSaving(false);
      return false;
    }
  };
  
  // Handle form submission
  const handleFormSubmit: SubmitHandler<HRWizardFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await submitWizard({
        data: data,
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
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>
        
        <FormProvider {...formMethods}>
          <form onSubmit={formMethods.handleSubmit(handleFormSubmit)}>
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
            
            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button
                type="button" 
                variant="outline"
                onClick={() => handleSaveDraft()}
                disabled={isSubmitting || isSaving}
              >
                Save Draft
              </Button>
              
              {isLastStep ? (
                <Button
                  type="submit"
                  disabled={isSubmitting || isSaving}
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
                  onClick={handleNext}
                  disabled={isSubmitting || isSaving}
                >
                  Next
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default HrWizard;
