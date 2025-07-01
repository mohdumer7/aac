// src/server/models/Chat.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Chat message schema
 * Represents a single message in a ticket chat
 */
const ChatSchema = new Schema({
  // Reference to the ticket this message belongs to
  ticketId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Ticket', 
    required: true,
    index: true // Add index for faster queries
  },
  
  // User who sent the message
  senderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Message content
  message: { 
    type: String, 
    required: true 
  },
  
  // Message delivery status
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read'], 
    default: 'sent' 
  },
  
  // When the message was sent
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true // Add index for sorting by time
  },
  
  // File attachments
  attachments: [{ 
    fileName: String,
    fileType: String,
    fileSize: Number,
    url: String,
    uploadedAt: Date
  }],
  
  // Reference to a message this is replying to
  replyTo: { 
    type: Schema.Types.ObjectId, 
    ref: 'Chat' 
  },
  
  // Users mentioned in this message
  mentions: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // Users who have read this message
  readBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // When the message was read
  readAt: { 
    type: Date 
  },
  
  // Whether the message has been edited
  isEdited: { 
    type: Boolean, 
    default: false 
  },
  
  // When the message was edited
  editedAt: { 
    type: Date 
  },
  
  // Message reactions
  reactions: [{
    emoji: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user information
ChatSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for reply information
ChatSchema.virtual('replyToMessage', {
  ref: 'Chat',
  localField: 'replyTo',
  foreignField: '_id',
  justOne: true
});

// Create model if it doesn't exist
module.exports = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);