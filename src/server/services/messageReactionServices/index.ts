// src/server/services/messageReactionServices/index.ts
import { crudManager } from '@/server/managers/crudManager';
import { catchAsync } from '@/server/shared/catchAsync';
import { ERROR, SUCCESS } from '@/shared/constants';
import { TicketComment } from '@/models';
import mongoose from 'mongoose';

// Add reaction to a message
export const addReaction = catchAsync(async ({ messageId, userId, emoji }) => {
  if (!messageId || !userId || !emoji) {
    return { status: ERROR, message: "Message ID, User ID, and emoji are required" };
  }
  
  // Validate that the message exists
  const messageResponse = await crudManager.mongooose.find('TICKET_COMMENT_MASTER', {
    filter: { _id: messageId }
  });
  
  if (messageResponse.status !== SUCCESS || !messageResponse.data.length) {
    return { status: ERROR, message: "Message not found" };
  }
  
  // Find the message and update or add reaction
  const message = await TicketComment.findById(messageId);
  
  if (!message) {
    return { status: ERROR, message: "Message not found" };
  }
  
  // Initialize reactions array if it doesn't exist
  if (!message.reactions) {
    message.reactions = [];
  }
  
  // Check if user already reacted with this emoji
  const existingReactionIndex = message.reactions.findIndex(
    reaction => reaction.emoji === emoji && reaction.userId.toString() === userId
  );
  
  if (existingReactionIndex > -1) {
    // User already reacted with this emoji, so we'll remove it (toggle behavior)
    message.reactions.splice(existingReactionIndex, 1);
  } else {
    // Add new reaction
    message.reactions.push({
      emoji,
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: new Date()
    });
  }
  
  // Save the message
  await message.save();
  
  // Get the updated message with populated user info
  const updatedMessage = await TicketComment.findById(messageId)
    .populate('user')
    .populate('reactions.userId');
  
  return {
    status: SUCCESS,
    data: updatedMessage
  };
});

// Remove reaction from a message
export const removeReaction = catchAsync(async ({ messageId, userId, emoji }) => {
  if (!messageId || !userId || !emoji) {
    return { status: ERROR, message: "Message ID, User ID, and emoji are required" };
  }
  
  // Find the message and remove reaction
  const message = await TicketComment.findById(messageId);
  
  if (!message) {
    return { status: ERROR, message: "Message not found" };
  }
  
  // Check if reactions array exists
  if (!message.reactions || message.reactions.length === 0) {
    return { status: SUCCESS, data: message }; // No reactions to remove
  }
  
  // Filter out the specific reaction
  message.reactions = message.reactions.filter(
    reaction => !(reaction.emoji === emoji && reaction.userId.toString() === userId)
  );
  
  // Save the message
  await message.save();
  
  // Get the updated message with populated user info
  const updatedMessage = await TicketComment.findById(messageId)
    .populate('user')
    .populate('reactions.userId');
  
  return {
    status: SUCCESS,
    data: updatedMessage
  };
});

// Get reactions for a message
export const getMessageReactions = catchAsync(async (messageId) => {
  if (!messageId) {
    return { status: ERROR, message: "Message ID is required" };
  }
  
  // Find the message
  const message = await TicketComment.findById(messageId)
    .populate('reactions.userId', 'firstName lastName avatar');
  
  if (!message) {
    return { status: ERROR, message: "Message not found" };
  }
  
  // If no reactions, return empty array
  if (!message.reactions) {
    return {
      status: SUCCESS,
      data: []
    };
  }
  
  // Group reactions by emoji for easier display
  const groupedReactions = message.reactions.reduce((groups:any, reaction:any) => {
    const { emoji, userId } = reaction;
    
    if (!groups[emoji]) {
      groups[emoji] = [];
    }
    
    groups[emoji].push(userId);
    
    return groups;
  }, {});
  
  return {
    status: SUCCESS,
    data: {
      messageId,
      reactions: message.reactions,
      groupedReactions
    }
  };
});