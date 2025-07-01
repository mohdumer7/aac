import { baseApi } from '../api';
import { NotificationDocument } from '@/models/notification/Notification';

export interface NotificationApiResponse {
  status: string;
  message?: string;
  data?: NotificationDocument[] | NotificationDocument;
  error?: any;
}

export interface NotificationParams {
  userId?: string;
  isRead?: boolean;
  limit?: number;
  page?: number;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationApiResponse, NotificationParams>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        params.userId && queryParams.append('userId', params.userId);
        params.isRead !== undefined && queryParams.append('isRead', params.isRead.toString());
        params.limit && queryParams.append('limit', params.limit.toString());
        params.page && queryParams.append('page', params.page.toString());
        return `notifications?${queryParams.toString()}`;
      },
      providesTags: ['Notification'],
    }),
    
    getNotificationCount: builder.query<NotificationApiResponse, { userId?: string; isRead?: boolean }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        params.userId && queryParams.append('userId', params.userId);
        params.isRead !== undefined && queryParams.append('isRead', params.isRead.toString());
        return `notifications/count?${queryParams.toString()}`;
      },
      providesTags: ['Notification'],
    }),
    
    createNotification: builder.mutation<NotificationApiResponse, Partial<NotificationDocument>>({
      query: (notification) => ({
        url: 'notifications',
        method: 'POST',
        body: notification,
      }),
      invalidatesTags: ['Notification'],
    }),
    
    markAsRead: builder.mutation<NotificationApiResponse, { ids?: string[]; userId?: string }>({
      query: (params) => ({
        url: 'notifications/mark-read',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Notification'],
    }),
    
    deleteNotification: builder.mutation<NotificationApiResponse, { id: string }>({
      query: (params) => ({
        url: `notifications/${params.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useGetNotificationCountQuery,
  useCreateNotificationMutation,
  useMarkAsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi; 