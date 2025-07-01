import { baseApi } from '../api';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    sendEmail: builder.mutation<any[], void>({
      query: (emailData) => ({
        url: 'email',
        method: 'POST',
        body: emailData,
      }),
      // Invalidate relevant cache tags after mutation
      invalidatesTags: ['Email'],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useSendEmailMutation
} = usersApi;
