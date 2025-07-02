'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  SaveIcon, 
  SendIcon, 
  FileTextIcon, 
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { HRMSFormConfig, HRMSFormDocument } from '@/types/hrms';
import PDFGenerator from './PDFGenerator';

interface HRMSFormContainerProps {
  formConfig: HRMSFormConfig;
  initialData?: Partial<HRMSFormDocument>;
  mode: 'create' | 'edit' | 'view';
  onSaveDraft?: (data: any) => Promise<any>;
  onSubmit?: (data: any) => Promise<any>;
  onUpdate?: (data: any) => Promise<any>;
  isLoading?: boolean;
  children: React.ReactNode;
  showFormInfo?: boolean;
  formType?: string;
  formId?: string;
}

// Helper function to safely process form data objects to prevent React rendering errors
const processSafeFormData = (data: any) => {
  if (!data) return {};
  
  const safeData: Record<string, any> = {};
  
  // Process all fields to ensure no objects are passed that could cause React child errors
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      safeData[key] = value;
      return;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      safeData[key] = value.map(item => {
        if (item === null || item === undefined) return item;
        if (typeof item !== 'object') return item;
        
        // For objects in arrays, convert to ID if they have an _id property
        if (item && typeof item === 'object' && item._id) {
          // Return just the ID for object references
          return item._id;
        }
        
        return item;
      });
      return;
    }
    
    // Handle objects (particularly user objects)
    if (value && typeof value === 'object') {
      // If it has an _id, it's likely a reference to another entity
      if (value._id) {
        safeData[key] = value._id;
        return;
      }
      
      // For other objects, keep them as is
      safeData[key] = value;
      return;
    }
    
    // For primitive values, keep as is
    safeData[key] = value;
  });
  
  return safeData;
};

export default function HRMSFormContainer({
  formConfig,
  initialData,
  mode,
  onSaveDraft,
  onSubmit,
  onUpdate,
  isLoading = false,
  children,
  showFormInfo = true,
  formType,
  formId
}: HRMSFormContainerProps) {
  const [isDraft, setIsDraft] = useState(initialData?.isDraft ?? true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Process initialData to ensure no objects are passed that could cause React child errors
  const safeInitialData = processSafeFormData(initialData);

  const methods = useForm({
    defaultValues: safeInitialData || {},
    mode: 'onChange'
  });

  const { handleSubmit, formState: { errors, isDirty }, watch } = methods;

  // Auto-save draft functionality with significant debounce
  useEffect(() => {
    // Disable auto-save for specific form types
    const noAutoSaveFormTypes = ['candidate_information', 'manpower_requisition'];
    
    if ((mode === 'create' || mode === 'edit') && !noAutoSaveFormTypes.includes(formType || '')) {
      let timeoutId: NodeJS.Timeout | null = null;
      
      const subscription = watch((value) => {
        if (onSaveDraft && isDraft && isDirty) {
          // Clear any existing timeout to debounce properly
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Use a longer debounce time to reduce API calls (5 seconds)
          timeoutId = setTimeout(() => {
            handleSaveDraft(value);
            timeoutId = null;
          }, 5000);
        }
      });

      return () => {
        subscription.unsubscribe();
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [watch, mode, onSaveDraft, isDraft, isDirty]);

  const handleSaveDraft = async (data?: any) => {
    if (!onSaveDraft) return;

    try {
      setIsSaving(true);
      let formData = data || methods.getValues();
      // Process form data before saving to ensure all object references are handled properly
      formData = processSafeFormData(formData);
      await onSaveDraft(formData);
      setLastSaved(new Date());
      toast.success('Draft saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (!onSubmit && !onUpdate) return;

    try {
      setIsSubmitting(true);
      
      if (mode === 'create' || mode === 'edit') {
        const handler = mode === 'create' ? onSubmit : onUpdate;
        if (handler) {
          await handler(data);
          setIsDraft(false);
          toast.success(`Form ${mode === 'create' ? 'submitted' : 'updated'} successfully`);
        }
      }
    } catch (error: any) {
      toast.error(`Failed to ${mode === 'create' ? 'submit' : 'update'} form: ` + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (mode === 'view') {
      const status = initialData?.status;
      const statusConfig = {
        draft: { label: 'Draft', variant: 'secondary' as const },
        submitted: { label: 'Submitted', variant: 'default' as const },
        pending: { label: 'Pending Approval', variant: 'default' as const },
        approved: { label: 'Approved', variant: 'default' as const },
        rejected: { label: 'Rejected', variant: 'destructive' as const },
        withdrawn: { label: 'Withdrawn', variant: 'secondary' as const }
      };

      const config = statusConfig[status as keyof typeof statusConfig] || 
                    { label: status || 'Unknown', variant: 'secondary' as const };

      return <Badge variant={config.variant}>{config.label}</Badge>;
    }

    return isDraft ? (
      <Badge variant="secondary">
        <FileTextIcon className="h-3 w-3 mr-1" />
        Draft
      </Badge>
    ) : (
      <Badge variant="default">
        <CheckCircleIcon className="h-3 w-3 mr-1" />
        Submitted
      </Badge>
    );
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* Form Header */}
        {showFormInfo && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {formConfig.title}
                    {getStatusBadge()}
                  </CardTitle>
                  <CardDescription>
                    {formConfig.description}
                  </CardDescription>
                  {initialData?.formId && (
                    <p className="text-sm text-muted-foreground">
                      Form ID: {initialData.formId}
                    </p>
                  )}
                </div>
                
                <div className="text-right text-sm text-muted-foreground">
                  {mode === 'view' && initialData?.createdAt && (
                    <p>Created: {new Date(initialData.createdAt).toLocaleDateString()}</p>
                  )}
                  {lastSaved && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Saved {lastSaved.toLocaleTimeString()}</span>
                    </div>
                  )}
                  {isSaving && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <ClockIcon className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Error Alert */}
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Please correct the following errors before submitting:
              <ul className="mt-2 list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, error]: [string, any]) => (
                  <li key={field} className="text-sm">
                    {field}: {error.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {children}

          {/* Form Actions */}
          {mode !== 'view' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {isDirty ? 'You have unsaved changes' : 'All changes saved'}
                  </div>
                  
                  <div className="flex gap-2">
                    {onSaveDraft && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleSaveDraft()}
                        disabled={isSaving || isLoading}
                      >
                        <SaveIcon className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Draft'}
                      </Button>
                    )}
                    
                    <Button
                      type="submit"
                      disabled={isSubmitting || isLoading || hasErrors}
                    >
                      <SendIcon className="h-4 w-4 mr-2" />
                      {isSubmitting 
                        ? 'Submitting...' 
                        : mode === 'create' 
                          ? 'Submit Form' 
                          : 'Update Form'
                      }
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        {/* Form Information Footer */}
        {showFormInfo && mode === 'view' && initialData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Form Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created By:</span>
                  <p className="text-muted-foreground">
                    {typeof initialData.addedBy === 'string'
                      ? initialData.addedBy
                      : initialData.addedBy?.displayName || initialData.addedBy?.email || initialData.addedBy?.firstName || 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Created Date:</span>
                  <p className="text-muted-foreground">
                    {initialData.createdAt ? new Date(initialData.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <p className="text-muted-foreground">
                    {initialData.updatedAt ? new Date(initialData.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Updated By:</span>
                  <p className="text-muted-foreground">
                    {typeof initialData.updatedBy === 'string'
                      ? initialData.updatedBy
                      : initialData.updatedBy?.displayName || initialData.updatedBy?.email || initialData.updatedBy?.firstName || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {/* PDF Generation Section for submitted forms */}
              {formType && formId && initialData?.status && initialData.status !== 'draft' && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">Export & Documents</h4>
                      <p className="text-xs text-muted-foreground">Generate PDF documents for this form</p>
                    </div>
                    <PDFGenerator
                      formType={formType}
                      formId={formId}
                      formData={initialData}
                      triggerButton={
                        <Button variant="outline" size="sm" className="gap-2">
                          <DownloadIcon className="h-4 w-4" />
                          Generate PDF
                        </Button>
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </FormProvider>
  );
}