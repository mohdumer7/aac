import '../../../models/master/User.model';
import '../../../models/master/Department.model';
import '../../../models/master/Organisation.model';
import { dbEngine } from '../../Engines/DbEngine';
import { Types } from 'mongoose';
import { MONGO_MODELS, SUCCESS, ERROR, USER_NOT_FOUND, INVALID_REQUEST } from '../../../shared/constants';
import { IApprovalFlow, IFlowDefinition } from '../../../models/approvals/ApprovalFlow.model'; // Assuming IApprovalFlow is exported

interface CreateApprovalFlowPayload {
  flowName: string;
  description?: string;
  flowDefinition: IFlowDefinition;
  createdBy: string; // User ID
  departmentId?: string | null; // Optional Department ID, allow null for unsetting
}

/**
 * Creates a new approval flow.
 * @param payload - Data for the new approval flow.
 * @returns The created approval flow document or an error object.
 */
export const createApprovalFlow = async (payload: CreateApprovalFlowPayload) => {
  try {
    if (!payload.flowName || !payload.flowDefinition || !payload.createdBy) {
      return { status: ERROR, message: INVALID_REQUEST, data: null };
    }

    const newFlowData: Partial<IApprovalFlow> = {
      flowName: payload.flowName,
      description: payload.description,
      flowDefinition: payload.flowDefinition,
      createdBy: new Types.ObjectId(payload.createdBy),
      isActive: true,
    };

    if (payload.departmentId) {
      newFlowData.departmentId = new Types.ObjectId(payload.departmentId);
    }

    const result = await dbEngine.mongooose.create(MONGO_MODELS.APPROVAL_FLOW_MASTER, { data: newFlowData });
    if (result.status === SUCCESS) {
      return { status: SUCCESS, message: 'Approval flow created successfully.', data: result.data };
    }
    return { status: ERROR, message: result.message || 'Failed to create approval flow.', data: null };
  } catch (error: any) {
    console.error('Error creating approval flow:', error);
    return { status: ERROR, message: error.message || 'An unexpected error occurred.', data: null };
  }
};

/**
 * Retrieves an approval flow by its ID and company ID.
 * @param id - The ID of the approval flow.
 * @param companyId - The ID of the company the flow belongs to.
 * @returns The approval flow document or null if not found, or an error object.
 */
export const getApprovalFlowById = async (id: string) => {
  try {
    if (!id) {
      return { status: ERROR, message: 'Flow ID is required.', data: null };
    }

    const query = {
      _id: new Types.ObjectId(id),
      isActive: true, // Typically, only fetch active flows unless specified
    };

    const result = await dbEngine.mongooose.find(MONGO_MODELS.APPROVAL_FLOW_MASTER, { 
        filter: query,
        populate: [
            { path: 'departmentId', select: 'name' },
            { path: 'createdBy', select: 'name email' }
        ]
    });

    if (result.status === SUCCESS && result.data) {
      return { status: SUCCESS, message: 'Approval flow retrieved successfully.', data: result.data as IApprovalFlow };
    } else if (result.status === SUCCESS && !result.data) {
      return { status: ERROR, message: 'Approval flow not found or not active.', data: null };
    }
    return { status: ERROR, message: result.message || 'Failed to retrieve approval flow.', data: null };
  } catch (error: any) {
    console.error('Error retrieving approval flow by ID:', error);
    return { status: ERROR, message: error.message || 'An unexpected error occurred.', data: null };
  }
};

// Placeholder for getApprovalFlows
export const getApprovalFlows = async (queryParams: any) => {
  try {
    const { departmentId, createdBy, searchTerm, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc' } = queryParams;

    const filter: any = { isActive: true };

    if (departmentId) {
      filter.departmentId = new Types.ObjectId(departmentId);
    }
    if (createdBy) {
      filter.createdBy = new Types.ObjectId(createdBy);
    }
    
    const findOptions: any = {
        filter,
        pagination: { page, limit },
        sort: { [sortField]: sortOrder },
        populate: [
            { path: 'departmentId', select: 'name' },
            { path: 'createdBy', select: 'name email' }
        ]
    };

    if (searchTerm) {
      // MongooseAdapter's find method handles searchTerm and searchFields internally if provided in options
      // Assuming flowName is a primary field to search on
      findOptions.searchTerm = searchTerm;
      findOptions.searchFields = ['flowName', 'description']; // Add other relevant fields if needed
    }

    // Re-importing to ensure models are registered before virtual population via 'creator' field
    require('../../../models/master/User.model');
    require('../../../models/master/Department.model');
    require('../../../models/master/Organisation.model');
    const result = await dbEngine.mongooose.find(MONGO_MODELS.APPROVAL_FLOW_MASTER, findOptions);

    if (result.status === SUCCESS) {
      return {
        status: SUCCESS,
        message: 'Approval flows retrieved successfully.',
        data: Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []),
        total: result.pagination?.total || 0,
        page: result.pagination?.page || page,
        limit: result.pagination?.limit || limit,
        pages: result.pagination?.pages || 0,
      };
    }
    return { status: ERROR, message: result.message || 'Failed to retrieve approval flows.', data: [], total: 0 };
  } catch (error: any) {
    console.error('Error retrieving approval flows:', error);
    return { status: ERROR, message: error.message || 'An unexpected error occurred.', data: [], total: 0 };
  }
};

// Update an existing approval flow
export const updateApprovalFlow = async (id: string, updateData: Partial<CreateApprovalFlowPayload>) => {
  console.log('updateApprovalFlow called with id:', id, 'and updateData:', JSON.stringify(updateData, null, 2));
  
  try {
    if (!id) {
      console.error('Error: Flow ID is required for update.');
      return { status: ERROR, message: 'Flow ID is required for update.', data: null };
    }

    // Validate the ID format
    if (!Types.ObjectId.isValid(id)) {
      console.error('Error: Invalid flow ID format:', id);
      return { status: ERROR, message: 'Invalid flow ID format.', data: null };
    }

    const query = {
      _id: new Types.ObjectId(id),
    };

    console.log('Query for update:', JSON.stringify(query, null, 2));

    // Ensure ObjectIds are correctly formatted if present in updateData
    const updatePayload: any = { ...updateData };
    
    // Remove _id from update payload to prevent changing the document ID
    delete updatePayload._id;
    
    // Convert createdBy to ObjectId if it exists
    if (updateData.createdBy) {
      try {
        updatePayload.createdBy = new Types.ObjectId(updateData.createdBy);
      } catch (error) {
        console.error('Error converting createdBy to ObjectId:', error);
        return { status: ERROR, message: 'Invalid createdBy ID format.', data: null };
      }
    }
    
    // Handle departmentId
    if (updateData.departmentId) {
      try {
        updatePayload.departmentId = new Types.ObjectId(updateData.departmentId);
      } catch (error) {
        console.error('Error converting departmentId to ObjectId:', error);
        return { status: ERROR, message: 'Invalid department ID format.', data: null };
      }
    } else if (updateData.departmentId === null || updateData.departmentId === '') {
      // Allow unsetting departmentId
      updatePayload.$unset = { departmentId: "" };
      delete updatePayload.departmentId;
    }
    
    // Log the final update payload
    console.log('Final update payload:', JSON.stringify(updatePayload, null, 2));
    
    // Execute the update
    const result = await dbEngine.mongooose.update(
      MONGO_MODELS.APPROVAL_FLOW_MASTER, 
      { 
        filter: query, 
        data: updatePayload
      }
    );
    
    console.log('MongoDB update result:', JSON.stringify(result, null, 2));
    
    if (result.status === SUCCESS) {
      // The update was successful, now fetch the updated document
      const updatedFlowResult = await dbEngine.mongooose.find(MONGO_MODELS.APPROVAL_FLOW_MASTER, { 
        filter: query,
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'createdBy', select: 'name email' }
        ]
      });
      
      console.log('Fetched updated flow:', JSON.stringify(updatedFlowResult, null, 2));
      
      // Check if we got the updated document
      if (updatedFlowResult.status === 'SUCCESS' && updatedFlowResult.data) {
        let updatedFlow;
        
        // Handle both array and single document responses
        if (Array.isArray(updatedFlowResult.data)) {
          updatedFlow = updatedFlowResult.data[0];
        } else if (typeof updatedFlowResult.data === 'object') {
          updatedFlow = updatedFlowResult.data;
        }
        
        if (updatedFlow) {
          console.log('Returning updated flow:', JSON.stringify(updatedFlow, null, 2));
          return { 
            status: 'Success', 
            message: 'Approval flow updated successfully', 
            data: updatedFlow 
          };
        }
      }
      
      // If we got here, we couldn't fetch the updated document, but the update was successful
      console.warn('Successfully updated flow but could not fetch updated document');
      return { 
        status: 'Success', 
        message: 'Approval flow updated successfully',
        data: null
      };
      
    } else if (result.status === SUCCESS && result.data?.modifiedCount === 0) {
      // Check if the document exists to differentiate between not found and no changes made
      const existingFlowResult = await dbEngine.mongooose.find(MONGO_MODELS.APPROVAL_FLOW_MASTER, { 
        filter: query,
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'createdBy', select: 'name email' }
        ]
      });
      
      const existingFlow = existingFlowResult.status === SUCCESS && Array.isArray(existingFlowResult.data) && existingFlowResult.data.length > 0 
        ? existingFlowResult.data[0] 
        : null;
        
      if (!existingFlow) {
        return { status: ERROR, message: 'Approval flow not found.', data: null };
      }
      
      return { 
        status: SUCCESS, 
        message: 'No changes made to the approval flow.', 
        data: existingFlow 
      };
    }
    return { status: ERROR, message: result.message || 'Failed to update approval flow.', data: null };
  } catch (error: any) {
    console.error('Error updating approval flow:', error);
    return { status: ERROR, message: error.message || 'An unexpected error occurred.', data: null };
  }
};

// Placeholder for deleteApprovalFlow (soft delete)
export const deleteApprovalFlow = async (id: string) => {
  try {
    if (!id) {
      return { status: ERROR, message: 'Flow ID is required for deletion.', data: null };
    }

    const query = {
      _id: new Types.ObjectId(id),
    };

    const updateData = { isActive: false };

    const result = await dbEngine.mongooose.update(MONGO_MODELS.APPROVAL_FLOW_MASTER, { filter: query, data: updateData });

    if (result.status === SUCCESS && result.data?.modifiedCount > 0) {
      return { status: SUCCESS, message: 'Approval flow deleted successfully (deactivated).', data: { id } };
    } else if (result.status === SUCCESS && result.data?.modifiedCount === 0) {
      // Check if the document exists and was already inactive
      const existingFlowResult = await dbEngine.mongooose.find(MONGO_MODELS.APPROVAL_FLOW_MASTER, { filter: query });
      const existingFlow = existingFlowResult.status === SUCCESS && Array.isArray(existingFlowResult.data) && existingFlowResult.data.length > 0 ? existingFlowResult.data[0] : null;
      if (!existingFlow) {
         return { status: ERROR, message: 'Approval flow not found.', data: null };
      }
      if (existingFlow && existingFlow.isActive === false) {
        return { status: SUCCESS, message: 'Approval flow was already inactive.', data: { id } };
      }
      return { status: ERROR, message: 'Approval flow not found or no changes made.', data: null };
    }
    return { status: ERROR, message: result.message || 'Failed to delete approval flow.', data: null };
  } catch (error: any) {
    console.error('Error deleting approval flow:', error);
    return { status: ERROR, message: error.message || 'An unexpected error occurred.', data: null };
  }
};
