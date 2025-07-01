import { useForm, UseFormReturn, FieldValues, SubmitHandler, UseFormProps, UseFormReturn as RHFUseFormReturn } from 'react-hook-form';
import { useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { HRWizardFormData } from '@/types/hr-wizard';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface UseHrWizardFormOptions<TFieldValues extends FieldValues = HRWizardFormData> {
  defaultValues?: Partial<TFieldValues>;
  validationSchema?: z.ZodSchema<any>;
  onSubmit: SubmitHandler<TFieldValues>;
  onSaveDraft?: (data: Partial<TFieldValues>) => Promise<void> | void;
  autoSaveDelay?: number;
}

export function useHrWizardForm<TFieldValues extends FieldValues = HRWizardFormData>({
  defaultValues,
  validationSchema,
  onSubmit,
  onSaveDraft,
  autoSaveDelay = 2000,
}: UseHrWizardFormOptions<TFieldValues>) {
  // Initialize form with react-hook-form
  const formMethods = useForm<TFieldValues>({
    defaultValues: defaultValues as any,
    resolver: validationSchema ? zodResolver(validationSchema) : undefined,
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'firstError',
    shouldFocusError: true,
    shouldUnregister: false,
    shouldUseNativeValidation: false,
  });

  const { handleSubmit, watch, formState: { isDirty, isSubmitting } } = formMethods;
  const formData = watch();
  const previousDataRef = useRef<Partial<TFieldValues>>(defaultValues || {});
  const isFirstRender = useRef(true);

  // Debounced auto-save function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSaveDraft = useCallback(
    debounce(async (data: Partial<TFieldValues>) => {
      if (onSaveDraft && isDirty && !isSubmitting) {
        try {
          await onSaveDraft(data);
        } catch (error) {
          console.error('Error auto-saving draft:', error);
        }
      }
    }, autoSaveDelay),
    [onSaveDraft, autoSaveDelay, isDirty, isSubmitting]
  );

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: TFieldValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    }
  }, [onSubmit]);

  // Auto-save effect
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (onSaveDraft && isDirty) {
      debouncedSaveDraft(formData);
    }

    return () => {
      debouncedSaveDraft.cancel();
    };
  }, [formData, debouncedSaveDraft, isDirty, onSaveDraft]);

  // Reset form with new default values
  const resetForm = useCallback((data?: Partial<TFieldValues>) => {
    formMethods.reset(data as any);
    previousDataRef.current = data || {};
  }, [formMethods]);

  // Update form values without triggering validation
  const setFormValues = useCallback((values: Partial<TFieldValues>) => {
    formMethods.reset({
      ...formMethods.getValues(),
      ...values,
    });
  }, [formMethods]);

  // Get field error message
  const getFieldError = useCallback((fieldName: string) => {
    const error = formMethods.formState.errors[fieldName as keyof typeof formMethods.formState.errors];
    return error?.message as string | undefined;
  }, [formMethods.formState.errors]);

  // Check if field has error
  const hasError = useCallback((fieldName: string) => {
    return !!formMethods.formState.errors[fieldName as keyof typeof formMethods.formState.errors];
  }, [formMethods.formState.errors]);

  return {
    ...formMethods,
    handleSubmit: handleSubmit(handleFormSubmit),
    handleFormSubmit: handleSubmit(handleFormSubmit),
    resetForm,
    setFormValues,
    getFieldError,
    hasError,
    isDirty,
    isSubmitting,
  };
}

export type HrWizardFormMethods = ReturnType<typeof useHrWizardForm>;
