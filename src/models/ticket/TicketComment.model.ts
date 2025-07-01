// src/models/ticket/TicketComment.model.ts
import mongoose, { Document, Model, Query, Schema } from "mongoose";

interface Attachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: Date;
}

interface Reaction {
  emoji: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface TicketCommentDocument extends Document {
  ticket: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  attachments?: Attachment[];
  replyTo?: mongoose.Types.ObjectId;
  mentions?: mongoose.Types.ObjectId[];
  reactions?: Reaction[];
  isEdited: boolean;
  editHistory?: Array<{
    content: string;
    editedAt: Date;
  }>;
  isRead: boolean;
  readBy: mongoose.Types.ObjectId[];
  deliveredAt: Date;
  readAt: Date;
  isActive: boolean;
  addedBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  markAsRead: (userId: mongoose.Types.ObjectId) => Promise<TicketCommentDocument>;
}

const AttachmentSchema = new Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const ReactionSchema = new Schema({
  emoji: { type: String, required: true },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

const EditHistorySchema = new Schema({
  content: { type: String, required: true },
  editedAt: { type: Date, default: Date.now }
});

const TicketCommentSchema: Schema<TicketCommentDocument> = new Schema({
  ticket: {
    type: Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
    index: true // Add index for better query performance
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: { type: String, required: true },
  attachments: [AttachmentSchema],
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: "TicketComment"
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  reactions: [ReactionSchema],
  isEdited: { type: Boolean, default: false },
  editHistory: [EditHistorySchema],
  isRead: { type: Boolean, default: false },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  deliveredAt: { type: Date },
  readAt: { type: Date },
  isActive: { type: Boolean, default: true },
  addedBy: { type: String },
  updatedBy: { type: String }
}, { 
  timestamps: true,
  // Add index for better performance when querying by date
  indexes: [
    { createdAt: -1 }
  ]
});

// Pre-save hook to set deliveredAt time when a message is created
TicketCommentSchema.pre('save', function(next) {
  if (this.isNew) {
    this.deliveredAt = new Date();
  }
  next();
});

// Auto-populate related fields
TicketCommentSchema.pre<Query<any, TicketCommentDocument>>(/^find/, function (next) {
  this.populate([
    { path: "user", select: "_id firstName lastName avatar" },
    { path: "mentions", select: "_id firstName lastName" },
    { path: "reactions.userId", select: "_id firstName lastName" },
    {
      path: "replyTo",
      populate: {
        path: "user",
        select: "_id firstName lastName"
      }
    }
  ]);
  next();
});

// Method to mark as read
TicketCommentSchema.methods.markAsRead = function(userId: mongoose.Types.ObjectId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
  }
  
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread messages for a user
TicketCommentSchema.statics.getUnreadMessages = function(ticketId: string, userId: string) {
  return this.find({
    ticket: ticketId,
    user: { $ne: userId },
    readBy: { $ne: userId }
  });
};

// Method to edit a message
TicketCommentSchema.methods.editMessage = function(newContent: string) {
  // Save current content to history
  if (!this.editHistory) {
    this.editHistory = [];
  }
  
  this.editHistory.push({
    content: this.content,
    editedAt: new Date()
  });
  
  // Update content
  this.content = newContent;
  this.isEdited = true;
  this.updatedAt = new Date();
  
  return this.save();
};

const TicketComment: Model<TicketCommentDocument> = 
  mongoose.models.TicketComment || mongoose.model<TicketCommentDocument>("TicketComment", TicketCommentSchema);

export default TicketComment;