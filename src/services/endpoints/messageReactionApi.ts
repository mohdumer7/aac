// src/services/endpoints/messageReactionApi.ts
import { baseApi } from '../api';

export interface MessageReactionApiResponse {
  status: string;
  message?: string;
  data?: any;
  error?: any;
}

export interface MessageReactionParams {
  messageId: string;
}

export const messageReactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessageReactions: builder.query<MessageReactionApiResponse, MessageReactionParams>({
      query: ({ messageId }) => `message-reaction?messageId=${messageId}`,
      transformResponse: (response: MessageReactionApiResponse) => response,
    }),

    addReaction: builder.mutation<MessageReactionApiResponse, { messageId: string; userId: string; emoji: string }>({
      query: (reactionData) => ({
        url: 'message-reaction',
        method: 'POST',
        body: {
          action: 'add',
          ...reactionData,
        },
      }),
      invalidatesTags: ['TicketComment'],
    }),

    removeReaction: builder.mutation<MessageReactionApiResponse, { messageId: string; userId: string; emoji: string }>({
      query: (reactionData) => ({
        url: 'message-reaction',
        method: 'POST',
        body: {
          action: 'remove',
          ...reactionData,
        },
      }),
      invalidatesTags: ['TicketComment'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMessageReactionsQuery,
  useAddReactionMutation,
  useRemoveReactionMutation,
} = messageReactionApi;