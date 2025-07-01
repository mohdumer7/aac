// src/server/managers/ticketTaskManager/index.ts
import { 
    getTicketTasks,
    getTicketTasksByTicketId,
    createTicketTask,
    updateTicketTask,
    changeTaskStatus
  } from '@/server/services/ticketTaskServices';
  
  export const ticketTaskManager = {
    getTicketTasks,
    getTicketTasksByTicketId,
    createTicketTask,
    updateTicketTask,
    changeTaskStatus
  };