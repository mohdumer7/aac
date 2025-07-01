// src/server/managers/ticketHistoryManager/index.ts
import { 
    getTicketHistory,
    getTicketHistoryByTicketId,
    createTicketHistory
  } from '@/server/services/ticketHistoryServices';
  
  export const ticketHistoryManager = {
    getTicketHistory,
    getTicketHistoryByTicketId,
    createTicketHistory
  };