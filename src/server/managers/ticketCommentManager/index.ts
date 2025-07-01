// src/server/managers/ticketCommentManager/index.ts
import { 
  getTicketComments,
  getTicketCommentsByTicketId,
  createTicketComment,
  updateTicketComment,
  markAsRead,
  getUnreadCount,
  searchMessages
} from '@/server/services/ticketCommentServices';

export const ticketCommentManager = {
  getTicketComments,
  getTicketCommentsByTicketId,
  createTicketComment,
  updateTicketComment,
  markAsRead,
  getUnreadCount,
  searchMessages
};