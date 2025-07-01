// services/endpoints/fileApi.ts
import { baseApi } from "../api";

export const fileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadFiles: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: `sml`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["SmlFile"], // Or create a separate File tag
    }),
  }),
  overrideExisting: false,
});

export const { useUploadFilesMutation } = fileApi;
