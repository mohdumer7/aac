import 'next-auth';
import 'next-auth/jwt';
import { Types } from 'mongoose';

// Define the structure of the populated Organisation within EmploymentDetails
interface PopulatedOrganisation {
  _id: Types.ObjectId; // Or string, depending on how it's used/transformed
  // Add other fields from Organisation model if needed by the session
  name?: string; // Example field
}

// Define the structure of what we expect in employmentDetails after population
interface UserEmploymentDetailsSession {
  organisation?: PopulatedOrganisation | Types.ObjectId; // It could be populated or just the ID
  // Add other fields from UserEmploymentDetails if needed
}


declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      _id?: Types.ObjectId | string; // From User model
      companyId?: Types.ObjectId | string; // This will be derived from employmentDetails.organisation
      employmentDetails?: UserEmploymentDetailsSession;
      // Standard fields (ensure they are still available or re-declare if overwritten)
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & Omit<DefaultSession['user'], '_id' | 'companyId' | 'employmentDetails'>;
    menuItems?: any; // As defined in your authOptions
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    _id?: Types.ObjectId | string;
    companyId?: Types.ObjectId | string; // Derived
    employmentDetails?: UserEmploymentDetailsSession;
    // Add any other fields from your User model that are put onto the session user object
    // For example, if your User model has firstName, lastName, etc., and they are on the session:
    firstName?: string;
    lastName?: string;
    // Ensure to include other properties from your User model that are part of the session
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    idToken?: string;
    user?: {
      _id?: Types.ObjectId | string;
      companyId?: Types.ObjectId | string;
      employmentDetails?: UserEmploymentDetailsSession;
       // Standard fields
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    // Add any other JWT specific fields
  }
}
