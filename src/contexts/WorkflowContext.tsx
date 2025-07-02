'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WorkflowStep {
  stepIndex: number;
  stepName: string;
  formType: string;
  formId?: string;
  formData?: any;
  status: 'not_started' | 'in_progress' | 'completed';
  isRequired: boolean;
}

interface WorkflowContextType {
  workflowId: string | null;
  workflowType: string | null;
  currentStepIndex: number;
  steps: WorkflowStep[];
  formData: Record<string, any>;
  
  // Actions
  initializeWorkflow: (workflowData: any) => void;
  updateStepData: (stepIndex: number, formId: string, data: any) => void;
  navigateToStep: (stepIndex: number) => void;
  getStepData: (stepIndex: number) => any;
  getAllPreviousData: () => any;
  isStepAccessible: (stepIndex: number) => boolean;
}

const WorkflowContext = createContext<WorkflowContextType | null>(null);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowType, setWorkflowType] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const router = useRouter();

  // Initialize workflow from sessionStorage on load
  useEffect(() => {
    const workflowData = sessionStorage.getItem('workflowData');
    if (workflowData) {
      try {
        const parsed = JSON.parse(workflowData);
        initializeWorkflow(parsed);
      } catch (error) {
        console.error('Failed to parse workflow data:', error);
      }
    }
  }, []);

  // Save workflow data to sessionStorage whenever it changes
  useEffect(() => {
    if (workflowId) {
      const workflowData = {
        workflowId,
        workflowType,
        currentStepIndex,
        steps,
        formData
      };
      sessionStorage.setItem('workflowData', JSON.stringify(workflowData));
      console.log('💾 WORKFLOW: Saved workflow data to session storage', workflowData);
    }
  }, [workflowId, workflowType, currentStepIndex, steps, formData]);

  const initializeWorkflow = (workflowData: any) => {
    console.log('🚀 WORKFLOW: Initializing workflow', workflowData);
    
    setWorkflowId(workflowData.workflowId || Date.now().toString());
    setWorkflowType(workflowData.workflowType || workflowData.template?.id);
    setCurrentStepIndex(workflowData.currentStepIndex || 0);
    
    if (workflowData.template?.steps) {
      const initialSteps = workflowData.template.steps.map((step: any, index: number) => ({
        stepIndex: index,
        stepName: step.stepName,
        formType: step.formType,
        formId: workflowData.completedSteps?.find((cs: any) => cs.stepIndex === index)?.formId,
        status: index === 0 ? 'in_progress' : 'not_started',
        isRequired: step.isRequired || true
      }));
      setSteps(initialSteps);
    } else if (workflowData.steps) {
      // Use existing steps if template not available
      setSteps(workflowData.steps);
    }
    
    setFormData(workflowData.formData || {});
  };

  const updateStepData = (stepIndex: number, formId: string, data: any) => {
    console.log('📝 WORKFLOW: Updating step data', { stepIndex, formId, data });
    
    // Update form data
    const newFormData = { ...formData };
    newFormData[stepIndex] = data;
    setFormData(newFormData);
    
    // Update step status
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.stepIndex === stepIndex 
          ? { ...step, formId, status: 'completed' as const }
          : step
      )
    );
    
    // Mark next step as accessible
    if (stepIndex + 1 < steps.length) {
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.stepIndex === stepIndex + 1 
            ? { ...step, status: 'in_progress' as const }
            : step
        )
      );
    }
  };

  const navigateToStep = (stepIndex: number) => {
    if (!isStepAccessible(stepIndex)) {
      console.warn('🚫 WORKFLOW: Step not accessible', stepIndex);
      return;
    }
    
    console.log('🔄 WORKFLOW: Navigating to step', stepIndex);
    setCurrentStepIndex(stepIndex);
    
    const step = steps[stepIndex];
    if (step) {
      // ALWAYS navigate to the new form page in workflow mode
      // The workflow context will handle loading existing data if the step is completed
      console.log('🔄 WORKFLOW: Staying in workflow, navigating to new form page for step', step);
      router.push(`/dashboard/hrms/forms/${step.formType}/new?workflow=true`);
    }
  };

  const getStepData = (stepIndex: number) => {
    return formData[stepIndex] || {};
  };

  const getAllPreviousData = () => {
    // Combine all form data from previous steps
    const allData: any = {};
    for (let i = 0; i < currentStepIndex; i++) {
      const stepData = formData[i];
      if (stepData) {
        Object.assign(allData, stepData);
      }
    }
    return allData;
  };

  const isStepAccessible = (stepIndex: number) => {
    if (stepIndex === 0) return true; // First step always accessible
    
    // Step is accessible if previous step is completed
    const previousStep = steps[stepIndex - 1];
    return previousStep?.status === 'completed';
  };

  const value: WorkflowContextType = {
    workflowId,
    workflowType,
    currentStepIndex,
    steps,
    formData,
    initializeWorkflow,
    updateStepData,
    navigateToStep,
    getStepData,
    getAllPreviousData,
    isStepAccessible
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};