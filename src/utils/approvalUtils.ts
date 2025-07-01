import mongoose from "mongoose";
import { connectToDB } from "@/lib/mongoose";
import ApprovalFlow from "@/models/approvals/ApprovalFlow.model";
import ApprovalInstance from "@/models/approvals/ApprovalInstance.model";
import User from "@/models/master/User.model";

/**
 * Get the appropriate approval flow for an entity type
 */
export async function getApprovalFlow(entityType: string) {
  await connectToDB();
  const approvalFlow = await ApprovalFlow.findOne({ 
    entityType, 
    isActive: true 
  }).sort({ createdAt: -1 });
  
  return approvalFlow;
}

/**
 * Start a new approval process for an entity
 */
export async function createApprovalInstance(
  entityId: string | mongoose.Types.ObjectId,
  entityType: string,
  initiatorId: string | mongoose.Types.ObjectId,
  customApprovalFlow?: string | mongoose.Types.ObjectId
) {
  await connectToDB();
  
  // Find the appropriate approval flow
  const approvalFlow = customApprovalFlow 
    ? await ApprovalFlow.findById(customApprovalFlow)
    : await getApprovalFlow(entityType);
  
  if (!approvalFlow) {
    throw new Error(`No approval flow defined for entity type: ${entityType}`);
  }
  
  // Create step history from the flow definition
  const stepHistory = approvalFlow.steps.map(step => ({
    stepOrder: step.order,
    stepName: step.actionName,
    role: step.role,
    status: 'Pending',
    notifications: []
  }));
  
  // Create the approval instance
  const approvalInstance = new ApprovalInstance({
    approvalFlow: approvalFlow._id,
    entityId,
    entityType,
    currentStep: 0, // Start at first step
    status: 'Pending',
    stepHistory,
    initiatedBy: initiatorId,
    initiatedAt: new Date(),
    lastActionAt: new Date(),
    lastActionBy: initiatorId
  });
  
  await approvalInstance.save();
  
  // Send initial notifications for the first step
  await sendStepNotifications(approvalInstance._id, 0);
  
  return approvalInstance;
}

/**
 * Process an approval action (approve, reject, skip) for the current step
 */
export async function processApprovalAction(
  approvalInstanceId: string | mongoose.Types.ObjectId,
  actionUserId: string | mongoose.Types.ObjectId,
  action: 'approve' | 'reject' | 'skip',
  comments?: string
) {
  await connectToDB();
  
  // Get the approval instance
  const approvalInstance = await ApprovalInstance.findById(approvalInstanceId)
    .populate({
      path: 'approvalFlow',
      populate: {
        path: 'steps.role',
        model: 'Role'
      }
    });
  
  if (!approvalInstance) {
    throw new Error(`Approval instance not found: ${approvalInstanceId}`);
  }
  
  if (approvalInstance.status !== 'Pending') {
    throw new Error(`Cannot perform action on non-pending approval: ${approvalInstance.status}`);
  }
  
  // Get current step
  const currentStepIndex = approvalInstance.currentStep;
  const currentStepHistory = approvalInstance.stepHistory[currentStepIndex];
  const approvalFlowStep = (approvalInstance.approvalFlow as any).steps.find(
    (s: any) => s.order === currentStepHistory.stepOrder
  );
  
  // Check if user has permission to perform this action
  const user = await User.findById(actionUserId).populate('role');
  
  if (!user) {
    throw new Error(`User not found: ${actionUserId}`);
  }
  
  const userHasRole = String(user.role?._id) === String(approvalFlowStep.role._id);
  const isDelegated = String(currentStepHistory.delegatedTo) === String(actionUserId);
  
  if (!userHasRole && !isDelegated) {
    throw new Error('You do not have permission to perform this action');
  }
  
  // Update the current step based on action
  if (action === 'approve') {
    currentStepHistory.status = 'Approved';
    currentStepHistory.approvedBy = actionUserId;
    currentStepHistory.approvedAt = new Date();
    currentStepHistory.approvalComments = comments;
  } 
  else if (action === 'reject') {
    currentStepHistory.status = 'Rejected';
    currentStepHistory.rejectedBy = actionUserId;
    currentStepHistory.rejectedAt = new Date();
    currentStepHistory.rejectionReason = comments;
    
    // Rejection ends the whole flow
    approvalInstance.status = 'Rejected';
    approvalInstance.completedAt = new Date();
  } 
  else if (action === 'skip') {
    // Check if step can be skipped
    if (!approvalFlowStep.allowSkip) {
      throw new Error('This step cannot be skipped');
    }
    
    currentStepHistory.status = 'Skipped';
    currentStepHistory.skippedBy = actionUserId;
    currentStepHistory.skippedAt = new Date();
    currentStepHistory.skipReason = comments;
  }
  
  // Update last action
  approvalInstance.lastActionAt = new Date();
  approvalInstance.lastActionBy = actionUserId;
  
  // Move to next step if approved or skipped
  if ((action === 'approve' || action === 'skip') && approvalInstance.status !== 'Rejected') {
    const nextStepIndex = currentStepIndex + 1;
    
    // Check if there are more steps
    if (nextStepIndex < approvalInstance.stepHistory.length) {
      approvalInstance.currentStep = nextStepIndex;
      
      // Send notifications for the next step
      await sendStepNotifications(approvalInstanceId, nextStepIndex);
    } 
    else {
      // No more steps, approval is complete
      approvalInstance.status = 'Approved';
      approvalInstance.completedAt = new Date();
    }
  }
  
  await approvalInstance.save();
  return approvalInstance;
}

/**
 * Delegate a step to another user
 */
export async function delegateApprovalStep(
  approvalInstanceId: string | mongoose.Types.ObjectId,
  delegatorId: string | mongoose.Types.ObjectId,
  delegateId: string | mongoose.Types.ObjectId,
  reason?: string
) {
  await connectToDB();
  
  // Get the approval instance
  const approvalInstance = await ApprovalInstance.findById(approvalInstanceId)
    .populate({
      path: 'approvalFlow',
      populate: {
        path: 'steps.role',
        model: 'Role'
      }
    });
  
  if (!approvalInstance) {
    throw new Error(`Approval instance not found: ${approvalInstanceId}`);
  }
  
  if (approvalInstance.status !== 'Pending') {
    throw new Error(`Cannot delegate non-pending approval: ${approvalInstance.status}`);
  }
  
  // Get current step
  const currentStepIndex = approvalInstance.currentStep;
  const currentStepHistory = approvalInstance.stepHistory[currentStepIndex];
  const approvalFlowStep = (approvalInstance.approvalFlow as any).steps.find(
    (s: any) => s.order === currentStepHistory.stepOrder
  );
  
  // Check if delegation is allowed
  if (!approvalFlowStep.allowDelegate) {
    throw new Error('Delegation is not allowed for this step');
  }
  
  // Check if user has permission to delegate
  const delegator = await User.findById(delegatorId).populate('role');
  
  if (!delegator) {
    throw new Error(`Delegator not found: ${delegatorId}`);
  }
  
  const userHasRole = String(delegator.role?._id) === String(approvalFlowStep.role._id);
  
  if (!userHasRole) {
    throw new Error('You do not have permission to delegate this step');
  }
  
  // Check if delegate exists
  const delegate = await User.findById(delegateId);
  
  if (!delegate) {
    throw new Error(`Delegate not found: ${delegateId}`);
  }
  
  // Update step with delegation info
  currentStepHistory.delegatedTo = delegateId;
  currentStepHistory.delegatedBy = delegatorId;
  currentStepHistory.delegatedAt = new Date();
  
  // Update last action
  approvalInstance.lastActionAt = new Date();
  approvalInstance.lastActionBy = delegatorId;
  
  // Add notification for the delegate
  currentStepHistory.notifications.push({
    sentTo: String(delegateId),
    sentAt: new Date(),
    type: 'Initial'
  });
  
  await approvalInstance.save();
  return approvalInstance;
}

/**
 * Cancel an entire approval process
 */
export async function cancelApproval(
  approvalInstanceId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId,
  reason: string
) {
  await connectToDB();
  
  const approvalInstance = await ApprovalInstance.findById(approvalInstanceId);
  
  if (!approvalInstance) {
    throw new Error(`Approval instance not found: ${approvalInstanceId}`);
  }
  
  if (approvalInstance.status !== 'Pending') {
    throw new Error(`Cannot cancel non-pending approval: ${approvalInstance.status}`);
  }
  
  // Only allow initiator to cancel
  if (String(approvalInstance.initiatedBy) !== String(userId)) {
    throw new Error('Only the initiator can cancel an approval process');
  }
  
  approvalInstance.status = 'Cancelled';
  approvalInstance.completedAt = new Date();
  approvalInstance.lastActionAt = new Date();
  approvalInstance.lastActionBy = userId;
  approvalInstance.comments = reason;
  
  await approvalInstance.save();
  return approvalInstance;
}

/**
 * Get approvals that need action from a specific user
 */
export async function getPendingApprovalsForUser(
  userId: string | mongoose.Types.ObjectId,
  entityType?: string
) {
  await connectToDB();
  
  // Get user's role
  const user = await User.findById(userId).populate('role department');
  
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
  
  // Build query for approvals
  const query: any = {
    status: 'Pending'
  };
  
  if (entityType) {
    query.entityType = entityType;
  }
  
  // Get all approval instances
  const approvalInstances = await ApprovalInstance.find(query)
    .populate({
      path: 'approvalFlow',
      populate: {
        path: 'steps.role steps.department',
        model: 'Role'
      }
    })
    .sort({ initiatedAt: -1 });
  
  // Filter instances where user can take action on current step
  return approvalInstances.filter(instance => {
    const currentStepIndex = instance.currentStep;
    const currentStep = instance.stepHistory[currentStepIndex];
    
    // Check delegation
    if (String(currentStep.delegatedTo) === String(userId)) {
      return true;
    }
    
    // Get approval flow step details
    const approvalFlowStep = (instance.approvalFlow as any).steps.find(
      (s: any) => s.order === currentStep.stepOrder
    );
    
    // Check if user has the required role
    const userHasRole = String(user.role?._id) === String(approvalFlowStep.role._id);
    
    // If department is specified, check department match
    const departmentMatches = !approvalFlowStep.department || 
      String(user.department?._id) === String(approvalFlowStep.department._id);
    
    return userHasRole && departmentMatches;
  });
}

/**
 * Get approval status for an entity
 */
export async function getApprovalStatus(
  entityId: string | mongoose.Types.ObjectId,
  entityType: string
) {
  await connectToDB();
  
  const approvalInstance = await ApprovalInstance.findOne({
    entityId,
    entityType,
    status: { $ne: 'Cancelled' } // Ignore cancelled approvals
  })
    .sort({ initiatedAt: -1 }) // Get the most recent one
    .populate('stepHistory.approvedBy stepHistory.rejectedBy initiatedBy');
  
  return approvalInstance;
}

/**
 * Send notifications for a step
 */
async function sendStepNotifications(
  approvalInstanceId: string | mongoose.Types.ObjectId,
  stepIndex: number
) {
  // In a real implementation, this would send emails or notifications
  // For now, we'll just update the notification records
  
  await connectToDB();
  
  const approvalInstance = await ApprovalInstance.findById(approvalInstanceId)
    .populate({
      path: 'approvalFlow',
      populate: {
        path: 'steps.role',
        model: 'Role'
      }
    });
  
  if (!approvalInstance) {
    throw new Error(`Approval instance not found: ${approvalInstanceId}`);
  }
  
  const stepHistory = approvalInstance.stepHistory[stepIndex];
  const approvalFlowStep = (approvalInstance.approvalFlow as any).steps.find(
    (s: any) => s.order === stepHistory.stepOrder
  );
  
  // Find users with the required role
  const usersToNotify = await User.find({
    role: approvalFlowStep.role._id,
    isActive: true
  });
  
  // Add notification records
  usersToNotify.forEach(user => {
    stepHistory.notifications.push({
      sentTo: String(user._id),
      sentAt: new Date(),
      type: 'Initial'
    });
    
    // In a real implementation, also send an actual email/notification here
  });
  
  // Also send to any custom email addresses
  if (approvalFlowStep.notifyEmails && approvalFlowStep.notifyEmails.length > 0) {
    approvalFlowStep.notifyEmails.forEach((email: string) => {
      stepHistory.notifications.push({
        sentTo: email,
        sentAt: new Date(),
        type: 'Initial'
      });
      
      // In a real implementation, send actual email here
    });
  }
  
  await approvalInstance.save();
} 