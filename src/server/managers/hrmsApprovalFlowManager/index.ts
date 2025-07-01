import HRMSApprovalFlow from '@/models/hrms/HRMSApprovalFlow.model';
import HRMSApprovalInstance from '@/models/hrms/HRMSApprovalInstance.model';
import User from '@/models/master/User.model';
import Department from '@/models/master/Department.model';
import Role from '@/models/master/Role.model';
import mongoose from 'mongoose';

export class HRMSApprovalFlowManager {

  // === Flow Management ===

  // Create new approval flow
  static async createApprovalFlow(flowData: any, createdBy: string) {
    try {
      // Validate that only one default flow exists per form type
      if (flowData.isDefault) {
        await HRMSApprovalFlow.updateMany(
          { 
            formType: flowData.formType, 
            organisation: flowData.organisation,
            isDefault: true 
          },
          { isDefault: false }
        );
      }

      const approvalFlow = new HRMSApprovalFlow({
        ...flowData,
        createdBy,
        updatedBy: createdBy
      });

      // Validate and sort steps
      if (approvalFlow.steps && approvalFlow.steps.length > 0) {
        approvalFlow.steps.sort((a, b) => a.stepOrder - b.stepOrder);
        
        // Validate step sequence
        const orders = approvalFlow.steps.map(s => s.stepOrder);
        for (let i = 0; i < orders.length; i++) {
          if (orders[i] !== i + 1) {
            throw new Error('Step orders must be sequential starting from 1');
          }
        }
      }

      await approvalFlow.save();

      return {
        success: true,
        data: approvalFlow,
        message: 'Approval flow created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Get approval flow by ID
  static async getApprovalFlowById(flowId: string) {
    try {
      const flow = await HRMSApprovalFlow.findById(flowId);
      if (!flow) {
        throw new Error('Approval flow not found');
      }

      return {
        success: true,
        data: flow
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Get approval flows with filtering
  static async getApprovalFlows(filters: any = {}, pagination: any = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination;

      const skip = (page - 1) * limit;
      const sort: any = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Build query
      const query: any = {};
      if (filters.formType) query.formType = filters.formType;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.isDefault !== undefined) query.isDefault = filters.isDefault;
      if (filters.organisation) query.organisation = filters.organisation;
      if (filters.createdBy) query.createdBy = filters.createdBy;

      const [flows, total] = await Promise.all([
        HRMSApprovalFlow.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .exec(),
        HRMSApprovalFlow.countDocuments(query)
      ]);

      return {
        success: true,
        data: {
          flows,
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

  // Update approval flow
  static async updateApprovalFlow(flowId: string, updateData: any, updatedBy: string) {
    try {
      const flow = await HRMSApprovalFlow.findById(flowId);
      if (!flow) {
        throw new Error('Approval flow not found');
      }

      // Check if this flow is being used in active approvals
      const activeApprovals = await HRMSApprovalInstance.countDocuments({
        approvalFlowId: flowId,
        currentStatus: { $in: ['pending', 'in_progress'] }
      });

      if (activeApprovals > 0) {
        throw new Error('Cannot modify approval flow with active approval instances');
      }

      // Handle default flow changes
      if (updateData.isDefault && updateData.isDefault !== flow.isDefault) {
        await HRMSApprovalFlow.updateMany(
          { 
            formType: flow.formType, 
            organisation: flow.organisation,
            isDefault: true,
            _id: { $ne: flowId }
          },
          { isDefault: false }
        );
      }

      Object.assign(flow, updateData, {
        updatedBy
      });

      // Validate and sort steps if provided
      if (flow.steps && flow.steps.length > 0) {
        flow.steps.sort((a, b) => a.stepOrder - b.stepOrder);
      }

      await flow.save();

      return {
        success: true,
        data: flow,
        message: 'Approval flow updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Delete approval flow
  static async deleteApprovalFlow(flowId: string) {
    try {
      const flow = await HRMSApprovalFlow.findById(flowId);
      if (!flow) {
        throw new Error('Approval flow not found');
      }

      // Check if flow is being used
      const usageCount = await HRMSApprovalInstance.countDocuments({
        approvalFlowId: flowId
      });

      if (usageCount > 0) {
        throw new Error('Cannot delete approval flow that has been used in approval instances');
      }

      await HRMSApprovalFlow.findByIdAndDelete(flowId);

      return {
        success: true,
        message: 'Approval flow deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Activate/Deactivate approval flow
  static async toggleApprovalFlowStatus(flowId: string, isActive: boolean, updatedBy: string) {
    try {
      const flow = await HRMSApprovalFlow.findByIdAndUpdate(
        flowId,
        { isActive, updatedBy },
        { new: true }
      );

      if (!flow) {
        throw new Error('Approval flow not found');
      }

      return {
        success: true,
        data: flow,
        message: `Approval flow ${isActive ? 'activated' : 'deactivated'} successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // === Flow Designer Support ===

  // Save flow design (React Flow data)
  static async saveFlowDesign(flowId: string, designData: any, updatedBy: string) {
    try {
      const flow = await HRMSApprovalFlow.findById(flowId);
      if (!flow) {
        throw new Error('Approval flow not found');
      }

      flow.flowDesign = designData;
      flow.updatedBy = updatedBy;

      await flow.save();

      return {
        success: true,
        data: flow,
        message: 'Flow design saved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Convert flow design to steps configuration
  static async convertDesignToSteps(designData: any) {
    try {
      const steps: any[] = [];

      // Sort nodes by position or order
      const sortedNodes = designData.nodes
        .filter((node: any) => node.type !== 'start' && node.type !== 'end')
        .sort((a: any, b: any) => a.data.stepOrder - b.data.stepOrder);

      for (let i = 0; i < sortedNodes.length; i++) {
        const node = sortedNodes[i];
        const step = {
          stepOrder: i + 1,
          stepName: node.data.label || `Step ${i + 1}`,
          stepDescription: node.data.description,
          approverType: node.data.approverType || 'specific_user',
          specificUsers: node.data.approvers || [],
          isRequired: node.data.isRequired !== false,
          allowParallelApproval: node.data.allowParallelApproval || false,
          requireAllApprovers: node.data.requireAllApprovers !== false,
          timeoutDays: node.data.timeoutDays,
          notifyOnSubmission: node.data.notifyOnSubmission !== false,
          notifyOnApproval: node.data.notifyOnApproval !== false,
          notifyOnRejection: node.data.notifyOnRejection !== false
        };

        steps.push(step);
      }

      return {
        success: true,
        data: steps
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // === Approver Management ===

  // Get available approvers for flow configuration
  static async getAvailableApprovers(filters: any = {}) {
    try {
      const query: any = { isActive: true };
      
      if (filters.department) {
        query['employmentDetails.department'] = filters.department;
      }
      
      if (filters.role) {
        query['employmentDetails.role'] = filters.role;
      }

      if (filters.designation) {
        query['employmentDetails.designation'] = filters.designation;
      }

      const users = await User.find(query)
        .select('firstName lastName displayName email empId employmentDetails')
        .populate('employmentDetails.department', 'name')
        .populate('employmentDetails.designation', 'name')
        .populate('employmentDetails.role', 'name')
        .sort('firstName lastName');

      return {
        success: true,
        data: users
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Get departments for flow scope configuration
  static async getDepartments() {
    try {
      const departments = await Department.find({ isActive: true })
        .select('name depId')
        .sort('name');

      return {
        success: true,
        data: departments
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Get roles for role-based approval configuration
  static async getRoles() {
    try {
      const roles = await Role.find({ isActive: true })
        .select('name')
        .sort('name');

      return {
        success: true,
        data: roles
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // === Flow Testing and Validation ===

  // Test approval flow configuration
  static async testApprovalFlow(flowId: string, sampleFormData: any) {
    try {
      const flow = await HRMSApprovalFlow.findById(flowId);
      if (!flow) {
        throw new Error('Approval flow not found');
      }

      const testResults: any = {
        flowId,
        flowName: flow.flowName,
        isValid: true,
        errors: [],
        warnings: [],
        steps: []
      };

      // Test each step
      for (const step of flow.steps) {
        const stepTest: any = {
          stepOrder: step.stepOrder,
          stepName: step.stepName,
          approverType: step.approverType,
          approvers: [],
          issues: []
        };

        try {
          // Get approvers for this step using sample data
          const approvers = await this.getStepApproversForTest(step, sampleFormData);
          stepTest.approvers = approvers;

          if (approvers.length === 0) {
            stepTest.issues.push('No approvers found for this step');
            testResults.isValid = false;
          }

        } catch (error: any) {
          stepTest.issues.push(error.message);
          testResults.isValid = false;
        }

        testResults.steps.push(stepTest);
      }

      // Check for overall flow issues
      if (flow.steps.length === 0) {
        testResults.errors.push('Flow has no steps defined');
        testResults.isValid = false;
      }

      return {
        success: true,
        data: testResults
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        error
      };
    }
  }

  // Helper method to get approvers for testing
  private static async getStepApproversForTest(step: any, sampleFormData: any) {
    const approvers: any[] = [];

    switch (step.approverType) {
      case 'specific_user':
        if (step.specificUsers && step.specificUsers.length > 0) {
          const users = await User.find({ 
            _id: { $in: step.specificUsers },
            isActive: true 
          }).select('firstName lastName displayName email');
          
          approvers.push(...users.map(user => ({
            userId: user._id,
            userName: user.displayName || `${user.firstName} ${user.lastName}`,
            email: user.email,
            type: 'specific_user'
          })));
        }
        break;

      case 'department_head':
        // Mock department head lookup
        if (sampleFormData.department) {
          const deptHead = await User.findOne({
            'employmentDetails.department': sampleFormData.department,
            isActive: true
          }).select('firstName lastName displayName email');
          
          if (deptHead) {
            approvers.push({
              userId: deptHead._id,
              userName: deptHead.displayName || `${deptHead.firstName} ${deptHead.lastName}`,
              email: deptHead.email,
              type: 'department_head'
            });
          }
        }
        break;

      case 'role_based':
        if (step.requiredRoles && step.requiredRoles.length > 0) {
          const users = await User.find({
            'employmentDetails.role': { $in: step.requiredRoles },
            isActive: true
          }).select('firstName lastName displayName email');

          approvers.push(...users.map(user => ({
            userId: user._id,
            userName: user.displayName || `${user.firstName} ${user.lastName}`,
            email: user.email,
            type: 'role_based'
          })));
        }
        break;
    }

    return approvers;
  }

  // === Flow Analytics ===

  // Get flow usage statistics
  static async getFlowUsageStats(flowId: string) {
    try {
      const flow = await HRMSApprovalFlow.findById(flowId);
      if (!flow) {
        throw new Error('Approval flow not found');
      }

      const stats = await HRMSApprovalInstance.aggregate([
        { $match: { approvalFlowId: new mongoose.Types.ObjectId(flowId) } },
        {
          $group: {
            _id: null,
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
            },
            withdrawnCount: {
              $sum: { $cond: [{ $eq: ['$currentStatus', 'withdrawn'] }, 1, 0] }
            }
          }
        }
      ]);

      const flowStats = stats[0] || {
        totalInstances: 0,
        averageProcessingTime: 0,
        approvedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        withdrawnCount: 0
      };

      // Calculate approval rate
      if (flowStats.totalInstances > 0) {
        flowStats.approvalRate = (flowStats.approvedCount / (flowStats.approvedCount + flowStats.rejectedCount)) * 100;
      } else {
        flowStats.approvalRate = 0;
      }

      return {
        success: true,
        data: {
          flow: {
            _id: flow._id,
            flowName: flow.flowName,
            formType: flow.formType,
            isActive: flow.isActive
          },
          statistics: flowStats
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

  // Get step-wise performance analytics
  static async getStepPerformanceStats(flowId: string) {
    try {
      const stats = await HRMSApprovalInstance.aggregate([
        { $match: { approvalFlowId: new mongoose.Types.ObjectId(flowId) } },
        { $unwind: '$stepProgress' },
        {
          $group: {
            _id: {
              stepOrder: '$stepProgress.stepOrder',
              stepName: '$stepProgress.stepName'
            },
            totalSteps: { $sum: 1 },
            averageDuration: { $avg: '$stepProgress.stepDurationHours' },
            approvedSteps: {
              $sum: { $cond: [{ $eq: ['$stepProgress.status', 'approved'] }, 1, 0] }
            },
            rejectedSteps: {
              $sum: { $cond: [{ $eq: ['$stepProgress.status', 'rejected'] }, 1, 0] }
            },
            pendingSteps: {
              $sum: { $cond: [{ $in: ['$stepProgress.status', ['pending', 'in_progress']] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.stepOrder': 1 } }
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

  // Clone approval flow
  static async cloneApprovalFlow(flowId: string, newFlowName: string, createdBy: string) {
    try {
      const originalFlow = await HRMSApprovalFlow.findById(flowId);
      if (!originalFlow) {
        throw new Error('Original approval flow not found');
      }

      const clonedData = originalFlow.toObject();
      delete clonedData._id;
      delete clonedData.createdAt;
      delete clonedData.updatedAt;
      delete clonedData.__v;

      const clonedFlow = new HRMSApprovalFlow({
        ...clonedData,
        flowName: newFlowName,
        isDefault: false, // Cloned flows are never default
        createdBy,
        updatedBy: createdBy,
        stats: {
          totalSubmissions: 0,
          averageProcessingTime: 0,
          approvalRate: 0
        }
      });

      await clonedFlow.save();

      return {
        success: true,
        data: clonedFlow,
        message: 'Approval flow cloned successfully'
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

export default HRMSApprovalFlowManager;