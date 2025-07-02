import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongoose';
import {
  ManpowerRequisition,
  CandidateInformation,
  BusinessTripRequest,
  NewEmployeeJoining,
  AssetsITAccess,
  EmployeeInformation,
  AccommodationTransportConsent,
  BeneficiaryDeclaration,
  NonDisclosureAgreement,
  HRMSFormTypes
} from '@/models/hrms';

import HRMSApprovalFlow from '@/models/hrms/HRMSApprovalFlow.model';
import HRMSApprovalInstance from '@/models/hrms/HRMSApprovalInstance.model';
import User from '@/models/master/User.model';

export class HRMSManager {
  
  // Create or update form with workflow support
  static async createOrUpdateForm(formType: HRMSFormTypes, formData: any, formId?: string) {
    try {
      await dbConnect();

      const FormModel = this.getFormModel(formType);
      if (!FormModel) {
        return {
          success: false,
          message: `Invalid form type: ${formType}`
        };
      }

      let form;
      
      if (formId) {
        // Update existing form
        form = await FormModel.findByIdAndUpdate(
          formId,
          {
            ...formData,
            updatedAt: new Date()
          },
          { new: true, runValidators: true }
        );
      } else {
        // Create new form
        form = new FormModel({
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await form.save();
      }

      return {
        success: true,
        data: form,
        message: formId ? 'Form updated successfully' : 'Form created successfully'
      };

    } catch (error: any) {
      console.error('Error creating/updating form:', error);
      return {
        success: false,
        message: error.message || 'Failed to save form'
      };
    }
  }
  private static getModelByFormType(formType: string) {
    const modelMap: { [key: string]: any } = {
      [HRMSFormTypes.MANPOWER_REQUISITION]: ManpowerRequisition,
      [HRMSFormTypes.CANDIDATE_INFORMATION]: CandidateInformation,
      [HRMSFormTypes.BUSINESS_TRIP_REQUEST]: BusinessTripRequest,
      [HRMSFormTypes.NEW_EMPLOYEE_JOINING]: NewEmployeeJoining,
      [HRMSFormTypes.ASSETS_IT_ACCESS]: AssetsITAccess,
      [HRMSFormTypes.EMPLOYEE_INFORMATION]: EmployeeInformation,
      [HRMSFormTypes.ACCOMMODATION_TRANSPORT_CONSENT]: AccommodationTransportConsent,
      [HRMSFormTypes.BENEFICIARY_DECLARATION]: BeneficiaryDeclaration,
      [HRMSFormTypes.NON_DISCLOSURE_AGREEMENT]: NonDisclosureAgreement
    };
    
    return modelMap[formType];
  }

  // === CRUD Operations ===
  
  // Create new form (draft by default)
  static async createForm(formType: string, formData: any, userId: string) {
    try {
      const Model = this.getModelByFormType(formType);
      if (!Model) {
        throw new Error(`Invalid form type: ${formType}`);
      }

      const newForm = new Model({
        ...formData,
        addedBy: userId,
        updatedBy: userId,
        isDraft: true,
        draftSavedAt: new Date()
      });

      // Skip validation for draft saves
      const skipValidation = formData.isDraft !== false;
      await newForm.save({ validateBeforeSave: !skipValidation });
      
      return {
        success: true,
        data: newForm,
        message: 'Form created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Get form by ID
  static async getFormById(formType: string, formId: string) {
    try {
      const Model = this.getModelByFormType(formType);
      if (!Model) {
        throw new Error(`Invalid form type: ${formType}`);
      }

      const form = await Model.findById(formId);
      if (!form) {
        throw new Error('Form not found');
      }

      return {
        success: true,
        data: form
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Get forms with pagination and filtering
  static async getForms(formType: string, filters: any = {}, pagination: any = {}) {
    try {
      const Model = this.getModelByFormType(formType);
      if (!Model) {
        throw new Error(`Invalid form type: ${formType}`);
      }

      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;

      const skip = (page - 1) * limit;
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Build query filters
      const query: any = {};
      
      if (filters.status) query.status = filters.status;
      if (filters.isDraft !== undefined) query.isDraft = filters.isDraft;
      if (filters.department) query.department = filters.department;
      if (filters.addedBy) query.addedBy = filters.addedBy;
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      // Text search if supported
      if (filters.search) {
        const searchFields = this.getSearchFields(formType);
        query.$or = searchFields.map(field => ({
          [field]: { $regex: filters.search, $options: 'i' }
        }));
      }

      const [forms, total] = await Promise.all([
        Model.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .exec(),
        Model.countDocuments(query)
      ]);

      return {
        success: true,
        data: {
          forms,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Update form
  static async updateForm(formType: string, formId: string, updateData: any, userId: string) {
    try {
      const Model = this.getModelByFormType(formType);
      if (!Model) {
        throw new Error(`Invalid form type: ${formType}`);
      }

      const form = await Model.findById(formId);
      if (!form) {
        throw new Error('Form not found');
      }

      // Update form data
      Object.assign(form, updateData, {
        updatedBy: userId,
        draftSavedAt: form.isDraft ? new Date() : form.draftSavedAt
      });

      // Skip validation for draft saves
      const skipValidation = updateData.isDraft !== false;
      await form.save({ validateBeforeSave: !skipValidation });

      return {
        success: true,
        data: form,
        message: 'Form updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Save as draft
  static async saveDraft(formType: string, formId: string, draftData: any, userId: string) {
    try {
      const result = await this.updateForm(formType, formId, {
        ...draftData,
        isDraft: true,
        draftSavedAt: new Date()
      }, userId);

      if (result.success) {
        result.message = 'Draft saved successfully';
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Submit form (move from draft to submitted)
  static async submitForm(formType: string, formId: string, userId: string) {
    try {
      const Model = this.getModelByFormType(formType);
      if (!Model) {
        throw new Error(`Invalid form type: ${formType}`);
      }

      const form = await Model.findById(formId);
      if (!form) {
        throw new Error('Form not found');
      }

      if (!form.isDraft) {
        throw new Error('Form has already been submitted');
      }

      // Validate required fields
      const validationResult = await this.validateForm(formType, form.toObject());
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Form validation failed',
          errors: validationResult.errors
        };
      }

      // Update form status
      form.isDraft = false;
      form.status = 'submitted';
      form.updatedBy = userId;

      await form.save();

      // Start approval process
      const approvalResult = await this.initiateApprovalProcess(formType, form._id, userId);
      
      return {
        success: true,
        data: form,
        approvalInstance: approvalResult.data,
        message: 'Form submitted successfully and approval process initiated'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Delete form (soft delete)
  static async deleteForm(formType: string, formId: string, userId: string) {
    try {
      const Model = this.getModelByFormType(formType);
      if (!Model) {
        throw new Error(`Invalid form type: ${formType}`);
      }

      const form = await Model.findById(formId);
      if (!form) {
        throw new Error('Form not found');
      }

      // Check if form can be deleted (only drafts or rejected forms)
      if (!form.isDraft && form.status !== 'rejected') {
        throw new Error('Cannot delete submitted forms that are not rejected');
      }

      await Model.findByIdAndDelete(formId);

      return {
        success: true,
        message: 'Form deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // === Approval Workflow ===

  // Initiate approval process
  static async initiateApprovalProcess(formType: string, formId: string, submittedBy: string) {
    try {
      // Find applicable approval flow
      const approvalFlow = await this.findApplicableApprovalFlow(formType, formId);
      if (!approvalFlow) {
        throw new Error(`No approval flow found for form type: ${formType}`);
      }

      // Get form data for context
      const Model = this.getModelByFormType(formType);
      const form = await Model.findById(formId);
      if (!form) {
        throw new Error('Form not found');
      }

      // Create approval instance
      const approvalInstance = new HRMSApprovalInstance({
        formType,
        formId,
        formNumber: form.formId,
        approvalFlowId: approvalFlow._id,
        flowName: approvalFlow.flowName,
        submittedBy,
        submittedDate: new Date(),
        currentStatus: 'in_progress',
        currentStepOrder: 1,
        metadata: {
          formData: form.toObject(),
          departmentContext: form.department,
          locationContext: form.location || null
        },
        stepProgress: []
      });

      // Initialize step progress
      for (const step of approvalFlow.steps) {
        const assignedApprovers = await this.getStepApprovers(step, form);
        
        approvalInstance.stepProgress.push({
          stepOrder: step.stepOrder,
          stepName: step.stepName,
          status: step.stepOrder === 1 ? 'in_progress' : 'pending',
          assignedApprovers,
          approvalActions: [],
          stepStartDate: step.stepOrder === 1 ? new Date() : undefined,
          remindersSent: 0
        });
      }

      approvalInstance.currentStepName = approvalFlow.steps[0]?.stepName;

      await approvalInstance.save();

      // Send notifications to first step approvers
      await this.sendStepNotifications(approvalInstance, 1, 'submission');

      return {
        success: true,
        data: approvalInstance,
        message: 'Approval process initiated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Process approval action
  static async processApprovalAction(
    approvalInstanceId: string,
    stepOrder: number,
    actionType: 'approve' | 'reject' | 'request_changes',
    actionBy: string,
    comments?: string,
    attachments?: string[]
  ) {
    try {
      const approvalInstance = await HRMSApprovalInstance.findById(approvalInstanceId);
      if (!approvalInstance) {
        throw new Error('Approval instance not found');
      }

      const user = await User.findById(actionBy);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate that user can approve this step
      const currentStep = approvalInstance.stepProgress.find(s => s.stepOrder === stepOrder);
      if (!currentStep) {
        throw new Error('Step not found');
      }

      const canApprove = currentStep.assignedApprovers.some(
        approver => approver.userId.toString() === actionBy
      );
      if (!canApprove) {
        throw new Error('User is not authorized to approve this step');
      }

      // Add approval action
      const approvalAction = {
        actionBy: new mongoose.Types.ObjectId(actionBy),
        actionByName: user.displayName || `${user.firstName} ${user.lastName}`,
        actionType,
        actionDate: new Date(),
        comments,
        attachments: attachments || []
      };

      await approvalInstance.addApprovalAction(stepOrder, approvalAction);

      // Handle different action types
      if (actionType === 'approve') {
        // Check if this was the last step
        if (stepOrder === approvalInstance.stepProgress.length) {
          // Final approval
          approvalInstance.currentStatus = 'approved';
          approvalInstance.actualCompletionDate = new Date();
          
          // Update original form status
          await this.updateFormStatus(
            approvalInstance.formType,
            approvalInstance.formId,
            'approved'
          );

          // Trigger post-approval actions
          await this.executePostApprovalActions(approvalInstance);
        } else {
          // Move to next step
          await approvalInstance.moveToNextStep();
          
          // Send notifications to next step approvers
          await this.sendStepNotifications(
            approvalInstance,
            approvalInstance.currentStepOrder,
            'submission'
          );
        }
      } else if (actionType === 'reject') {
        // Rejection - end the approval process
        approvalInstance.currentStatus = 'rejected';
        approvalInstance.actualCompletionDate = new Date();
        
        // Update original form status
        await this.updateFormStatus(
          approvalInstance.formType,
          approvalInstance.formId,
          'rejected'
        );
        
        // Notify submitter of rejection
        await this.sendStepNotifications(approvalInstance, stepOrder, 'rejection');
      }

      await approvalInstance.save();

      return {
        success: true,
        data: approvalInstance,
        message: `Form ${actionType}d successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // === Helper Methods ===

  // Find applicable approval flow for a form
  private static async findApplicableApprovalFlow(formType: string, formId: string) {
    const Model = this.getModelByFormType(formType);
    const form = await Model.findById(formId);
    
    const query: any = {
      formType,
      isActive: true
    };

    // Check for department-specific flows
    if (form.department) {
      query.$or = [
        { applicableDepartments: { $size: 0 } }, // Applies to all departments
        { applicableDepartments: form.department }
      ];
    }

    // Find default flow first, then any applicable flow
    let flow = await HRMSApprovalFlow.findOne({ ...query, isDefault: true });
    if (!flow) {
      flow = await HRMSApprovalFlow.findOne(query);
    }

    return flow;
  }

  // Get approvers for a specific step
  private static async getStepApprovers(step: any, form: any) {
    const approvers: any[] = [];

    switch (step.approverType) {
      case 'specific_user':
        if (step.specificUsers) {
          for (const userId of step.specificUsers) {
            const user = await User.findById(userId);
            if (user) {
              approvers.push({
                userId,
                userName: user.displayName || `${user.firstName} ${user.lastName}`,
                userRole: user.role?.name || ''
              });
            }
          }
        }
        break;

      case 'department_head':
        // Find department head
        const deptHead = await User.findOne({
          'employmentDetails.department': form.department,
          'employmentDetails.designation': { $regex: /head|manager/i }
        });
        if (deptHead) {
          approvers.push({
            userId: deptHead._id,
            userName: deptHead.displayName || `${deptHead.firstName} ${deptHead.lastName}`,
            userRole: 'Department Head'
          });
        }
        break;

      case 'reporting_manager':
        if (form.reportingTo) {
          const manager = await User.findById(form.reportingTo);
          if (manager) {
            approvers.push({
              userId: manager._id,
              userName: manager.displayName || `${manager.firstName} ${manager.lastName}`,
              userRole: 'Reporting Manager'
            });
          }
        }
        break;

      case 'role_based':
        if (step.requiredRoles) {
          const users = await User.find({
            'employmentDetails.role': { $in: step.requiredRoles },
            isActive: true
          });
          for (const user of users) {
            approvers.push({
              userId: user._id,
              userName: user.displayName || `${user.firstName} ${user.lastName}`,
              userRole: user.role?.name || ''
            });
          }
        }
        break;
    }

    return approvers;
  }

  // Update form status
  private static async updateFormStatus(formType: string, formId: string, status: string) {
    const Model = this.getModelByFormType(formType);
    await Model.findByIdAndUpdate(formId, { status });
  }

  // Send notifications for approval steps
  private static async sendStepNotifications(
    approvalInstance: any,
    stepOrder: number,
    notificationType: 'submission' | 'approval' | 'rejection'
  ) {
    // Implementation would integrate with your notification system
    // For now, just log the notification
    console.log(`Sending ${notificationType} notification for step ${stepOrder} of approval instance ${approvalInstance._id}`);
  }

  // Execute post-approval actions
  private static async executePostApprovalActions(approvalInstance: any) {
    // Implement post-approval automation
    // Examples: Create user account, assign assets, etc.
    console.log(`Executing post-approval actions for ${approvalInstance.formType}`);
  }

  // Validate form data
  private static async validateForm(formType: string, formData: any) {
    // Implement form-specific validation logic
    return {
      isValid: true,
      errors: []
    };
  }

  // Get searchable fields for each form type
  private static getSearchFields(formType: string): string[] {
    const searchFieldsMap: { [key: string]: string[] } = {
      [HRMSFormTypes.MANPOWER_REQUISITION]: ['requestedPosition', 'candidateInfo.selectedCandidateName'],
      [HRMSFormTypes.CANDIDATE_INFORMATION]: ['name', 'email', 'positionApplied'],
      [HRMSFormTypes.BUSINESS_TRIP_REQUEST]: ['empOrGuestName', 'placeOfVisit', 'purposeOfVisit'],
      [HRMSFormTypes.NEW_EMPLOYEE_JOINING]: ['empName', 'empId'],
      [HRMSFormTypes.ASSETS_IT_ACCESS]: ['empName'],
      [HRMSFormTypes.EMPLOYEE_INFORMATION]: ['empName', 'empId', 'contacts.emailId'],
      [HRMSFormTypes.ACCOMMODATION_TRANSPORT_CONSENT]: ['empName', 'empId'],
      [HRMSFormTypes.BENEFICIARY_DECLARATION]: ['empName', 'empId', 'nomineeName'],
      [HRMSFormTypes.NON_DISCLOSURE_AGREEMENT]: ['employeeName', 'employeeId']
    };

    return searchFieldsMap[formType] || ['name'];
  }

  // === Analytics and Reporting ===

  // Get HRMS dashboard statistics
  static async getDashboardStats(filters: any = {}) {
    try {
      const stats: any = {};

      // Get stats for each form type
      for (const formType of Object.values(HRMSFormTypes)) {
        const Model = this.getModelByFormType(formType);
        if (Model) {
          const [total, drafts, submitted, approved, rejected] = await Promise.all([
            Model.countDocuments(filters),
            Model.countDocuments({ ...filters, isDraft: true }),
            Model.countDocuments({ ...filters, status: 'submitted' }),
            Model.countDocuments({ ...filters, status: 'approved' }),
            Model.countDocuments({ ...filters, status: 'rejected' })
          ]);

          stats[formType] = {
            total,
            drafts,
            submitted,
            approved,
            rejected,
            pending: submitted - approved - rejected
          };
        }
      }

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Get approval workflow statistics
  static async getApprovalStats(filters: any = {}) {
    try {
      const stats = await HRMSApprovalInstance.aggregate([
        { $match: filters },
        {
          $group: {
            _id: '$formType',
            totalInstances: { $sum: 1 },
            averageProcessingTime: { $avg: '$totalProcessingTimeHours' },
            approvedCount: {
              $sum: { $cond: [{ $eq: ['$currentStatus', 'approved'] }, 1, 0] }
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$currentStatus', 'rejected'] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$currentStatus', 'in_progress'] }, 1, 0] }
            }
          }
        }
      ]);

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }
}

export default HRMSManager;