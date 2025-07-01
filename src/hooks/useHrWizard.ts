import { useState, useEffect, useCallback } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { 
  useSaveWizardStepMutation, 
  useSubmitWizardMutation, 
  useGetUserWizardDataQuery 
} from '@/services/endpoints/hrWizardApi';
import { HrWizardStep } from '@/types/hr-wizard';
import { UserDocument } from '@/types';
import { toast } from 'sonner';
import { hrWizardSteps } from '@/configs/hr-wizard-steps';

interface UseHrWizardProps {
  userId?: string;
  initialData?: UserDocument;
  onSuccess?: () => void;
}

export const useHrWizard = ({
  userId,
  initialData,
  onSuccess,
}: UseHrWizardProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch user data if userId is provided
  const { data: userData } = useGetUserWizardDataQuery(userId || '', {
    skip: !userId,
  });

  const formMethods = useForm({
    defaultValues: initialData || userData || {
      // Set default values for the form
      personalDetails: {},
      employmentDetails: {},
      visaDetails: {},
      identification: {},
      benefits: {}
    },
  });

  // Reset form when user data changes
  const resetForm = useCallback((data?: UserDocument) => {
    formMethods.reset(data || {
      personalDetails: {},
      employmentDetails: {},
      visaDetails: {},
      identification: {},
      benefits: {}
    });
    setActiveStep(0);
  }, [formMethods]);

  const [saveStep] = useSaveWizardStepMutation();
  const [submitWizard] = useSubmitWizardMutation();

  const steps: HrWizardStep[] = hrWizardSteps;

  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;

  const handleNext = async () => {
    const isValid = await formMethods.trigger();
    if (isValid) {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveDraft = async () => {
    if (!userId) return;
    
    try {
      const formData = formMethods.getValues();
      await saveStep({
        userId,
        step: currentStep.id,
        data: mapFormValuesToUser(formData, activeStep)
      }).unwrap();
      toast.success('Draft saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
      throw error;
    }
  };

  const handleSubmit = async (data: any) => {
    if (!userId) return;
    
    try {
      setIsSubmitting(true);
      
      // Validate all steps
      let allValid = true;
      for (const step of steps) {
        const fieldNames = step.fields.map(field => field.id);
        const stepValid = await formMethods.trigger(fieldNames);
        if (!stepValid) {
          allValid = false;
        }
      }
      
      if (!allValid) {
        toast.error('Please fill in all required fields before submitting');
        return;
      }
      
      const formValues = formMethods.getValues();
      await submitWizard({
        userId,
        data: mapFormValuesToUser(formValues)
      }).unwrap();
      
      toast.success('Form submitted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    activeStep,
    setActiveStep,
    formMethods,
    isSubmitting,
    handleNext,
    handleBack,
    handleSaveDraft,
    handleSubmit,
    steps: hrWizardSteps,
    currentStep: hrWizardSteps[activeStep],
    isLastStep: activeStep === hrWizardSteps.length - 1,
  };
};

// Helper functions to map between form values and user model
const mapUserToFormValues = (user: any) => {
  if (!user) return {};
  
  return {
    // Map top-level fields
    ...user,
    
    // Map nested fields
    ...(user.personalDetails || {}),
    ...(user.employmentDetails || {}),
    ...(user.visaDetails || {}),
    ...(user.identification || {}),
    ...(user.benefits || {})
  };
};

const mapFormValuesToUser = (formValues: any, currentStep?: number) => {
  // This is a simplified version - you'll need to map form values back to the user model structure
  const user: any = {};
  
  // Map fields based on the current step or all steps
  const stepsToProcess = currentStep !== undefined 
    ? [hrWizardSteps[currentStep]] 
    : hrWizardSteps;
  
  for (const step of stepsToProcess) {
    for (const field of step.fields) {
      // Skip if field doesn't have a model path
      if (!field.modelPath) continue;
      
      // Handle nested paths (e.g., 'personalDetails.gender')
      const pathParts = field.modelPath.split('.');
      let current = user;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      
      // Set the value
      current[pathParts[pathParts.length - 1]] = formValues[field.id];
    }
  }
  
  return user;
};
