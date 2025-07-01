import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { UserDocument } from '@/types';
import { 
  HRWizardFormData,
  HRWizardStep,
  HRWizardApiResponse,
  HRWizardDocumentUploadResponse
} from '@/types/hr-wizard';

type QueryReturnValue<T = unknown, E = unknown, M = unknown> = {
  error?: E;
  data?: T;
  meta?: M;
};

// Define a service using a base URL and expected endpoints
export const hrWizardApi = createApi({
  reducerPath: 'hrWizardApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/',
    prepareHeaders: (headers) => {
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['HrWizard', 'UserList'],
  endpoints: (builder) => ({
    // Get all users with pagination and filtering
    getAllUsers: builder.query<{ data: UserDocument[]; total: number }, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 10, search = '' }) => ({
        url: 'user',
        params: { page, limit, search },
      }),
      providesTags: ['UserList'],
    }),
    
    // Get user wizard data
    getUserWizardData: builder.query<HRWizardFormData, string>({
      query: (userId) => `user/${userId}/wizard`,
      providesTags: (result, error, userId) => [{ type: 'HrWizard', id: userId }],
    }),
    
    // Save wizard step data
    saveWizardStep: builder.mutation<HRWizardApiResponse, { userId: string; stepId: string; data: any; isDraft?: boolean }>({
      query: ({ userId, ...stepData }) => ({
        url: `user/${userId}/wizard/step/${stepData.stepId}`,
        method: 'PATCH',
        body: { data: stepData.data, isDraft: stepData.isDraft ?? true },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'HrWizard', id: userId },
        'UserList',
      ],
    }),

    // Save entire wizard data (for final submission or draft)
    saveWizardData: builder.mutation<HRWizardApiResponse, { userId: string; data: Partial<HRWizardFormData>; isDraft?: boolean }>({
      query: ({ userId, data, isDraft = false }) => ({
        url: `user/${userId}/wizard`,
        method: 'PATCH',
        body: { ...data, isDraft },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'HrWizard', id: userId },
        'UserList',
      ],
    }),

    // Submit the wizard (final submission)
    submitWizard: builder.mutation<HRWizardApiResponse, { userId: string; data: HRWizardFormData }>({
      query: ({ userId, data }) => ({
        url: `user/${userId}/submit-wizard`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'HrWizard', id: userId },
        'UserList',
      ],
    }),

    // Upload document
    uploadDocument: builder.mutation<HRWizardDocumentUploadResponse, { userId: string; file: File; documentType: string }>({
      query: ({ userId, file, documentType }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        
        return {
          url: `user/${userId}/upload-document`,
          method: 'POST',
          body: formData,
          // Important: Don't set Content-Type, let the browser set it with the boundary
          headers: {},
          formData: true,
        };
      },
      invalidatesTags: (result, error, { userId }) => [
        { type: 'HrWizard', id: userId },
      ],
    }),

    // Delete document
    deleteDocument: builder.mutation<HRWizardApiResponse, { userId: string; documentUrl: string }>({
      query: ({ userId, documentUrl }) => ({
        url: `user/${userId}/document`,
        method: 'DELETE',
        body: { documentUrl },
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'HrWizard', id: userId },
      ],
    }),

    // Generate PDF for a specific form
    generatePdf: builder.mutation<{
      success: boolean;
      url: string;
      message: string;
    }, { userId: string; formType: string }>({
      query: ({ userId, formType }) => ({
        url: `user/${userId}/generate-pdf/${formType}`,
        method: 'POST',
        responseType: 'blob',
      }),
      transformResponse: async (response: Blob, meta, { formType }) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formType}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true, url, message: 'PDF generated successfully' };
      },
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  endpoints: {
    getAllUsers,
    getUserWizardData,
    saveWizardStep,
    saveWizardData,
    submitWizard,
    uploadDocument,
    deleteDocument,
    generatePdf
  },
  useGetAllUsersQuery,
  useGetUserWizardDataQuery,
  useSaveWizardStepMutation,
  useSaveWizardDataMutation,
  useSubmitWizardMutation,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGeneratePdfMutation,
} = hrWizardApi;
