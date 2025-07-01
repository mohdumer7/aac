import { baseApi } from '../api'
import { UserDocument } from '@/types';

// Define the specific structure for users in the approval flow dropdown/list
export interface UserForFlow {
  _id: string; // Assuming _id is string after serialization
  firstName: string;
  lastName: string;
  email: string;
  fullName?: string;
}

// Response structure from /api/master
interface MasterApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
  error?: any;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<UserDocument[], void>({
      query: () => 'user',
      // Transform response if needed
      transformResponse: (response: UserDocument[]) => response,
      providesTags: ['User'],
    }),

    getUsersForFlow: builder.query<UserForFlow[], void>({
      query: () => {
        const params = new URLSearchParams({
          db: 'USER_MASTER',
          filter: JSON.stringify({ isActive: true }),
          sort: JSON.stringify({ empId: 'asc' }), // Sort by empId to align with master/user/page.tsx
        });
        return `master?${params.toString()}`; // Targets GET /api/master
      },
      transformResponse: (response: MasterApiResponse<UserForFlow[]>, meta, arg) => {
        console.log('[getUsersForFlow] Attempting to transform response. Raw:', JSON.stringify(response, null, 2));

        if (!response) {
          console.warn('[getUsersForFlow] Response object is falsy. Returning empty array.');
          return [];
        }

        console.log(`[getUsersForFlow] Response details: Status='${response.status}', IsDataArray=${Array.isArray(response.data)}`);

        if (response.status === 'Success' && Array.isArray(response.data)) {
          console.log('[getUsersForFlow] Status is Success and data is an array. Processing items:', response.data.length);
          try {
            const transformedData = response.data.map(user => {
              const constructedFullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
              return {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                fullName: constructedFullName,
              };
            });
            console.log('[getUsersForFlow] Successfully transformed data:', JSON.stringify(transformedData, null, 2));
            return transformedData;
          } catch (error) {
            console.error('[getUsersForFlow] Error during data mapping:', error);
            return []; // Return empty array on mapping error
          }
        } else {
          console.warn('[getUsersForFlow] Condition not met (status not Success or data not an array). Returning empty array.');
          return [];
        }
      },
      providesTags: ['UserListForFlow'], 
    }),

    getUserById: builder.query<UserDocument, string>({
      query: (id) => `user/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    userOperations: builder.mutation<UserDocument, UserDocument>({
      query: (userData) => ({
        url: 'user',
        method: 'POST',
        body: userData,
      }),
      // Invalidate relevant cache tags after mutation
      invalidatesTags: ['User'],
    }),

    updateUser: builder.mutation<UserDocument, UserDocument>({
      query: (userData) => ({
        url: `user`,
        method: 'PUT',
        body: userData,
      }),
      // Invalidate relevant cache tags after mutation
      invalidatesTags: ['User'],
    }),
   
  }),
  overrideExisting: false,
})

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUserOperationsMutation,
  useUpdateUserMutation,
  useGetUsersForFlowQuery // Export the new hook
} = usersApi 
