// src/services/endpoints/ticketHistoryApi.ts
import { baseApi } from '../api';

export interface TicketHistoryApiResponse {
  status: string;
  message?: string;
  data?: any;
  error?: any;
}

export interface TicketHistoryParams {
  ticketId: string;
}

export const ticketHistoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTicketHistory: builder.query<TicketHistoryApiResponse, TicketHistoryParams>({
      query: ({ ticketId }) => `ticket-history?ticketId=${ticketId}`,
      transformResponse: (response: TicketHistoryApiResponse) => response,
      providesTags: ['TicketHistory'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTicketHistoryQuery,
} = ticketHistoryApi;