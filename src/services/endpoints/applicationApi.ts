import { baseApi } from '../api';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getApplication: builder.query<any[], { db: string; filter?: object; sort?: object; page?: number; limit?: number }>({
      query: ({ db, filter, sort, page, limit }) => {
        // Construct query parameters dynamically
        const params = new URLSearchParams();
        params.append('db', db);

        filter && params.append('filter', JSON.stringify(filter));
        sort && params.append('sort', JSON.stringify(sort));
        page && params.append('page', page.toString());
        limit && params.append('limit', limit.toString());

        return `application?${params.toString()}`;
      },
      // Transform response if needed
      transformResponse: (response: any[]) => response,
      providesTags: ['Application'],
    }),
    createApplication: builder.mutation<any[], void>({
      query: (appData) => ({
        url: 'application',
        method: 'POST',
        body: appData,
      }),
      // Invalidate relevant cache tags after mutation
      invalidatesTags: ['Application'],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetApplicationQuery, // Query hook for fetching master data
  useLazyGetApplicationQuery,
  useCreateApplicationMutation
} = usersApi;
