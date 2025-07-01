// src/server/services/ticketCategoryServices/index.ts
import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';

export const getTicketCategories = catchAsync(async (options) => {
  const result = await crudManager.mongooose.find('TICKET_CATEGORY_MASTER', options);
  return result;
});

export const getTicketCategoryById = catchAsync(async (id) => {
  const result = await crudManager.mongooose.find('TICKET_CATEGORY_MASTER', {
    filter: { _id: id }
  });
  return result;
});

export const createTicketCategory = catchAsync(async (options) => {
  const result = await crudManager.mongooose.create('TICKET_CATEGORY_MASTER', options);
  return result;
});

export const updateTicketCategory = catchAsync(async (options) => {
  const result = await crudManager.mongooose.update('TICKET_CATEGORY_MASTER', options);
  return result;
});

export const getTicketCategoriesByDepartment = catchAsync(async (departmentId) => {
  const result = await crudManager.mongooose.find('TICKET_CATEGORY_MASTER', {
    filter: { 
      department: departmentId,
      isActive: true
    }
  });
  return result;
});