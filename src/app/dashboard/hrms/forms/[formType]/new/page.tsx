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
      let result;
      if (formId) {
        // Update existing draft using the dedicated saveDraft endpoint
        result = await saveDraft({ formType, id: formId, data }).unwrap();
      } else {
        // Create new draft using createForm with isDraft: true
        result = await createForm({ formType, data: { ...data, isDraft: true } }).unwrap();
        if (result.success) {
          setFormId(result.data._id);
          // Don't redirect immediately, just update the URL quietly
          window.history.replaceState(
            {},
            '',
            `/dashboard/hrms/forms/${formType}/${result.data._id}/edit`
          );
        }
      }
      
      // NOTE: No workflow logic here - this is only for draft saves
      // Draft saves should never trigger workflow progression
      
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save draft');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      let result;
      
      // First, ensure the form is saved with the submitted data
      if (formId) {
        // Update existing form and mark as submitted
        result = await createForm({ 
          formType, 
          data: { ...data, isDraft: false, status: 'submitted' } 
        }).unwrap();
      } else {
        // Create new form and mark as submitted
        result = await createForm({ 
          formType, 
          data: { ...data, isDraft: false, status: 'submitted' } 
        }).unwrap();
      }
      
      // Only proceed with workflow logic if this was an actual form submission (not draft save)
      if (result.success && data.isDraft === false) {
        toast.success('Form submitted successfully!');
        
        // Check if this is part of a workflow
        const workflowData = sessionStorage.getItem('workflowData');
        if (workflowData) {
          const parsedWorkflowData = JSON.parse(workflowData);
          const currentStepIndex = parsedWorkflowData.template.steps.findIndex((step: any) => step.formType === formType);
          
          if (currentStepIndex < parsedWorkflowData.template.steps.length - 1) {
            // There are more steps in the workflow
            const nextStep = parsedWorkflowData.template.steps[currentStepIndex + 1];
            
            // Show option to continue to next step
            const continueToNext = confirm(
              `Form submitted successfully! Would you like to continue to the next step: ${nextStep.stepName}?`
            );
            
            if (continueToNext) {
              // Update workflow data with current form info
              const updatedWorkflowData = {
                ...parsedWorkflowData,
                completedSteps: [...(parsedWorkflowData.completedSteps || []), {
                  stepIndex: currentStepIndex,
                  formType: formType,
                  formId: result.data._id,
                  completedAt: new Date().toISOString()
                }]
              };
              sessionStorage.setItem('workflowData', JSON.stringify(updatedWorkflowData));
              
              // Navigate to next step
              router.push(`/dashboard/hrms/forms/${nextStep.formType}/new?workflow=true`);
              return;
            }
          } else {
            // This is the last step in the workflow
            toast.success('Workflow completed successfully!');
            sessionStorage.removeItem('workflowData');
          }
        }
        
        // Default navigation to view the submitted form
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