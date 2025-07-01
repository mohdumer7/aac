import * as approvalFlowService from '../../services/approvalFlowServices';
import { IApprovalFlow, IFlowDefinition } from '../../../models/approvals/ApprovalFlow.model';
import { INVALID_REQUEST, SUCCESS, ERROR } from '../../../shared/constants';

interface CreateApprovalFlowPayloadManager {
  flowName: string;
  description?: string;
  flowDefinition: IFlowDefinition;
  departmentId?: string;
  createdBy: string; // Added createdBy
}

interface UpdateApprovalFlowPayloadManager {
  flowName?: string;
  description?: string;
  flowDefinition?: IFlowDefinition;
  departmentId?: string | null; // Allow null to unset
  isActive?: boolean;
}

export const createApprovalFlow = async (payload: CreateApprovalFlowPayloadManager) => {
  if (!payload.createdBy) { // Check for createdBy in payload
    return { status: ERROR, message: 'User information (createdBy) is required.', data: null };
  }
  // companyId is no longer used here, servicePayload directly uses payload
  return await approvalFlowService.createApprovalFlow(payload);
};

export const getApprovalFlowById = async (id: string) => {
  if (!id) {
    return { status: ERROR, message: 'Flow ID is required.', data: null };
  }
  return await approvalFlowService.getApprovalFlowById(id);
};

export const getApprovalFlows = async (queryParams: any) => {
  // companyId is no longer used for filtering at the service level for getApprovalFlows
  // The service will filter by other available fields like createdBy or departmentId if provided in queryParams
  return await approvalFlowService.getApprovalFlows(queryParams);
};

export const updateApprovalFlow = async (id: string, payload: UpdateApprovalFlowPayloadManager) => {
  if (!id) {
    return { status: ERROR, message: 'Flow ID is required for update.', data: null };
  }
  // The service layer handles the actual update logic, including ObjectId conversion
  return await approvalFlowService.updateApprovalFlow(id, payload);
};

export const deleteApprovalFlow = async (id: string) => {
  if (!id) {
    return { status: ERROR, message: 'Flow ID is required for deletion.', data: null };
  }
  return await approvalFlowService.deleteApprovalFlow(id);
};
