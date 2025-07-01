import { Document } from 'mongoose';

// Type for objects that have an _id property that can be converted to a string
type WithId = { _id: { toString(): string } | string | number };

export type { WithId };

/**
 * Safely extracts the string ID from a Mongoose document or any object with an _id property
 * @param doc The object with an _id property
 * @returns The string representation of the _id, or an empty string if not available
 */
export const getDocumentId = (doc: WithId | unknown): string => {
  if (!doc) return '';
  
  try {
    // Handle WithId type
    if (typeof doc === 'object' && doc !== null) {
      const obj = doc as Record<string, unknown>;
      
      // Check if the object has an _id property
      if ('_id' in obj && obj._id !== null && obj._id !== undefined) {
        const id = obj._id;
        
        // Handle different types of _id values
        if (typeof id === 'string') return id;
        if (typeof id === 'number') return id.toString();
        if (typeof id === 'object' && id !== null && 'toString' in id) {
          return (id as { toString(): string }).toString();
        }
      }
    }
    
    return '';
  } catch (error) {
    console.error('Error getting document ID:', error);
    return '';
  }
};

/**
 * Type guard to check if an object is a Mongoose document with an _id
 */
export const isDocumentWithId = <T extends Document>(
  obj: unknown
): obj is T => {
  if (!obj || typeof obj !== 'object' || obj === null) return false;
  
  const doc = obj as Record<string, unknown>;
  return '_id' in doc && doc._id !== undefined;
};
