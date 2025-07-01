import { UseFormReturn, FieldValues, SubmitHandler } from 'react-hook-form';
import { HRWizardFormData } from './hr-wizard';

export interface ExtendedFormMethods extends UseFormReturn<HRWizardFormData> {
  handleSaveDraft: (e?: React.MouseEvent) => Promise<void>;
  handleFormSubmit: SubmitHandler<HRWizardFormData>;
  resetForm: (data?: Partial<HRWizardFormData>) => void;
}

export interface StepComponentProps {
  formMethods: UseFormReturn<HRWizardFormData>;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  isSaving: boolean;
  onSaveDraft: () => Promise<void>;
}

export interface WizardStep {
  id: string;
  title: string;
  component: React.FC<StepComponentProps>;
  validationSchema?: any; // Zod schema for step validation
}
