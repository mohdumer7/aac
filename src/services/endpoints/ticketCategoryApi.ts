// src/services/endpoints/ticketCategoryApi.ts
import { baseApi } from '../api';

export interface TicketCategoryApiResponse {
  status: string;
  message?: string;
  data?: any;
  error?: any;
}

export interface TicketCategoryParams {
  filter?: object;
  sort?: object;
  id?: string;
  departmentId?: string;
}

export const ticketCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTicketCategories: builder.query<TicketCategoryApiResponse, TicketCategoryParams>({
      query: ({ filter, sort, id, departmentId }) => {
        const params = new URLSearchParams();
        filter && params.append('filter', JSON.stringify(filter));
        sort && params.append('sort', JSON.stringify(sort));
        id && params.append('id', id);
        departmentId && params.append('departmentId', departmentId);
        return `ticket-category?${params.toString()}`;
      },
      transformResponse: (response: TicketCategoryApiResponse) => response,
      providesTags: ['TicketCategory'],
    }),

    createTicketCategory: builder.mutation<TicketCategoryApiResponse, any>({
      query: (categoryData) => ({
        url: 'ticket-category',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['TicketCategory'],
    }),

    updateTicketCategory: builder.mutation<TicketCategoryApiResponse, any>({
      query: (categoryData) => ({
        url: 'ticket-category',
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['TicketCategory'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTicketCategoriesQuery,
  useCreateTicketCategoryMutation,
  useUpdateTicketCategoryMutation,
} = ticketCategoryApi;