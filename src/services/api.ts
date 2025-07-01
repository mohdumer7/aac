import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL, ENVIRONMENT, API_PROD_BASE_URL } from '@/lib/constants'

// Create a custom base query with retry logic
const baseQueryWithRetry = retry(
  fetchBaseQuery({
    baseUrl : ENVIRONMENT === 'development' ? API_BASE_URL : API_PROD_BASE_URL ,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
    credentials: 'include', // For handling cookies if needed
  }),
  { maxRetries: 0 } // Retry failed requests up to 2 times
)

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['User', 'Post', 'Comment', 'Master', 'Application', 'Email','Ticket','TicketCategory','TicketComment','TicketHistory','TicketTask','UserSkill', 'SmlFile', 'Notification', 'ApprovalFlow', 'Department', 'UserListForFlow'], // Define entity types for cache invalidation
  endpoints: () => ({}), // We'll inject endpoints from other files
})