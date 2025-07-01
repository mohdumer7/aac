// src/services/endpoints/userPresenceApi.ts
import { baseApi } from '../api';

export interface UserPresenceApiResponse {
  status: string;
  message?: string;
  data?: any;
  error?: any;
}

export interface UserPresenceParams {
  userId?: string;
}

export const userPresenceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserPresence: builder.query<UserPresenceApiResponse, UserPresenceParams>({
      query: ({ userId }) => userId 
        ? `user-presence?userId=${userId}` 
        : 'user-presence',
      transformResponse: (response: UserPresenceApiResponse) => response,
      // Refresh every 30 seconds to keep presence info up to date
      keepUnusedDataFor: 30,
    }),

    updateUserPresence: builder.mutation<UserPresenceApiResponse, any>({
      query: (presenceData) => ({
        url: 'user-presence',
        method: 'POST',
        body: presenceData,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserPresenceQuery,
  useUpdateUserPresenceMutation,
} = userPresenceApi;