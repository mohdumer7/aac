import { crudManager } from "@/server/managers/crudManager";
import { catchAsync } from "@/server/shared/catchAsync";
import { INSUFFIENT_DATA, MONGO_MODELS, SUCCESS } from "@/shared/constants";
import mongoose from 'mongoose'; // Added for UserForFlow type
import { UserDocument } from '@/types/master/user.types'; // Assuming this is the correct path for UserDocument type
import { QueryResult } from '@/server/Engines/DbEngine/types'; // For typing the result of crudManager
import { UserPersonalDetails, UserEmploymentDetails, UserVisaDetails, UserIdentification, UserBenefits } from '@/models';

export const getUsers = catchAsync(async ({ filter }: { filter: any }) => {
  const result = await crudManager.mongooose.find(MONGO_MODELS.USER_MASTER, {
    filter,
    sort: { empId: "desc" },
  });

  return result;
});

export const createUser = catchAsync(async (options: any) => {
  const result = await crudManager.mongooose.create(
    MONGO_MODELS.USER_MASTER,
    options
  );
  return result;
});



export const updateUser = catchAsync(async (options: any) => {
  // options should contain: filter, data
  const { filter, data } = options;
  if (!filter || !data) {
    return { status: 'error', message: 'Missing filter or data for update', data: null };
  }





  try {
    // Prepare update promises
    const subDocUpdates: Promise<any>[] = [];
    const subDocMap = [
      { key: 'personalDetails', modelName: 'USER_PERSONAL_DETAILS' },
      { key: 'employmentDetails', modelName: 'USER_EMPLOYMENT_DETAILS' },
      { key: 'visaDetails', modelName: 'USER_VISA_DETAILS' },
      { key: 'identification', modelName: 'USER_IDENTIFICATION' },
      { key: 'benefits', modelName: 'USER_BENEFITS' },
    ];
console.log('here',data);
    // Find the user to get subdocument ObjectIds
    const userResult = await crudManager.mongooose.find(MONGO_MODELS.USER_MASTER, { filter });
    if (!userResult.data || !userResult.data[0]) {
      return { status: 'error', message: 'User not found', data: null };
    }
    const user = userResult.data[0];
// console.log('here', user);
    // For each subdocument, if present in data, update it
    for (const { key, modelName } of subDocMap) {
      console.log('key', key);
      console.log('modelName', modelName);
      if (data[key]) {
        const subDocId = user[key]?._id || user[key];
        console.log('subDocId', subDocId);
        if (!subDocId) {
          return { status: 'error', message: `User is missing subdocument: ${key}`, data: null };
        }
        // Use the public update method on the adapter for subdocument updates
        console.log('Model', modelName);

        const updateResult = await crudManager.mongooose.update(modelName, {
          filter: { _id: subDocId },
          data: data[key]
        });
        console.log('updateResult', updateResult);
        // console.log('updateResult', updateResult);
        if (updateResult.status !== SUCCESS) {
          return { status: 'error', message: `Failed to update ${key}: ${updateResult.message}`, data: null };
        }
      }
    }
console.log('here 2');
    // Remove subdoc fields from main update
    const mainUserData = { ...data };
    subDocMap.forEach(({ key }) => { delete mainUserData[key]; });
    console.log('mainUserData', mainUserData);
    // Update main user document if there are fields to update
    if (Object.keys(mainUserData).length > 0) {
      const res = await crudManager.mongooose.update(MONGO_MODELS.USER_MASTER, {
        filter,
        data: mainUserData
      });
      console.log('res', res);
    }

    // Return the updated user with all subdocuments populated
    const updatedUserResult = await crudManager.mongooose.find(MONGO_MODELS.USER_MASTER, {
      filter,
      populate: [
        'personalDetails',
        'employmentDetails',
        'visaDetails',
        'identification',
        'benefits'
      ]
    });

    return {
      status: 'success',
      message: 'User and subdocuments updated',
      data: updatedUserResult.data ? updatedUserResult.data[0] : null
    };
  } catch (err: any) {
    // Log and return the real error
    console.error('Error in updateUser:', err);
    return {
      status: 'error',
      message: err.message || 'Unknown error in updateUser',
      stack: err.stack || null,
      data: null
    };
  }
});

//ADD and Update Access are the same function
export const updateAccess = catchAsync(
  async (options: {
    data: {
      id: string;
      arrayProperty: string;
      arrayFilter: object;
      data: object;
      addIfNotFound?: boolean;
    };
  }) => {
    const result = await crudManager.mongooose.updateInArray(
      MONGO_MODELS.USER_MASTER,
      options.data
    );
    return result;
  }
);

// Define a type for the user information needed for the flow
export interface UserForFlow {
  _id: mongoose.Types.ObjectId | string;
  firstName: string;
  lastName: string;
  email: string;
  fullName?: string;
}

/**
 * Fetches all active users with minimal details required for approval flow selection.
 * Uses crudManager and catchAsync pattern.
 */
export const getAllUsersForFlow = catchAsync(async (): Promise<QueryResult> => {
  const result: QueryResult = await crudManager.mongooose.find(
    MONGO_MODELS.USER_MASTER,
    {
      filter: { isActive: true }, // Filter: only active users
      select: ['_id', 'firstName', 'lastName', 'email'] // Options: select specific fields
    }
  );

  if (result.status === 'error' || !result.data) {
    // catchAsync should handle throwing an error, but good to be explicit if needed
    // For now, we assume crudManager.mongooose.find returns a structure that catchAsync can interpret
    // or that it throws on error, which catchAsync handles.
    // If crudManager returns a QueryResult with status 'error', we might need to throw here.
    // For consistency with existing functions, we return the result object.
    // However, for this specific use case, transforming data or throwing might be better.
    // Let's proceed by transforming if successful, and let catchAsync handle if crudManager throws.
    // If crudManager.find itself returns a QueryResult error, this needs careful handling.

    // Assuming crudManager.find throws on actual DB error or returns QueryResult with error status for logical errors.
    // If it's a QueryResult error status, we should probably throw an error here to be caught by catchAsync.
    if (result.status === 'error') {
        throw new Error(result.message || 'Failed to fetch users from database via crudManager.');
    }
    // If data is null/undefined but status is success (unlikely for find), also an issue.
    if (!result.data) {
        throw new Error('No data returned when fetching users, though no explicit error reported.');
    }
  }

  // Transform UserDocument[] to UserForFlow[]
  const usersForFlow: UserForFlow[] = (result.data as UserDocument[]).map((user: UserDocument) => ({
    _id: user._id!,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    fullName: `${user.firstName} ${user.lastName}`
  }));

  // The catchAsync wrapper expects the successful data to be returned directly.
  // If crudManager.mongooose.find returns a QueryResult, and we want to return UserForFlow[],
  // we should return usersForFlow directly here. catchAsync handles wrapping it into a success response for the API.
  // However, existing functions return 'result'. For consistency, let's see if we can adapt.
  // The existing functions (getUsers, createUser, etc.) return the direct 'result' from crudManager.
  // This implies the API routes using these services expect a QueryResult.
  // So, we should wrap our transformed data back into a QueryResult-like structure if we want to maintain that pattern
  // OR change how API routes handle responses from services wrapped by catchAsync.

  // For now, let's return the transformed data directly, assuming catchAsync handles the response structure.
  // If API routes expect QueryResult, this will need adjustment in the API route or here.
  // Given the other functions return 'result', it's safer to mimic that structure for now.
  return {
    status: 'success',
    message: 'Successfully fetched users for flow.',
    data: usersForFlow as any, // QueryResult.data is 'any'
  };
});
