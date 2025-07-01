import { baseApi } from '@/services/api';
import { HRMSFormTypes } from '@/types/hrms';

// HRMS API endpoints using RTK Query
export const hrmsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // === Dashboard and Overview ===
    getHRMSDashboard: builder.query({
      query: (filters = {}) => ({
        url: 'hrms',
        params: filters
      }),
      providesTags: ['HRMS_Dashboard']
    }),

    // === Generic Form Operations ===
    getForms: builder.query({
      query: ({ formType, ...params }) => ({
        url: `hrms/forms/${formType}`,
        params
      }),
      providesTags: (result, error, { formType }) => [
        { type: 'HRMS_Form', id: formType },
        'HRMS_Form'
      ]
    }),

    getFormById: builder.query({
      query: ({ formType, id }) => `hrms/forms/${formType}/${id}`,
      providesTags: (result, error, { formType, id }) => [
        { type: 'HRMS_Form', id: `${formType}_${id}` }
      ]
    }),

    createForm: builder.mutation({
      query: ({ formType, data }) => ({
        url: `hrms/forms/${formType}`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result, error, { formType }) => [
        { type: 'HRMS_Form', id: formType },
        'HRMS_Dashboard'
      ]
    }),

    updateForm: builder.mutation({
      query: ({ formType, id, data }) => ({
        url: `hrms/forms/${formType}/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { formType, id }) => [
        { type: 'HRMS_Form', id: `${formType}_${id}` },
        { type: 'HRMS_Form', id: formType },
        'HRMS_Dashboard'
      ]
    }),

    deleteForm: builder.mutation({
      query: ({ formType, id }) => ({
        url: `hrms/forms/${formType}/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, { formType }) => [
        { type: 'HRMS_Form', id: formType },
        'HRMS_Dashboard'
      ]
    }),

    saveDraft: builder.mutation({
      query: ({ formType, id, data }) => ({
        url: `hrms/forms/${formType}/${id}/save-draft`,
        method: 'POST',
        body: data
      }),
      invalidatesTags: (result, error, { formType, id }) => [
        { type: 'HRMS_Form', id: `${formType}_${id}` }
      ]
    }),

    submitForm: builder.mutation({
      query: ({ formType, id }) => ({
        url: `hrms/forms/${formType}/${id}/submit`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, { formType, id }) => [
        { type: 'HRMS_Form', id: `${formType}_${id}` },
        { type: 'HRMS_Form', id: formType },
        'HRMS_Dashboard',
        'HRMS_ApprovalInstance'
      ]
    }),

    // === Specific Form Type Operations ===
    // Manpower Requisition
    getManpowerRequisitions: builder.query({
      query: (params = {}) => ({
        url: 'hrms/manpower-requisition',
        params
      }),
      providesTags: ['ManpowerRequisition']
    }),

    getManpowerRequisitionById: builder.query({
      query: (id) => `hrms/manpower-requisition/${id}`,
      providesTags: (result, error, id) => [
        { type: 'ManpowerRequisition', id }
      ]
    }),

    createManpowerRequisition: builder.mutation({
      query: (data) => ({
        url: 'hrms/manpower-requisition',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['ManpowerRequisition', 'HRMS_Dashboard']
    }),

    updateManpowerRequisition: builder.mutation({
      query: ({ id, data }) => ({
        url: `hrms/manpower-requisition/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ManpowerRequisition', id },
        'ManpowerRequisition'
      ]
    }),

    submitManpowerRequisition: builder.mutation({
      query: (id) => ({
        url: `hrms/manpower-requisition/${id}/submit`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ManpowerRequisition', id },
        'ManpowerRequisition',
        'HRMS_ApprovalInstance'
      ]
    }),

    // === Approval Flow Operations ===
    getApprovalFlows: builder.query({
      query: (params = {}) => ({
        url: 'hrms/approval-flows',
        params
      }),
      providesTags: ['HRMS_ApprovalFlow']
    }),

    getApprovalFlowById: builder.query({
      query: (id) => `hrms/approval-flows/${id}`,
      providesTags: (result, error, id) => [
        { type: 'HRMS_ApprovalFlow', id }
      ]
    }),

    createApprovalFlow: builder.mutation({
      query: (data) => ({
        url: 'hrms/approval-flows',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['HRMS_ApprovalFlow']
    }),

    updateApprovalFlow: builder.mutation({
      query: ({ id, data }) => ({
        url: `hrms/approval-flows/${id}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HRMS_ApprovalFlow', id },
        'HRMS_ApprovalFlow'
      ]
    }),

    deleteApprovalFlow: builder.mutation({
      query: (id) => ({
        url: `hrms/approval-flows/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['HRMS_ApprovalFlow']
    }),

    toggleApprovalFlowStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `hrms/approval-flows/${id}/toggle-status`,
        method: 'POST',
        body: { isActive }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HRMS_ApprovalFlow', id },
        'HRMS_ApprovalFlow'
      ]
    }),

    cloneApprovalFlow: builder.mutation({
      query: ({ id, newFlowName }) => ({
        url: `hrms/approval-flows/${id}/clone`,
        method: 'POST',
        body: { newFlowName }
      }),
      invalidatesTags: ['HRMS_ApprovalFlow']
    }),

    testApprovalFlow: builder.mutation({
      query: ({ id, sampleFormData }) => ({
        url: `hrms/approval-flows/${id}/test`,
        method: 'POST',
        body: { sampleFormData }
      })
    }),

    getApprovalFlowStats: builder.query({
      query: (id) => `hrms/approval-flows/${id}/stats`,
      providesTags: (result, error, id) => [
        { type: 'HRMS_ApprovalFlow', id: `${id}_stats` }
      ]
    }),

    // === Approval Flow Configuration ===
    getAvailableApprovers: builder.query({
      query: (filters = {}) => ({
        url: 'hrms/approval-flows/config/approvers',
        params: filters
      }),
      providesTags: ['HRMS_Config']
    }),

    getDepartments: builder.query({
      query: () => 'hrms/approval-flows/config/departments',
      providesTags: ['HRMS_Config']
    }),

    getRoles: builder.query({
      query: () => 'hrms/approval-flows/config/roles',
      providesTags: ['HRMS_Config']
    }),

    // === Approval Instance Operations ===
    getApprovalInstances: builder.query({
      query: (params = {}) => ({
        url: 'hrms/approval-instances',
        params
      }),
      providesTags: ['HRMS_ApprovalInstance']
    }),

    getApprovalInstanceById: builder.query({
      query: (id) => `hrms/approval-instances/${id}`,
      providesTags: (result, error, id) => [
        { type: 'HRMS_ApprovalInstance', id }
      ]
    }),

    approveInstance: builder.mutation({
      query: ({ id, stepOrder, comments, attachments }) => ({
        url: `hrms/approval-instances/${id}/approve`,
        method: 'POST',
        body: { stepOrder, comments, attachments }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HRMS_ApprovalInstance', id },
        'HRMS_ApprovalInstance',
        'HRMS_Dashboard'
      ]
    }),

    rejectInstance: builder.mutation({
      query: ({ id, stepOrder, comments, attachments }) => ({
        url: `hrms/approval-instances/${id}/reject`,
        method: 'POST',
        body: { stepOrder, comments, attachments }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HRMS_ApprovalInstance', id },
        'HRMS_ApprovalInstance',
        'HRMS_Dashboard'
      ]
    }),

    requestChanges: builder.mutation({
      query: ({ id, stepOrder, comments, attachments }) => ({
        url: `hrms/approval-instances/${id}/request-changes`,
        method: 'POST',
        body: { stepOrder, comments, attachments }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HRMS_ApprovalInstance', id },
        'HRMS_ApprovalInstance'
      ]
    }),

    withdrawInstance: builder.mutation({
      query: ({ id, withdrawalReason, canResubmit }) => ({
        url: `hrms/approval-instances/${id}/withdraw`,
        method: 'POST',
        body: { withdrawalReason, canResubmit }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HRMS_ApprovalInstance', id },
        'HRMS_ApprovalInstance',
        'HRMS_Dashboard'
      ]
    }),

    // === PDF Generation ===
    generateFormPDF: builder.mutation({
      query: ({ formType, id, options = {} }) => ({
        url: `hrms/forms/${formType}/${id}/generate-pdf`,
        method: 'POST',
        body: options
      })
    }),

    // === Flow Designer Support ===
    saveFlowDesign: builder.mutation({
      query: ({ id, designData }) => ({
        url: `hrms/approval-flows/${id}/design`,
        method: 'POST',
        body: { flowDesign: designData }
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HRMS_ApprovalFlow', id },
        'HRMS_ApprovalFlow'
      ]
    })
  }),
  overrideExisting: false
});

// Export hooks for components to use
export const {
  // Dashboard
  useGetHRMSDashboardQuery,

  // Generic Forms
  useGetFormsQuery,
  useGetFormByIdQuery,
  useCreateFormMutation,
  useUpdateFormMutation,
  useDeleteFormMutation,
  useSaveDraftMutation,
  useSubmitFormMutation,

  // Manpower Requisition
  useGetManpowerRequisitionsQuery,
  useGetManpowerRequisitionByIdQuery,
  useCreateManpowerRequisitionMutation,
  useUpdateManpowerRequisitionMutation,
  useSubmitManpowerRequisitionMutation,

  // Approval Flows
  useGetApprovalFlowsQuery,
  useGetApprovalFlowByIdQuery,
  useCreateApprovalFlowMutation,
  useUpdateApprovalFlowMutation,
  useDeleteApprovalFlowMutation,
  useToggleApprovalFlowStatusMutation,
  useCloneApprovalFlowMutation,
  useTestApprovalFlowMutation,
  useGetApprovalFlowStatsQuery,

  // Configuration
  useGetAvailableApproversQuery,
  useGetDepartmentsQuery,
  useGetRolesQuery,

  // Approval Instances
  useGetApprovalInstancesQuery,
  useGetApprovalInstanceByIdQuery,
  useApproveInstanceMutation,
  useRejectInstanceMutation,
  useRequestChangesMutation,
  useWithdrawInstanceMutation,

  // Lazy queries for conditional loading
  useLazyGetFormByIdQuery,
  useLazyGetApprovalFlowByIdQuery,
  useLazyGetApprovalInstanceByIdQuery,

  // PDF Generation
  useGenerateFormPDFMutation,

  // Flow Designer
  useSaveFlowDesignMutation
} = hrmsApi;

// Helper function to get form-specific hooks
export const getFormHooks = (formType: string) => {
  return {
    useGetForms: (params?: any) => useGetFormsQuery({ formType, ...params }),
    useCreateForm: () => useCreateFormMutation(),
    useUpdateForm: () => useUpdateFormMutation(),
    useDeleteForm: () => useDeleteFormMutation(),
    useSaveDraft: () => useSaveDraftMutation(),
    useSubmitForm: () => useSubmitFormMutation()
  };
};

// Form type specific hooks
export const useManpowerRequisitionHooks = () => getFormHooks(HRMSFormTypes.MANPOWER_REQUISITION);
export const useCandidateInformationHooks = () => getFormHooks(HRMSFormTypes.CANDIDATE_INFORMATION);
export const useBusinessTripRequestHooks = () => getFormHooks(HRMSFormTypes.BUSINESS_TRIP_REQUEST);
export const useNewEmployeeJoiningHooks = () => getFormHooks(HRMSFormTypes.NEW_EMPLOYEE_JOINING);
export const useAssetsITAccessHooks = () => getFormHooks(HRMSFormTypes.ASSETS_IT_ACCESS);
export const useEmployeeInformationHooks = () => getFormHooks(HRMSFormTypes.EMPLOYEE_INFORMATION);
export const useAccommodationTransportConsentHooks = () => getFormHooks(HRMSFormTypes.ACCOMMODATION_TRANSPORT_CONSENT);
export const useBeneficiaryDeclarationHooks = () => getFormHooks(HRMSFormTypes.BENEFICIARY_DECLARATION);
export const useNonDisclosureAgreementHooks = () => getFormHooks(HRMSFormTypes.NON_DISCLOSURE_AGREEMENT);