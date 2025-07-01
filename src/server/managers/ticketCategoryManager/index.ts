// src/server/managers/ticketCategoryManager/index.ts
import { 
    getTicketCategories,
    getTicketCategoryById,
    createTicketCategory,
    updateTicketCategory,
    getTicketCategoriesByDepartment
  } from '@/server/services/ticketCategoryServices';
  
  export const ticketCategoryManager = {
    getTicketCategories,
    getTicketCategoryById,
    createTicketCategory,
    updateTicketCategory,
    getTicketCategoriesByDepartment
  };