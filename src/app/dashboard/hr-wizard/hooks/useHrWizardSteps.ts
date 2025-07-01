import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { HRWizardFormData, HRWizardStep } from '@/types/hr-wizard';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  fields?: string[]; // Field names that belong to this step for validation
  isCompleted?: boolean;
  isDisabled?: boolean;
}

export interface UseHrWizardStepsOptions {
  userId?: string;
  initialStep?: number;
  steps: WizardStep[];
  onStepChange?: (currentStep: number, previousStep: number) => void;
  onComplete?: (data: HRWizardFormData) => Promise<void> | void;
  onSaveDraft?: (data: Partial<HRWizardFormData>, currentStep: number) => Promise<void> | void;
}

export function useHrWizardSteps({
  userId,
  initialStep = 0,
  steps: initialSteps,
  onStepChange,
  onComplete,
  onSaveDraft,
}: UseHrWizardStepsOptions) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [steps, setSteps] = useState<WizardStep[]>(initialSteps);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Memoized step information
  const totalSteps = useMemo(() => steps.length, [steps]);
  const isFirstStep = useMemo(() => currentStep === 0, [currentStep]);
  const isLastStep = useMemo(() => currentStep === totalSteps - 1, [currentStep, totalSteps]);
  const currentStepData = useMemo(() => steps[currentStep], [steps, currentStep]);

  // Update step completion status
  const updateStepCompletion = useCallback((stepIndex: number, isCompleted: boolean) => {
    setSteps(prevSteps => 
      prevSteps.map((step, index) => 
        index === stepIndex ? { ...step, isCompleted } : step
      )
    );
  }, []);

  // Validate current step fields
  const validateStep = useCallback((formData: Partial<HRWizardFormData>): boolean => {
    const currentFields = steps[currentStep]?.fields || [];
    const errors: Record<string, string> = {};

    // Simple required field validation
    currentFields.forEach(field => {
      const value = (formData as any)[field];
      if (value === undefined || value === null || value === '') {
        errors[field] = 'This field is required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentStep, steps]);

  // Navigate to a specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= totalSteps) return;
    
    const previousStep = currentStep;
    setCurrentStep(stepIndex);
    
    // Call the onStepChange callback if provided
    if (stepIndex !== previousStep) {
      onStepChange?.(stepIndex, previousStep);
    }
  }, [currentStep, onStepChange, totalSteps]);

  // Go to the next step
  const nextStep = useCallback(async (formData: Partial<HRWizardFormData> = {}) => {
    // Validate current step before proceeding
    if (!validateStep(formData)) {
      toast.error('Please fill in all required fields');
      return false;
    }

    // Save draft if onSaveDraft is provided
    if (onSaveDraft) {
      try {
        setIsSaving(true);
        await onSaveDraft(formData, currentStep);
      } catch (error) {
        console.error('Error saving draft:', error);
        toast.error('Failed to save draft');
        return false;
      } finally {
        setIsSaving(false);
      }
    }

    // Mark current step as completed
    updateStepCompletion(currentStep, true);
    
    // If not the last step, go to next step
    if (!isLastStep) {
      goToStep(currentStep + 1);
      return true;
    }

    return false;
  }, [currentStep, goToStep, isLastStep, onSaveDraft, updateStepCompletion, validateStep]);

  // Go to the previous step
  const prevStep = useCallback(async (formData: Partial<HRWizardFormData> = {}) => {
    if (isFirstStep) return false;
    
    // Save draft if onSaveDraft is provided
    if (onSaveDraft) {
      try {
        setIsSaving(true);
        await onSaveDraft(formData, currentStep);
      } catch (error) {
        console.error('Error saving draft:', error);
        toast.error('Failed to save draft');
        return false;
      } finally {
        setIsSaving(false);
      }
    }
    
    goToStep(currentStep - 1);
    return true;
  }, [currentStep, goToStep, isFirstStep, onSaveDraft]);

  // Handle form submission (when wizard is complete)
  const handleSubmit = useCallback(async (data: HRWizardFormData) => {
    if (!onComplete) return false;
    
    try {
      setIsSubmitting(true);
      await onComplete(data);
      
      // Mark all steps as completed
      setSteps(prevSteps => 
        prevSteps.map(step => ({
          ...step,
          isCompleted: true,
        }))
      );
      
      return true;
    } catch (error) {
      console.error('Error submitting wizard:', error);
      toast.error('Failed to submit wizard');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [onComplete]);

  // Save draft of the current step
  const saveDraft = useCallback(async (data: Partial<HRWizardFormData>) => {
    if (!onSaveDraft) return false;
    
    try {
      setIsSaving(true);
      await onSaveDraft(data, currentStep);
      toast.success('Draft saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentStep, onSaveDraft]);

  return {
    // State
    currentStep,
    currentStepData,
    steps,
    totalSteps,
    isFirstStep,
    isLastStep,
    isSubmitting,
    isSaving,
    validationErrors,
    
    // Actions
    goToStep,
    nextStep,
    prevStep,
    submit: handleSubmit,
    saveDraft,
    
    // Helpers
    getStepStatus: (stepIndex: number) => ({
      isActive: stepIndex === currentStep,
      isCompleted: steps[stepIndex]?.isCompleted || false,
      isDisabled: steps[stepIndex]?.isDisabled || false,
    }),
    
    // State setters
    setSteps,
    setCurrentStep,
    setValidationErrors,
  };
}

export type HrWizardSteps = ReturnType<typeof useHrWizardSteps>;
