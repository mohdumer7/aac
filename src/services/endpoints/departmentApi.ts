import { baseApi } from '../api';

// Define the Department type based on expected data from the backend
export interface Department {
  _id: string;
  name: string;
  // Add other fields if necessary, e.g., code, description
}

// Define a type for the API response that wraps the data in a 'data' property
interface GetDepartmentsResponse {
  data: Department[];
  message?: string;
}

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<GetDepartmentsResponse, void>({
      query: () => 'departments',
      providesTags: (result) => 
        result && result.data
          ? [...result.data.map(({ _id }) => ({ type: 'Department' as const, id: _id })), { type: 'Department', id: 'LIST' }]
          : [{ type: 'Department', id: 'LIST' }],
      transformResponse: (response: GetDepartmentsResponse) => {
        // Ensuring the transformation aligns with the expected GetDepartmentsResponse structure
        // If the actual API response is just Department[], adjust accordingly or ensure backend sends { data: Department[] }
        return response; 
      },
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
} = departmentApi;
