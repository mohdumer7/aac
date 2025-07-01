// src/services/endpoints/ticketApi.ts
import { baseApi } from '../api';

export interface TicketApiResponse {
  status: string;
  message?: string;
  data?: any;
  pagination?: any;
  error?: any;
}

export interface TicketParams {
  filter?: object;
  sort?: object;
  page?: number;
  limit?: number;
  id?: string;
}

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<TicketApiResponse, TicketParams>({
      query: ({ filter, sort, page, limit, id }) => {
        const params = new URLSearchParams();
        filter && params.append('filter', JSON.stringify(filter));
        sort && params.append('sort', JSON.stringify(sort));
        page && params.append('page', page.toString());
        limit && params.append('limit', limit.toString());
        id && params.append('id', id);
        return `ticket?${params.toString()}`;
      },
      transformResponse: (response: TicketApiResponse) => response,
      providesTags: ['Ticket'],
    }),

    createTicket: builder.mutation<TicketApiResponse, any>({
      query: (ticketData) => ({
        url: 'ticket',
        method: 'POST',
        body: ticketData,
      }),
      invalidatesTags: ['Ticket'],
    }),

    updateTicket: builder.mutation<TicketApiResponse, any>({
      query: (ticketData) => ({
        url: 'ticket',
        method: 'POST',
        body: { ...ticketData, action: 'update' },
      }),
      invalidatesTags: ['Ticket'],
    }),

    assignTicket: builder.mutation<TicketApiResponse, any>({
      query: (assignData) => ({
        url: 'ticket',
        method: 'POST',
        body: { action: 'assign', data: assignData },
      }),
      invalidatesTags: ['Ticket'],
    }),

    changeTicketStatus: builder.mutation<TicketApiResponse, any>({
      query: (statusData) => ({
        url: 'ticket',
        method: 'POST',
        body: { action: 'changeStatus', data: statusData },
      }),
      invalidatesTags: ['Ticket'],
    }),

    autoAssignTicket: builder.mutation<TicketApiResponse, any>({
      query: (assignData) => ({
        url: 'ticket',
        method: 'POST',
        body: { action: 'autoAssign', data: assignData },
      }),
      invalidatesTags: ['Ticket'],
    }),
    
    updateTicketAssignees: builder.mutation<TicketApiResponse, any>({
      query: (assigneesData) => ({
        url: 'ticket',
        method: 'POST',
        body: { action: 'updateAssignees', data: assigneesData },
      }),
      invalidatesTags: ['Ticket'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTicketsQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useAssignTicketMutation,
  useChangeTicketStatusMutation,
  useAutoAssignTicketMutation,
  useUpdateTicketAssigneesMutation,
} = ticketApi;