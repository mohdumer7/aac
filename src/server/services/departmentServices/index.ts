import { dbEngine } from '../../Engines/DbEngine';
import { MONGO_MODELS } from '@/shared/constants';
import mongoose from 'mongoose';
import { department as DepartmentType } from '@/types/master/department.types';

// Define the document type by combining the base type with mongoose.Document
export type DepartmentDocument = DepartmentType & mongoose.Document; 

/**
 * Fetches all departments from the database.
 * @returns A promise that resolves to an array of department documents.
 */
export const getAllDepartments = async (): Promise<DepartmentDocument[]> => {
  try {
    // The MongooseAdapter's find method takes FindOptions, not separate query, projection, etc.
    // It also returns QueryResult, so we need to extract data from it.
    const result = await dbEngine.mongooose.find(
      MONGO_MODELS.DEPARTMENT_MASTER,
      {
        filter: {}, // Use 'filter' for query conditions
        select: ['name', '_id'] // Use 'select' for projection
        // No separate 'options' object like the native Mongoose find
      }
    );

    if (result.status === 'SUCCESS' && result.data) {
      return result.data as DepartmentDocument[]; // Cast data to the expected type
    } else {
      // Log the error message from QueryResult if available
      const errorMessage = result.message || 'Failed to fetch departments, no specific error message.';
      console.error('Error fetching departments from dbEngine:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error in getAllDepartments service:', error);
    // Ensure a generic error is thrown if the catch block is hit for other reasons
    const message = error instanceof Error ? error.message : 'An unexpected error occurred while fetching departments.';
    throw new Error(message);
  }
};
