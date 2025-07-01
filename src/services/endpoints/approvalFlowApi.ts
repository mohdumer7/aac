import { baseApi } from '../api';

// Define a basic interface for an Approval Flow item
// We can expand this later based on the actual model structure
export interface ApprovalFlow {
  _id: string;
  flowName: string;
  description?: string;
  flowDefinition: any; // Consider defining a more specific type for flowDefinition
  departmentId?: string;
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// API Response structure
export interface ApprovalFlowApiResponse {
  status: string;
  message?: string;
  data?: ApprovalFlow | ApprovalFlow[] | any; // Can be a single item, an array, or other response data
  error?: any;
}

// Parameters for fetching multiple approval flows
export interface GetApprovalFlowsParams {
  filter?: Record<string, any>;
  sort?: Record<string, any>;
  page?: number;
  limit?: number;
  // Add any other specific query params your API supports
}

// Payload for creating an approval flow
export interface CreateApprovalFlowPayload {
  flowName: string;
  description?: string;
  flowDefinition: any; // Or a more specific type
  departmentId?: string;
  createdBy: string;
}

// Payload for updating an approval flow
export interface UpdateApprovalFlowPayload {
  _id: string;
  flowName?: string;
  description?: string;
  flowDefinition?: any; // Or a more specific type
  departmentId?: string;
}

// Payload for deleting an approval flow (just the ID)
export interface DeleteApprovalFlowPayload {
  _id: string;
}

export const approvalFlowApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all approval flows (with optional query params)
    getApprovalFlows: builder.query<ApprovalFlowApiResponse, GetApprovalFlowsParams | void>({
      query: (params) => {
        const urlParams = new URLSearchParams();
        if (params) {
          if (params.filter) urlParams.append('filter', JSON.stringify(params.filter));
          if (params.sort) urlParams.append('sort', JSON.stringify(params.sort));
          if (params.page) urlParams.append('page', params.page.toString());
          if (params.limit) urlParams.append('limit', params.limit.toString());
        }
        return `approval-flow?${urlParams.toString()}`;
      },
      providesTags: (result) =>
        result && result.data && Array.isArray(result.data)
          ? [
              ...result.data.map(({ _id }) => ({ type: 'ApprovalFlow' as const, id: _id })),
              { type: 'ApprovalFlow', id: 'LIST' },
            ]
          : [{ type: 'ApprovalFlow', id: 'LIST' }],
      transformResponse: (response: ApprovalFlowApiResponse) => response,
    }),

    // Get a single approval flow by ID
    getApprovalFlowById: builder.query<ApprovalFlowApiResponse, string>({
      query: (id) => `approval-flow?id=${id}`,
      providesTags: (result, error, id) => [{ type: 'ApprovalFlow', id }],
      transformResponse: (response: ApprovalFlowApiResponse) => response,
    }),

    // Create a new approval flow
    createApprovalFlow: builder.mutation<ApprovalFlowApiResponse, CreateApprovalFlowPayload>({
      query: (payload) => ({
        url: 'approval-flow',
        method: 'POST',
        body: { action: 'create', data: payload },
      }),
      invalidatesTags: [{ type: 'ApprovalFlow', id: 'LIST' }],
    }),

    // Update an existing approval flow
    updateApprovalFlow: builder.mutation<ApprovalFlowApiResponse, UpdateApprovalFlowPayload>({
      query: ({ _id, ...payload }) => ({
        url: 'approval-flow',
        method: 'POST',
        body: { action: 'update', data: { _id, ...payload } },
      }),
      invalidatesTags: (result, error, { _id }) => [{ type: 'ApprovalFlow', id: _id }, { type: 'ApprovalFlow', id: 'LIST' }],
    }),

    // Delete an approval flow
    deleteApprovalFlow: builder.mutation<ApprovalFlowApiResponse, DeleteApprovalFlowPayload>({
      query: (payload) => ({
        url: 'approval-flow',
        method: 'POST',
        body: { action: 'delete', data: payload },
      }),
      invalidatesTags: (result, error, { _id }) => [{ type: 'ApprovalFlow', id: _id }, { type: 'ApprovalFlow', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetApprovalFlowsQuery,
  useGetApprovalFlowByIdQuery,
  useCreateApprovalFlowMutation,
  useUpdateApprovalFlowMutation,
  useDeleteApprovalFlowMutation,
} = approvalFlowApi;
