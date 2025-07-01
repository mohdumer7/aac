import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';

export const getApplicationData = catchAsync(async (options) => {
  const {db,operations} = options
  const result = await crudManager.mongooose.find(options.db, operations);
  return result;
});

export const updateApplicationData = catchAsync(async (options:any) => {
  const result = await crudManager.mongooose.update(options.db, options);
  return result;
});

export const createApplicationData = catchAsync(async (options:any) => {
  const result = await crudManager.mongooose.create(options.db, options);
  return result;
});
