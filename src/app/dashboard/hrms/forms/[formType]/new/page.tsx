'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import HRMSFormContainer from '@/components/hrms/HRMSFormContainer';
import HRMSFormSection from '@/components/hrms/HRMSFormSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { getFormConfig } from '@/configs/hrms-forms';
import { useCreateFormMutation, useSaveDraftMutation } from '@/services/endpoints/hrmsApi';
import { useGetDepartmentsQuery, useGetAvailableApproversQuery } from '@/services/endpoints/hrmsApi';
import { HRMSFormConfig } from '@/types/hrms';

export default function NewHRMSFormPage() {
  const params = useParams();
  const router = useRouter();
  const formType = params.formType as string;
  
  const [formConfig, setFormConfig] = useState<HRMSFormConfig | null>(null);
  const [formId, setFormId] = useState<string | null>(null);

  // API hooks
  const [createForm, { isLoading: isCreating }] = useCreateFormMutation();
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
      if (formId) {
        // Update existing draft
        await saveDraft({ formType, id: formId, data }).unwrap();
      } else {
        // Create new draft
        const result = await createForm({ formType, data: { ...data, isDraft: true } }).unwrap();
        if (result.data?._id) {
          setFormId(result.data._id);
          // Update URL to include the form ID for future saves
          router.replace(`/dashboard/hrms/forms/${formType}/${result.data._id}/edit`);
        }
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save draft');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      let result;
      if (formId) {
        // Update and submit existing form
        result = await createForm({ formType, data: { ...data, isDraft: false } }).unwrap();
      } else {
        // Create and submit new form
        result = await createForm({ formType, data: { ...data, isDraft: false } }).unwrap();
      }
      
      if (result.success) {
        toast.success('Form submitted successfully!');
        router.push(`/dashboard/hrms/forms/${formType}/${result.data._id}`);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to submit form');
    }
  };

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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <HRMSFormContainer
        formConfig={formConfig}
        mode="create"
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isLoading={isCreating || isSaving}
        formType={formType}
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