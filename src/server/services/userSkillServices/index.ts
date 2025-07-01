// src/server/services/userSkillServices/index.ts
import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';

export const getUserSkills = catchAsync(async (options) => {
  const result = await crudManager.mongooose.find('USER_SKILL_MASTER', options);
  return result;
});

export const getUserSkillsByUser = catchAsync(async (userId) => {
  const result = await crudManager.mongooose.find('USER_SKILL_MASTER', {
    filter: { 
      user: userId,
      isActive: true
    }
  });
  return result;
});

export const createUserSkill = catchAsync(async (options) => {
  const result = await crudManager.mongooose.create('USER_SKILL_MASTER', options);
  return result;
});

export const updateUserSkill = catchAsync(async (options) => {
  const result = await crudManager.mongooose.update('USER_SKILL_MASTER', options);
  return result;
});

export const getUserSkillsByCategory = catchAsync(async (categoryId) => {
  const result = await crudManager.mongooose.find('USER_SKILL_MASTER', {
    filter: { 
      category: categoryId,
      isActive: true
    },
    sort: { rating: 'asc' }
  });
  return result;
});