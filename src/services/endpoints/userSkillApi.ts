// src/services/endpoints/userSkillApi.ts
import { baseApi } from '../api';

export interface UserSkillApiResponse {
  status: string;
  message?: string;
  data?: any;
  error?: any;
}

export interface UserSkillParams {
  filter?: object;
  userId?: string;
  categoryId?: string;
}

export const userSkillApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserSkills: builder.query<UserSkillApiResponse, UserSkillParams>({
      query: ({ filter, userId, categoryId }) => {
        const params = new URLSearchParams();
        filter && params.append('filter', JSON.stringify(filter));
        userId && params.append('userId', userId);
        categoryId && params.append('categoryId', categoryId);
        return `user-skill?${params.toString()}`;
      },
      transformResponse: (response: UserSkillApiResponse) => response,
      providesTags: ['UserSkill'],
    }),

    createUserSkill: builder.mutation<UserSkillApiResponse, any>({
      query: (skillData) => ({
        url: 'user-skill',
        method: 'POST',
        body: { action: 'create', data: skillData },
      }),
      invalidatesTags: ['UserSkill'],
    }),

    updateUserSkill: builder.mutation<UserSkillApiResponse, any>({
      query: (skillData) => ({
        url: 'user-skill',
        method: 'POST',
        body: { action: 'update', data: skillData },
      }),
      invalidatesTags: ['UserSkill'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserSkillsQuery,
  useCreateUserSkillMutation,
  useUpdateUserSkillMutation,
} = userSkillApi;