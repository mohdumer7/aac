'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import HRMSFormContainer from '@/components/hrms/HRMSFormContainer';
import HRMSFormSection from '@/components/hrms/HRMSFormSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import PDFGenerator from '@/components/hrms/PDFGenerator';
import { getFormConfig } from '@/configs/hrms-forms';
import { 
  useGetFormByIdQuery,
  useUpdateFormMutation, 
  useSaveDraftMutation,
  useGetDepartmentsQuery, 
  useGetAvailableApproversQuery 
} from '@/services/endpoints/hrmsApi';
import { HRMSFormConfig } from '@/types/hrms';

export default function EditHRMSFormPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWorkflow = searchParams.get('workflow') === 'true';
  const formType = params.formType as string;
  const formId = params.id as string;
  
  const [formConfig, setFormConfig] = useState<HRMSFormConfig | null>(null);

  // API hooks
  const { 
    data: formData, 
    isLoading: isLoadingForm, 
    error: formError 
  } = useGetFormByIdQuery({ formType, id: formId });
  
  const [updateForm, { isLoading: isUpdating }] = useUpdateFormMutation();
  const [saveDraft, { isLoading: isSaving }] = useSaveDraftMutation();
  
  // Data for dropdowns
  const { data: departmentsData } = useGetDepartmentsQuery({});
  const { data: approversData } = useGetAvailableApproversQuery({});

  useEffect(() => {
    const config = getFormConfig(formType);
    if (!config) {
      toast.error('Invalid form type');
      router.push('/dashboard/hrms');
      return;
    }

    // Populate dropdown options
    const updatedConfig = { ...config };
    updatedConfig.sections = updatedConfig.sections.map(section => ({
      ...section,
      fields: section.fields.map(field => {
        if (field.name === 'department' || field.name === 'departmentSection') {
          return {
            ...field,
            options: departmentsData?.data?.map((dept: any) => ({
              label: dept.name,
              value: dept._id
            })) || []
          };
        }
        
        if (field.name === 'requestedBy' || field.name === 'reportingTo') {
          return {
            ...field,
            options: approversData?.data?.map((user: any) => ({
              label: user.displayName || `${user.firstName} ${user.lastName}`,
              value: user._id
            })) || []
          };
        }
        
        return field;
      })
    }));

    setFormConfig(updatedConfig);
  }, [formType, router, departmentsData, approversData]);

  const handleSaveDraft = async (data: any) => {
    try {
      await saveDraft({ formType, id: formId, data }).unwrap();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save draft');
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      const result = await updateForm({ formType, id: formId, data }).unwrap();
      
      if (result.success) {
        toast.success('Form updated successfully!');
        
        // Don't redirect to view page if in workflow mode
        if (!isWorkflow) {
          router.push(`/dashboard/hrms/forms/${formType}/${formId}`);
        }
        // If in workflow mode, let the workflow context handle navigation
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update form');
    }
  };

  if (isLoadingForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (formError || !formData?.success) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Form not found or you don't have permission to edit it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Invalid or unsupported form type: {formType}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const form = formData.data;

  // Check if form can be edited
  if (!form.isDraft && form.status !== 'rejected') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            This form cannot be edited as it has been submitted and is {form.status}.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <HRMSFormContainer
        formConfig={formConfig}
        initialData={form}
        mode="edit"
        onSaveDraft={handleSaveDraft}
        onUpdate={handleUpdate}
        isLoading={isUpdating || isSaving}
        formType={formType}
        formId={formId}
      >
        {formConfig.sections.map((section) => (
          <HRMSFormSection
            key={section.id}
            section={section}
          />
        ))}
      </HRMSFormContainer>
    </div>
  );
}