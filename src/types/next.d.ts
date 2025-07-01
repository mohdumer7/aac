// src/types/next.d.ts
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import mongoose from 'mongoose';

// Extend NextApiResponse to include socket server
export interface NextApiResponseServerIO extends NextApiResponse {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
}

// User typing indicator
export interface UserTyping {
  userId: string;
  isTyping: boolean;
}

// Message reaction
export interface MessageReaction {
  emoji: string;
  userId: string | mongoose.Types.ObjectId;
  createdAt: Date;
}

// Chat message
export interface ChatMessage {
  _id: string;
  ticket: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  content: string;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
  }>;
  replyTo?: {
    _id: string;
    content: string;
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  };
  mentions?: string[];
  reactions?: MessageReaction[];
  isEdited: boolean;
  isRead: boolean;
  readBy: string[];
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: string;
  updatedAt: string;
}

// Socket.io Events
export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  
  // Chat events
  message: (message: ChatMessage) => void;
  'messages-read': (data: { userId: string; messageIds: string[]; timestamp: Date }) => void;
  typing: (data: UserTyping) => void;
  'user-status': (data: { userId: string; status: string; lastSeen?: Date }) => void;
  'message-reaction': (data: { messageId: string; reactions: MessageReaction[] }) => void;
  'file-upload': (fileInfo: any) => void;
  error: (error: { message: string }) => void;
}

// Socket.io Emits
export interface SocketEmits {
  join: (ticketId: string) => void;
  leave: (ticketId: string) => void;
  message: (data: {
    ticketId: string;
    userId: string;
    content: string;
    attachments?: any[];
    replyTo?: string;
    mentions?: string[];
  }) => void;
  'mark-read': (data: { messageIds: string[]; userId: string }) => void;
  typing: (data: { ticketId: string; userId: string; isTyping: boolean }) => void;
  'status-update': (data: { userId: string; status: string }) => void;
  reaction: (data: { messageId: string; userId: string; emoji: string }) => void;
  'edit-message': (data: {
    ticketId: string;
    messageId: string;
    content: string;
    updatedBy: string;
  }) => void;
  'file-upload': (data: { ticketId: string; fileInfo: any }) => void;
}

// Socket.io client with typed events
export interface TypedSocket extends SocketIOClient.Socket {
  on: <E extends keyof SocketEvents>(event: E, listener: SocketEvents[E]) => this;
  emit: <E extends keyof SocketEmits>(event: E, ...args: Parameters<SocketEmits[E]>) => this;
}