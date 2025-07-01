export interface HRWizardStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  fields: HRWizardField[];
  dependsOn?: string[];
  stepId?: string;
  data?: any;
  isDraft?: boolean;
}

export interface HRWizardField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'file';
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  modelPath: string; // Path in the User model (e.g., 'personalDetails.nationality')
  showIf?: (data: any) => boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
}

export interface HRWizardFormData {
  [key: string]: any;
}

export interface HRWizardApiResponse {
  status: string;
  message: string;
  data?: any;
}

export interface HRWizardDocumentUploadResponse {
  status: string;
  message: string;
  documentUrl?: string;
  documentType?: string;
}
