// src/server/services/ticketHistoryServices/index.ts
import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';

export const getTicketHistory = catchAsync(async (options) => {
  const result = await crudManager.mongooose.find('TICKET_HISTORY_MASTER', options);
  return result;
});

export const getTicketHistoryByTicketId = catchAsync(async (ticketId) => {
  const result = await crudManager.mongooose.find('TICKET_HISTORY_MASTER', {
    filter: { ticket: ticketId },
    sort: { createdAt: 'asc' }
  });
  return result;
});

export const createTicketHistory = catchAsync(async (options) => {
  const result = await crudManager.mongooose.create('TICKET_HISTORY_MASTER', options);
  return result;
});