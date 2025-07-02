import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongoose';
import HRMSWorkflowInstanceModel from '@/models/hrms/HRMSWorkflowInstance.model';
import HRMSManager from '../hrmsManager';
import { HRMSFormTypes } from '@/types/hrms';
import { HRMS_WORKFLOW_TEMPLATES } from '@/types/workflow';

export interface CreateWorkflowInstanceParams {
  workflowType: 'recruitment' | 'onboarding' | 'business_travel' | 'custom';
  triggerFormType: HRMSFormTypes;
  triggerFormId: string;
  metadata: {
    candidateName?: string;
    employeeName?: string;
    position?: string;
    department?: string;
    expectedEndDate?: Date;
  };
  createdBy: string;
}

export interface GetWorkflowInstancesParams {
  status?: string;
  workflowType?: string;
  candidateId?: string;
  employeeId?: string;
  page: number;
  limit: number;
  userId: string;
}

export interface AdvanceWorkflowStepParams {
  workflowInstanceId: string;
  stepId: string;
  formData?: any;
  comments?: string;
  skipValidation?: boolean;
  userId: string;
}

class HRMSWorkflowManager {
  
  static async createWorkflowInstance(params: CreateWorkflowInstanceParams) {
    try {
      await dbConnect();

      const { workflowType, triggerFormType, triggerFormId, metadata, createdBy } = params;

      // Get workflow template
      const template = this.getWorkflowTemplate(workflowType);
      if (!template) {
        return {
          success: false,
          message: `Workflow template not found for type: ${workflowType}`
        };
      }

      // Verify trigger form exists
      const triggerForm = await HRMSManager.getFormById(triggerFormType, triggerFormId);
      if (!triggerForm.success) {
        return {
          success: false,
          message: 'Trigger form not found'
        };
      }

      // Create workflow instance
      const workflowInstance = new HRMSWorkflowInstanceModel({
        workflowId: `${workflowType}_${Date.now()}`,
        workflowName: template.workflowName,
        workflowType,
        candidateId: metadata.candidateName ? `candidate_${Date.now()}` : undefined,
        employeeId: metadata.employeeName ? `employee_${Date.now()}` : undefined,
        status: 'active',
        currentStep: template.steps[0].id,
        completedSteps: [],
        stepsData: {
          [template.steps[0].id]: triggerForm.data.formData
        },
        metadata: {
          ...metadata,
          startDate: new Date(),
          expectedEndDate: metadata.expectedEndDate || this.calculateExpectedEndDate(template.steps.length)
        },
        startedAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        assignedTo: [createdBy]
      });

      const savedInstance = await workflowInstance.save();

      return {
        success: true,
        data: savedInstance,
        message: 'Workflow instance created successfully'
      };

    } catch (error: any) {
      console.error('Error creating workflow instance:', error);
      return {
        success: false,
        message: error.message || 'Failed to create workflow instance'
      };
    }
  }

  static async getWorkflowInstances(params: GetWorkflowInstancesParams) {
    try {
      await dbConnect();

      const { status, workflowType, candidateId, employeeId, page, limit, userId } = params;
      
      const query: any = {};
      
      if (status) query.status = status;
      if (workflowType) query.workflowType = workflowType;
      if (candidateId) query.candidateId = candidateId;
      if (employeeId) query.employeeId = employeeId;
      
      // Filter by user access (created by or assigned to)
      query.$or = [
        { createdBy: userId },
        { assignedTo: { $in: [userId] } }
      ];

      const skip = (page - 1) * limit;

      const [instances, total] = await Promise.all([
        HRMSWorkflowInstanceModel
          .find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        HRMSWorkflowInstanceModel.countDocuments(query)
      ]);

      return {
        success: true,
        data: {
          instances,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error: any) {
      console.error('Error fetching workflow instances:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch workflow instances'
      };
    }
  }

  static async getWorkflowInstanceById(instanceId: string) {
    try {
      await dbConnect();

      const instance = await HRMSWorkflowInstanceModel.findById(instanceId).lean();
      
      if (!instance) {
        return {
          success: false,
          message: 'Workflow instance not found'
        };
      }

      // Get workflow template for step details
      const template = this.getWorkflowTemplate(instance.workflowType);
      const progress = this.calculateWorkflowProgress(instance, template);

      return {
        success: true,
        data: {
          ...instance,
          template,
          progress
        }
      };

    } catch (error: any) {
      console.error('Error fetching workflow instance:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch workflow instance'
      };
    }
  }

  static async advanceWorkflowStep(params: AdvanceWorkflowStepParams) {
    try {
      await dbConnect();

      const { workflowInstanceId, stepId, formData, comments, skipValidation, userId } = params;

      const instance = await HRMSWorkflowInstanceModel.findById(workflowInstanceId);
      if (!instance) {
        return {
          success: false,
          message: 'Workflow instance not found'
        };
      }

      const template = this.getWorkflowTemplate(instance.workflowType);
      if (!template) {
        return {
          success: false,
          message: 'Workflow template not found'
        };
      }

      // Validate current step
      if (instance.currentStep !== stepId) {
        return {
          success: false,
          message: 'Cannot advance step - not the current step'
        };
      }

      // Find current and next steps
      const currentStepIndex = template.steps.findIndex(step => step.id === stepId);
      const currentStep = template.steps[currentStepIndex];
      const nextStep = template.steps[currentStepIndex + 1];

      if (!currentStep) {
        return {
          success: false,
          message: 'Current step not found in template'
        };
      }

      // Validate form data if required
      if (!skipValidation && currentStep.isRequired && (!formData || Object.keys(formData).length === 0)) {
        return {
          success: false,
          message: 'Form data is required for this step'
        };
      }

      // Save form data for this step
      if (formData) {
        // Save/update the form
        const formResult = await HRMSManager.createOrUpdateForm(
          currentStep.formType,
          {
            formData,
            status: 'submitted',
            submittedBy: userId,
            workflowInstanceId: workflowInstanceId,
            workflowStepId: stepId
          }
        );

        if (!formResult.success) {
          return {
            success: false,
            message: 'Failed to save form data'
          };
        }

        instance.stepsData[stepId] = formData;
      }

      // Mark current step as completed
      if (!instance.completedSteps.includes(stepId)) {
        instance.completedSteps.push(stepId);
      }

      // Advance to next step or complete workflow
      if (nextStep) {
        instance.currentStep = nextStep.id;
        instance.status = 'active';
      } else {
        instance.status = 'completed';
        instance.completedAt = new Date();
      }

      instance.updatedAt = new Date();
      
      // Add step completion log
      if (!instance.stepLogs) {
        instance.stepLogs = [];
      }
      
      instance.stepLogs.push({
        stepId,
        stepName: currentStep.stepName,
        action: 'completed',
        userId,
        timestamp: new Date(),
        comments
      });

      await instance.save();

      return {
        success: true,
        data: instance,
        message: nextStep ? 'Advanced to next step' : 'Workflow completed'
      };

    } catch (error: any) {
      console.error('Error advancing workflow step:', error);
      return {
        success: false,
        message: error.message || 'Failed to advance workflow step'
      };
    }
  }

  static async updateWorkflowInstance(instanceId: string, updateData: any, userId: string) {
    try {
      await dbConnect();

      const instance = await HRMSWorkflowInstanceModel.findById(instanceId);
      if (!instance) {
        return {
          success: false,
          message: 'Workflow instance not found'
        };
      }

      // Check permissions
      if (instance.createdBy !== userId && !instance.assignedTo.includes(userId)) {
        return {
          success: false,
          message: 'Insufficient permissions to update workflow'
        };
      }

      // Update allowed fields
      const allowedFields = ['status', 'metadata', 'assignedTo'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          instance[field] = updateData[field];
        }
      });

      instance.updatedAt = new Date();
      await instance.save();

      return {
        success: true,
        data: instance,
        message: 'Workflow instance updated successfully'
      };

    } catch (error: any) {
      console.error('Error updating workflow instance:', error);
      return {
        success: false,
        message: error.message || 'Failed to update workflow instance'
      };
    }
  }

  // Helper methods
  private static getWorkflowTemplate(workflowType: string) {
    switch (workflowType) {
      case 'recruitment':
        return HRMS_WORKFLOW_TEMPLATES.RECRUITMENT;
      case 'onboarding':
        return HRMS_WORKFLOW_TEMPLATES.ONBOARDING;
      case 'business_travel':
        return HRMS_WORKFLOW_TEMPLATES.BUSINESS_TRAVEL;
      default:
        return null;
    }
  }

  private static calculateExpectedEndDate(stepCount: number): Date {
    const averageDaysPerStep = 3;
    const totalDays = stepCount * averageDaysPerStep;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + totalDays);
    return endDate;
  }

  private static calculateWorkflowProgress(instance: any, template: any) {
    if (!template) {
      return {
        totalSteps: 0,
        completedSteps: 0,
        progressPercentage: 0,
        currentStepName: 'Unknown',
        isOnTrack: true
      };
    }

    const totalSteps = template.steps.length;
    const completedSteps = instance.completedSteps.length;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
    
    const currentStep = template.steps.find((step: any) => step.id === instance.currentStep);
    const currentStepName = currentStep ? currentStep.stepName : 'Unknown';

    // Simple on-track calculation
    const daysSinceStart = Math.floor((new Date().getTime() - new Date(instance.startedAt).getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(daysSinceStart / (totalSteps * 3), 1); // 3 days per step average
    const actualProgress = completedSteps / totalSteps;
    const isOnTrack = actualProgress >= (expectedProgress * 0.8); // 80% threshold

    return {
      totalSteps,
      completedSteps,
      progressPercentage,
      currentStepName,
      isOnTrack,
      daysSinceStart
    };
  }
}

export default HRMSWorkflowManager;