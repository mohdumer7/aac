import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  useGetUserWizardDataQuery,
  useSaveWizardStepMutation,
  useSaveWizardDataMutation,
  useSubmitWizardMutation,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGeneratePdfMutation,
} from '@/services/endpoints/hrWizardApi';
import { HRWizardFormData, HRWizardStep } from '@/types/hr-wizard';

export interface UseHrWizardApiOptions {
  userId?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useHrWizardApi({ userId, onSuccess, onError }: UseHrWizardApiOptions = {}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // API hooks
  const { data: userData, isLoading: isLoadingUserData } = useGetUserWizardDataQuery(userId || '', {
    skip: !userId,
  });

  const [saveStep, { isLoading: isSavingStep }] = useSaveWizardStepMutation();
  const [saveWizard, { isLoading: isSavingWizard }] = useSaveWizardDataMutation();
  const [submitWizard, { isLoading: isSubmitting }] = useSubmitWizardMutation();
  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();
  const [generatePdf, { isLoading: isGeneratingPdf }] = useGeneratePdfMutation();

  // Combined loading state
  const isLoadingAny = useMemo(
    () => isLoading || isSavingStep || isSavingWizard || isSubmitting || isUploading || isGeneratingPdf,
    [isLoading, isSavingStep, isSavingWizard, isSubmitting, isUploading, isGeneratingPdf]
  );

  // Handle API errors
  const handleError = useCallback((error: any, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const errorMessage = error?.data?.message || error?.message || defaultMessage;
    setError(new Error(errorMessage));
    onError?.(error);
    toast.error(errorMessage);
    return error;
  }, [onError]);

  // Save a single step
  const saveStepData = useCallback(async (stepData: HRWizardStep) => {
    if (!userId) return Promise.reject(new Error('User ID is required'));
    
    setIsLoading(true);
    try {
      const result = await saveStep({
        userId,
        ...stepData,
      }).unwrap();
      
      onSuccess?.(result);
      return result;
    } catch (error) {
      return handleError(error, 'Failed to save step');
    } finally {
      setIsLoading(false);
    }
  }, [userId, saveStep, onSuccess, handleError]);

  // Save entire wizard data
  const saveWizardData = useCallback(async (data: Partial<HRWizardFormData>, isDraft = true) => {
    if (!userId) return Promise.reject(new Error('User ID is required'));
    
    setIsLoading(true);
    try {
      const result = await saveWizard({
        userId,
        data,
        isDraft,
      }).unwrap();
      
      onSuccess?.(result);
      return result;
    } catch (error) {
      return handleError(error, 'Failed to save wizard data');
    } finally {
      setIsLoading(false);
    }
  }, [userId, saveWizard, onSuccess, handleError]);

  // Submit the wizard (final submission)
  const submitWizardData = useCallback(async (data: HRWizardFormData) => {
    if (!userId) return Promise.reject(new Error('User ID is required'));
    
    setIsLoading(true);
    try {
      const result = await submitWizard({
        userId,
        data,
      }).unwrap();
      
      toast.success('Wizard submitted successfully');
      onSuccess?.(result);
      return result;
    } catch (error) {
      return handleError(error, 'Failed to submit wizard');
    } finally {
      setIsLoading(false);
    }
  }, [userId, submitWizard, onSuccess, handleError]);

  // Upload a document
  const uploadDocumentFile = useCallback(async (file: File, documentType: string) => {
    if (!userId) return Promise.reject(new Error('User ID is required'));
    
    setIsLoading(true);
    try {
      const result = await uploadDocument({
        userId,
        file,
        documentType,
      }).unwrap();
      
      toast.success('Document uploaded successfully');
      onSuccess?.(result);
      return result;
    } catch (error) {
      return handleError(error, 'Failed to upload document');
    } finally {
      setIsLoading(false);
    }
  }, [userId, uploadDocument, onSuccess, handleError]);

  // Delete a document
  const deleteDocumentFile = useCallback(async (documentUrl: string) => {
    if (!userId) return Promise.reject(new Error('User ID is required'));
    
    setIsLoading(true);
    try {
      const result = await deleteDocument({
        userId,
        documentUrl,
      }).unwrap();
      
      toast.success('Document deleted successfully');
      onSuccess?.(result);
      return result;
    } catch (error) {
      return handleError(error, 'Failed to delete document');
    } finally {
      setIsLoading(false);
    }
  }, [userId, deleteDocument, onSuccess, handleError]);

  // Generate PDF
  const generatePdfDocument = useCallback(async (formType: string) => {
    if (!userId) return Promise.reject(new Error('User ID is required'));
    
    setIsLoading(true);
    try {
      const result = await generatePdf({
        userId,
        formType,
      }).unwrap();
      
      toast.success('PDF generated successfully');
      return result;
    } catch (error) {
      return handleError(error, 'Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  }, [userId, generatePdf, handleError]);

  return {
    // State
    userData,
    isLoading: isLoadingAny,
    isLoadingUserData,
    isSavingStep,
    isSavingWizard,
    isSubmitting,
    isUploading,
    isGeneratingPdf,
    error,
    
    // Actions
    saveStepData,
    saveWizardData,
    submitWizardData,
    uploadDocument: uploadDocumentFile,
    deleteDocument: deleteDocumentFile,
    generatePdf: generatePdfDocument,
    
    // Helpers
    resetError: () => setError(null),
  };
}

export type HrWizardApi = ReturnType<typeof useHrWizardApi>;
