// src/server/services/ticketCommentServices/index.ts
import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';
import { ERROR, SUCCESS } from '@/shared/constants';
import { createTicketHistory } from '../ticketHistoryServices';
import { TicketComment } from '@/models';
import mongoose from 'mongoose';

// Get all comments (with optional filtering)
export const getTicketComments = catchAsync(async (options) => {
  const result = await crudManager.mongooose.find('TICKET_COMMENT_MASTER', options);
  return result;
});

// Get all comments for a specific ticket
export const getTicketCommentsByTicketId = catchAsync(async (ticketId) => {
  // Add sort to ensure messages are in chronological order
  const result = await crudManager.mongooose.find('TICKET_COMMENT_MASTER', {
    filter: { ticket: ticketId },
    sort: { createdAt: 'asc' }
  });
  
  return result;
});

// Create a new comment/message
export const createTicketComment = catchAsync(async (options) => {
  console.log("Creating ticket comment with options:", JSON.stringify(options, null, 2));
  
  if (!options.data || !options.data.ticket || !options.data.user) {
    return { status: ERROR, message: "Missing required fields" };
  }
  
  // Extract data for easier handling
  const { ticket, user, content, attachments, replyTo, mentions } = options.data;
  
  // Set delivery timestamp
  const deliveredAt = new Date();
  
  // Create the comment
  const result = await crudManager.mongooose.create('TICKET_COMMENT_MASTER', {
    data: {
      ...options.data,
      deliveredAt,
      isRead: false,
      readBy: [options.data.user] // Mark as read by sender
    }
  });
  
  if (result.status === SUCCESS) {
    // Create history entry
    await createTicketHistory({
      data: {
        ticket,
        action: 'COMMENT',
        user,
        details: { 
          commentId: result.data._id,
          hasAttachments: attachments && attachments.length > 0,
          hasMentions: mentions && mentions.length > 0,
          isReply: !!replyTo
        }
      }
    });
  }
  
  return result;
});

// Update an existing comment
export const updateTicketComment = catchAsync(async (options) => {
  // Make sure we have filter and data
  if (!options.filter || !options.data) {
    return { status: ERROR, message: "Missing filter or update data" };
  }
  
  const result = await crudManager.mongooose.update('TICKET_COMMENT_MASTER', options);
  return result;
});

// Mark comments as read
export const markAsRead = catchAsync(async ({ commentIds, userId }) => {
  if (!commentIds || !commentIds.length || !userId) {
    return { status: ERROR, message: "Missing comment IDs or user ID" };
  }
  
  const objectCommentIds = commentIds.map((id:any) => 
    mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null
  ).filter(Boolean);
  
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
    ? new mongoose.Types.ObjectId(userId) 
    : null;
    
  if (!userObjectId || objectCommentIds.length === 0) {
    return { status: ERROR, message: "Invalid comment IDs or user ID" };
  }
  
  // Update all messages at once
  const result = await TicketComment.updateMany(
    { 
      _id: { $in: objectCommentIds },
      readBy: { $ne: userObjectId }
    },
    { 
      $set: { isRead: true, readAt: new Date() },
      $addToSet: { readBy: userObjectId }
    }
  );
  
  return { 
    status: SUCCESS, 
    data: { 
      modifiedCount: result.modifiedCount 
    }
  };
});

// Get unread message count
export const getUnreadCount = catchAsync(async ({ ticketId, userId }) => {
  if (!ticketId || !userId) {
    return { status: ERROR, message: "Missing ticket ID or user ID" };
  }
  
  const count = await TicketComment.countDocuments({
    ticket: ticketId,
    user: { $ne: userId },
    readBy: { $ne: userId }
  });
  
  return { 
    status: SUCCESS, 
    data: { unreadCount: count }
  };
});

// Search messages
export const searchMessages = catchAsync(async ({ ticketId, searchTerm }) => {
  if (!ticketId || !searchTerm) {
    return { status: ERROR, message: "Missing ticket ID or search term" };
  }
  
  const result = await crudManager.mongooose.find('TICKET_COMMENT_MASTER', {
    filter: { 
      ticket: ticketId,
      content: { $regex: searchTerm, $options: 'i' }
    },
    sort: { createdAt: 'asc' }
  });
  
  return result;
});