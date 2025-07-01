// src/services/endpoints/ticketTaskApi.ts
import { baseApi } from '../api';

export interface TicketTaskApiResponse {
  status: string;
  message?: string;
  data?: any;
  error?: any;
}

export interface TicketTaskParams {
  ticketId: string;
}

export const ticketTaskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTicketTasks: builder.query<TicketTaskApiResponse, TicketTaskParams>({
      query: ({ ticketId }) => `ticket-task?ticketId=${ticketId}`,
      transformResponse: (response: TicketTaskApiResponse) => response,
      providesTags: ['TicketTask'],
    }),

    createTicketTask: builder.mutation<TicketTaskApiResponse, any>({
      query: (taskData) => ({
        url: 'ticket-task',
        method: 'POST',
        body: { action: 'create', data: taskData }
      }),
      invalidatesTags: ['TicketTask', 'Ticket'],
    }),

    updateTicketTask: builder.mutation<TicketTaskApiResponse, any>({
      query: (taskData) => ({
        url: 'ticket-task',
        method: 'POST',
        body: { action: 'update', data: taskData }
      }),
      invalidatesTags: ['TicketTask', 'Ticket'],
    }),

    changeTaskStatus: builder.mutation<TicketTaskApiResponse, any>({
      query: (statusData) => ({
        url: 'ticket-task',
        method: 'POST',
        body: { action: 'changeStatus', data: statusData }
      }),
      invalidatesTags: ['TicketTask', 'Ticket'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTicketTasksQuery,
  useCreateTicketTaskMutation,
  useUpdateTicketTaskMutation,
  useChangeTaskStatusMutation,
} = ticketTaskApi;