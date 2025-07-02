'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import HRMSFormContainer from '@/components/hrms/HRMSFormContainer';
import HRMSFormSection from '@/components/hrms/HRMSFormSection';
import WorkflowNavigation from '@/components/hrms/WorkflowNavigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { getFormConfig } from '@/configs/hrms-forms';
import { useCreateFormMutation, useSaveDraftMutation } from '@/services/endpoints/hrmsApi';
import { useGetDepartmentsQuery, useGetAvailableApproversQuery, useGetCountriesQuery } from '@/services/endpoints/hrmsApi';
import { HRMSFormConfig } from '@/types/hrms';
import { useWorkflow } from '@/contexts/WorkflowContext';

export default function NewHRMSFormPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWorkflow = searchParams.get('workflow') === 'true';
  
  // Workflow context
  const workflow = useWorkflow();
  const { 
    currentStepIndex, 
    getAllPreviousData, 
    updateStepData,
    getStepData 
  } = workflow;

  const formType = params.formType as string;
  const [formId, setFormId] = useState<string | null>(null);
  const [formConfig, setFormConfig] = useState<HRMSFormConfig | null>(null);

  // RTK Query mutations
  const [createForm, { isLoading }] = useCreateFormMutation();
  const [saveDraft] = useSaveDraftMutation();
  
  // Get prefill data from previous workflow steps
  const getInitialFormData = () => {
    if (!isWorkflow) return {};
    
    const previousData = getAllPreviousData();
    const currentStepData = getStepData(currentStepIndex);
    
    console.log('📋 WORKFLOW: Getting initial form data', {
      formType,
      currentStepIndex,
      previousData,
      currentStepData
    });
    
    // Combine previous data with current step data
    return { ...previousData, ...currentStepData };
  };

  // Get fields that should be disabled (already filled in previous steps)
  const getDisabledFields = () => {
    if (!isWorkflow || currentStepIndex === 0) return [];
    
    const previousData = getAllPreviousData();
    const disabledFields = Object.keys(previousData);
    
    console.log('🔒 WORKFLOW: Disabled fields from previous steps', disabledFields);
    return disabledFields;
  };

  // Data for dropdowns
  const { data: departmentsData } = useGetDepartmentsQuery({});
  const { data: approversData } = useGetAvailableApproversQuery({});
  const { data: countriesData } = useGetCountriesQuery({});

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
        
        if (field.name === 'nationality') {
          console.log('🌍 COUNTRIES: Loading nationality options', {
            countriesDataExists: !!countriesData,
            countriesCount: countriesData?.data?.length || 0
          });
          return {
            ...field,
            options: countriesData?.data?.map((country: any) => ({
              label: country.name,
              value: country.name
            })) || []
          };
        }
        
        return field;
      })
    }));

    setFormConfig(updatedConfig);
  }, [formType, router, departmentsData, approversData, countriesData]);

  const handleSaveDraft = async (data: any) => {
    console.log('🟡 DRAFT SAVE: handleSaveDraft called', { formId, formType, isWorkflow });
    try {
      let result;
      if (formId) {
        // Update existing draft using the dedicated saveDraft endpoint
        console.log('🟡 DRAFT SAVE: Updating existing draft');
        result = await saveDraft({ formType, id: formId, data }).unwrap();
      } else {
        // Create new draft using createForm with isDraft: true
        console.log('🟡 DRAFT SAVE: Creating new draft');
        result = await createForm({ formType, data: { ...data, isDraft: true } }).unwrap();
        if (result.success) {
          setFormId(result.data._id);
          // Don't redirect immediately, just update the URL quietly
          window.history.replaceState(
            {},
            '',
            `/dashboard/hrms/forms/${formType}/${result.data._id}/edit${isWorkflow ? '?workflow=true' : ''}`
          );
        }
      }
      
      // Update workflow data if in workflow mode
      if (isWorkflow && result?.success) {
        updateStepData(currentStepIndex, result.data._id, data);
      }
      
      console.log('🟡 DRAFT SAVE: Completed successfully', result);
      // NOTE: No workflow logic here - this is only for draft saves
      // Draft saves should never trigger workflow progression
      
    } catch (error: any) {
      console.error('🔴 DRAFT SAVE: Failed', error);
      throw new Error(error.message || 'Failed to save draft');
    }
  };

  const handleSubmit = async (data: any) => {
    console.log('🟢 FORM SUBMIT: handleSubmit called', { formId, formType });
    try {
      let result;
      
      // First, ensure the form is saved with the submitted data
      if (formId) {
        // Update existing form and mark as submitted (use pending_department_head instead of submitted)
        console.log('🟢 FORM SUBMIT: Updating existing form for submission');
        result = await createForm({ 
          formType, 
          data: { ...data, isDraft: false, status: 'pending_department_head' } 
        }).unwrap();
      } else {
        // Create new form and mark as submitted (use pending_department_head instead of submitted)
        console.log('🟢 FORM SUBMIT: Creating new form for submission');
        result = await createForm({ 
          formType, 
          data: { ...data, isDraft: false, status: 'pending_department_head' } 
        }).unwrap();
      }
      
      // Only proceed with workflow logic if this was successful
      if (result.success) {
        console.log('🟢 FORM SUBMIT: Form submitted successfully, checking workflow');
        // NOTE: Don't show toast here - HRMSFormContainer already shows it
        
        // Check if this is part of a workflow
        if (isWorkflow && workflow.steps.length > 0) {
          console.log('🟢 FORM SUBMIT: Workflow detected, processing continuation');
          
          // Update current step data
          updateStepData(currentStepIndex, result.data._id, data);
          
          if (currentStepIndex < workflow.steps.length - 1) {
            // There are more steps in the workflow
            const nextStep = workflow.steps[currentStepIndex + 1];
            
            // Show option to continue to next step
            const continueToNext = confirm(
              `Form submitted successfully! Would you like to continue to the next step: ${nextStep.stepName}?`
            );
            
            if (continueToNext) {
              // Navigate to next step
              workflow.navigateToStep(currentStepIndex + 1);
              return;
            }
          } else {
            // This is the last step in the workflow
            toast.success('Workflow completed successfully!');
          }
        }
        
        // Default navigation to view the submitted form
        router.push(`/dashboard/hrms/forms/${formType}/${result.data._id}`);
      }
    } catch (error: any) {
      console.error('🔴 FORM SUBMIT: Failed', error);
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
      {/* Workflow Navigation */}
      {isWorkflow && <WorkflowNavigation />}
      
      <HRMSFormContainer
        formConfig={formConfig}
        mode="create"
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        initialData={getInitialFormData()}
        disabledFields={getDisabledFields()}
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