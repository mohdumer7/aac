'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import HRMSFormContainer from '@/components/hrms/HRMSFormContainer';
import HRMSFormSection from '@/components/hrms/HRMSFormSection';
import WorkflowNavigation from '@/components/hrms/WorkflowNavigation';
import PDFGenerator from '@/components/hrms/PDFGenerator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { getFormConfig } from '@/configs/hrms-forms';
import { useCreateFormMutation, useSaveDraftMutation } from '@/services/endpoints/hrmsApi';
import { useGetDepartmentsQuery, useGetAvailableApproversQuery, useGetCountriesQuery, useGetRolesQuery, useGetOrganizationsQuery, useGetLocationsQuery } from '@/services/endpoints/hrmsApi';
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
  
  // Debug: Log workflow state when component loads
  useEffect(() => {
    if (isWorkflow) {
      console.log('📋 WORKFLOW: Form page loaded', { 
        formType, 
        currentStepIndex,
        totalSteps: workflow.steps.length,
        expectedFormType: workflow.steps[currentStepIndex]?.formType
      });
      
      // Check if current step has a formId (completed step)
      const currentStep = workflow.steps[currentStepIndex];
      if (currentStep?.formId) {
        console.log('📝 WORKFLOW: Current step has existing form, setting formId', currentStep.formId);
        setFormId(currentStep.formId);
      } else {
        console.log('📝 WORKFLOW: Current step is new, clearing formId');
        setFormId(null);
      }
    }
  }, [isWorkflow, formType, currentStepIndex, workflow.steps.length]);

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
  const { data: rolesData } = useGetRolesQuery({});
  const { data: organizationsData } = useGetOrganizationsQuery({});
  const { data: locationsData } = useGetLocationsQuery({});

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
        
        if (field.name === 'nationality' || field.name === 'familyDetails.fatherNationality' || field.name === 'familyDetails.motherNationality' || field.name === 'familyDetails.spouseNationality') {
          console.log('🌍 COUNTRIES: Loading nationality options', {
            fieldName: field.name,
            countriesDataExists: !!countriesData,
            countriesCount: countriesData?.data?.length || 0
          });
          return {
            ...field,
            options: countriesData?.data?.map((country: any) => ({
              label: country.name,
              value: country._id  // Use ObjectId instead of name
            })) || []
          };
        }

        if (field.name === 'designation') {
          console.log('👔 ROLES: Loading designation options', {
            rolesDataExists: !!rolesData,
            rolesCount: rolesData?.data?.length || 0
          });
          return {
            ...field,
            options: rolesData?.data?.map((role: any) => ({
              label: role.name,
              value: role._id
            })) || []
          };
        }

        if (field.name === 'location') {
          console.log('📍 LOCATIONS: Loading location options', {
            locationsDataExists: !!locationsData,
            locationsCount: locationsData?.data?.length || 0
          });
          return {
            ...field,
            options: locationsData?.data?.map((location: any) => ({
              label: location.name,
              value: location._id
            })) || []
          };
        }
        
        return field;
      })
    }));

    setFormConfig(updatedConfig);
  }, [formType, router, departmentsData, approversData, countriesData, rolesData, organizationsData, locationsData]);

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
    console.log('🟢 FORM SUBMIT: handleSubmit called', { formId, formType, isWorkflow });
    
    // If in workflow mode, prevent any default navigation first
    if (isWorkflow) {
      console.log('🚫 WORKFLOW: Blocking any potential redirects');
    }
    
    try {
      let result;
      
      // First, ensure the form is saved with the submitted data
      if (formId) {
        // Update existing form and mark as submitted (use appropriate status for each form type)
        console.log('🟢 FORM SUBMIT: Updating existing form for submission');
        const submissionStatus = formType === 'manpower_requisition' ? 'pending_department_head' : 'submitted';
        result = await createForm({ 
          formType, 
          data: { ...data, isDraft: false, status: submissionStatus } 
        }).unwrap();
      } else {
        // Create new form and mark as submitted (use appropriate status for each form type)
        console.log('🟢 FORM SUBMIT: Creating new form for submission');
        const submissionStatus = formType === 'manpower_requisition' ? 'pending_department_head' : 'submitted';
        result = await createForm({ 
          formType, 
          data: { ...data, isDraft: false, status: submissionStatus } 
        }).unwrap();
      }
      
      console.log('🟢 FORM SUBMIT: API Result', result);
      
      // Only proceed with workflow logic if this was successful
      if (result.success) {
        console.log('🟢 FORM SUBMIT: Form submitted successfully, checking workflow');
        
        // Check if this is part of a workflow - HANDLE IMMEDIATELY
        if (isWorkflow && workflow.steps.length > 0) {
          console.log('🟢 FORM SUBMIT: Workflow detected - immediate processing');
          console.log('🔄 WORKFLOW: Current step index:', currentStepIndex);
          console.log('🔄 WORKFLOW: Total steps:', workflow.steps.length);
          
          // Update current step data
          updateStepData(currentStepIndex, result.data._id, data);
          
          if (currentStepIndex < workflow.steps.length - 1) {
            // Get next step info
            const nextStepIndex = currentStepIndex + 1;
            const nextStep = workflow.steps[nextStepIndex];
            
            console.log('🔄 WORKFLOW: Advancing to step', nextStepIndex, nextStep);
            console.log('🔄 WORKFLOW: All workflow steps:', workflow.steps);
            
            // CRITICAL: Update the workflow context current step BEFORE navigation
            // We need to ensure the context reflects the new step
            
            // Use a small delay to ensure the step data update completes first
            setTimeout(() => {
              console.log('🚀 WORKFLOW: Navigating to next step after data update');
              workflow.navigateToStep(nextStepIndex);
            }, 50);
            
            return; // Stop all further execution
          } else {
            // Last step - redirect to workflows page
            console.log('🎉 WORKFLOW: Completed - redirecting to workflows');
            router.push('/dashboard/hrms/workflows');
            return;
          }
        } else {
          console.log('🔍 WORKFLOW: Not in workflow mode or no steps', { isWorkflow, stepsLength: workflow.steps.length });
        }
        
        // Only if NOT in workflow mode
        if (!isWorkflow) {
          console.log('📄 NON-WORKFLOW: Redirecting to view page');
          router.push(`/dashboard/hrms/forms/${formType}/${result.data._id}`);
        }
      } else {
        console.error('🔴 FORM SUBMIT: Form submission failed', result);
      }
    } catch (error: any) {
      console.error('🔴 FORM SUBMIT: Exception during submission', error);
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