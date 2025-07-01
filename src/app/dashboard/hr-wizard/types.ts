import { UseFormReturn } from 'react-hook-form';
import { HRWizardFormData } from '@/types/hr-wizard';

export interface WizardStepProps {
  /** Form methods from react-hook-form */
  formMethods: UseFormReturn<HRWizardFormData, any>;
  /** Function to proceed to the next step */
  onNext: () => void;
  /** Function to go back to the previous step */
  onBack: () => void;
  /** Function to save the current step as a draft */
  onSaveDraft: () => Promise<void> | void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Whether the current step is the last step */
  isLastStep?: boolean;
  /** Whether the current step is the first step */
  isFirstStep?: boolean;
  /** Additional class name for the step container */
  className?: string;
}

export interface DocumentUploadProps {
  /** Document ID (if editing) */
  id?: string;
  /** Document name */
  name: string;
  /** Document type/category */
  type: string;
  /** File size in bytes */
  size?: number;
  /** File URL (if already uploaded) */
  url?: string;
  /** Upload progress (0-100) */
  progress?: number;
  /** Whether the document is required */
  required?: boolean;
  /** Callback when document is uploaded */
  onUpload?: (file: File) => Promise<void>;
  /** Callback when document is deleted */
  onDelete?: (id: string) => Promise<void>;
  /** Error message (if any) */
  error?: string;
}

export interface FormFieldProps<T = any> {
  /** Field name */
  name: string;
  /** Field label */
  label?: string;
  /** Field placeholder */
  placeholder?: string;
  /** Field description/help text */
  description?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is read-only */
  readOnly?: boolean;
  /** Field type (text, number, email, etc.) */
  type?: string;
  /** Field options (for select, radio, checkbox) */
  options?: Array<{ label: string; value: any }>;
  /** Minimum value (for number inputs) */
  min?: number;
  /** Maximum value (for number inputs) */
  max?: number;
  /** Step value (for number inputs) */
  step?: number;
  /** Minimum length (for text inputs) */
  minLength?: number;
  /** Maximum length (for text inputs) */
  maxLength?: number;
  /** Pattern to validate against (regex) */
  pattern?: string;
  /** Custom validation function */
  validate?: (value: any) => string | boolean | Promise<string | boolean>;
  /** Custom component to render */
  component?: React.ComponentType<any>;
  /** Additional props to pass to the field */
  fieldProps?: Record<string, any>;
  /** Additional props to pass to the form item */
  formItemProps?: Record<string, any>;
  /** Additional props to pass to the form control */
  formControlProps?: Record<string, any>;
  /** Additional props to pass to the form message */
  formMessageProps?: Record<string, any>;
  /** Additional class name for the field container */
  className?: string;
  /** Additional class name for the label */
  labelClassName?: string;
  /** Additional class name for the input */
  inputClassName?: string;
  /** Additional class name for the description */
  descriptionClassName?: string;
  /** Additional class name for the error message */
  errorClassName?: string;
}
