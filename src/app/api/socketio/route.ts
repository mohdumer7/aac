// src/app/api/socketio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { dbConnect } from '@/lib/mongoose';
import { TicketComment, Ticket } from '@/models';
import { createTicketHistory } from '@/server/services/ticketHistoryServices';
import { MessageReaction } from '@/types/next';
import { getSocketIO } from '@/lib/socket';

// Global variable to track the Socket.io server instance
let io: SocketIOServer;

// Keep track of user connections and rooms
const userConnections = new Map<string, Set<string>>();
const typingUsers = new Map<string, Map<string, boolean>>();
const userStatus = new Map<string, string>();
const ticketRooms = new Map<string, Set<string>>(); // Track rooms and their members
const messageQueue = new Map<string, any[]>(); // Queue for storing messages when no users are in room

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ message: 'Socket.IO API is running' });
}

// Add a POST handler for client ping
export async function POST() {
  return NextResponse.json({
    timestamp: Date.now()
  });
}

function initializeSocketIO(server: any): SocketIOServer {
  // If the Socket.io server hasn't been initialized, set it up
  if (!io) {
    // Initialize ticket rooms from database
    console.log('Setting up Socket.io server...');
    
    const initializeTicketRooms = async () => {
      try {
        await dbConnect();
        // Get all tickets from database
        const tickets = await Ticket.find({}).select('_id roomId');
        
        // Create rooms for all tickets
        tickets.forEach(ticket => {
          const roomId = ticket.roomId || `ticket-${ticket._id}`;
          ticketRooms.set(roomId, new Set());
        });
        
        console.log(`Initialized ${ticketRooms.size} ticket rooms`);
      } catch (error) {
        console.error('Error initializing ticket rooms:', error);
      }
    };

    io = new SocketIOServer(server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 30000,
      pingInterval: 25000,
      connectionStateRecovery: {
        // Enable the connection state recovery feature
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
      }
    });
    
    // Initialize rooms
    // (don't await here to avoid blocking)
    initializeTicketRooms();

    // Set up event handlers
    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      // Store user data on connection
      const { userId } = socket.handshake.auth;
      if (userId) {
        // Add socket to user's connections
        if (!userConnections.has(userId)) {
          userConnections.set(userId, new Set());
        }
        userConnections.get(userId)?.add(socket.id);
        
        // Set user as online
        userStatus.set(userId, 'online');
        
        // Broadcast user online status to all clients
        io.emit('user-status', { userId, status: 'online' });
      }

      // Handle joining a room
      socket.on('join-room', async (data) => {
        const { roomId, ticketId, userId } = data;
        
        // Create room if it doesn't exist
        if (!ticketRooms.has(roomId)) {
          ticketRooms.set(roomId, new Set());
        }
        
        // Add user to room members
        if (userId) {
          console.log(`Adding user ${userId} to room ${roomId}`);
          ticketRooms.get(roomId)?.add(userId);
        }
        
        // Join the socket to the room
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
        
        // Initialize typing status for this room if not exists
        if (!typingUsers.has(roomId)) {
          typingUsers.set(roomId, new Map());
        }
        
        // Send any queued messages for this room
        if (messageQueue.has(roomId)) {
          const queuedMessages = messageQueue.get(roomId) || [];
          for (const msg of queuedMessages) {
            console.log(`Sending queued message to user ${userId} in room ${roomId}`);
            socket.emit('message', msg);
          }
        }
        
        // Fetch recent messages from database
        try {
          const messages = await TicketComment.find({ ticket: ticketId })
            .sort({ createdAt: 1 }) // Changed from -1 to 1 to get oldest first
            .limit(50)
            .populate([
              { path: 'user' },
              { path: 'mentions' },
              { 
                path: 'replyTo',
                populate: {
                  path: 'user'
                }
              }
            ]);
          
          console.log(`Sending ${messages.length} messages to user ${userId} in room ${roomId}`);
          // Send messages to the client
          socket.emit('messages', messages);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
        
        // Notify other users in the room that this user is online
        if (userId) {
          socket.to(roomId).emit('user-status', { 
            userId, 
            status: userStatus.get(userId) || 'online' 
          });
        }
        
        // Notify the client that join was successful
        socket.emit('joined', { roomId, success: true });
      });

      // Handle leaving a room
      socket.on('leave-room', (data) => {
        const { roomId, userId } = data;
        
        socket.leave(roomId);
        console.log(`Socket ${socket.id} left room ${roomId}`);
        
        // Remove user from room members but keep the room
        if (userId && ticketRooms.has(roomId)) {
          ticketRooms.get(roomId)?.delete(userId);
          console.log(`Removed user ${userId} from room ${roomId}`);
        }
        
        // Remove user from typing status for this room
        if (userId) {
          const roomTyping = typingUsers.get(roomId);
          if (roomTyping) {
            roomTyping.delete(userId);
          }
        }
      });

      // Handle new chat messages
      socket.on('message', async (data) => {
        try {
          const { roomId, ticketId, userId, content, attachments, replyTo, mentions, tempId } = data;
          
          console.log(`Received message from user ${userId} in room ${roomId}: ${content.substring(0, 30)}...`);
          
          // Create a new message document
          const newMessage = new TicketComment({
            ticket: ticketId,
            user: userId,
            content,
            attachments: attachments || [],
            replyTo,
            mentions: mentions || [],
            addedBy: userId,
            updatedBy: userId,
            isActive: true,
            deliveredAt: new Date(),
            readBy: [userId] // Mark as read by sender
          });
          
          // Save to database
          console.log(`Saving message to database for ticket ${ticketId}`);
          const savedMessage = await newMessage.save();
          
          // Populate user information before broadcasting
          await savedMessage.populate([
            { path: 'user' },
            { path: 'mentions' },
            { 
              path: 'replyTo',
              populate: {
                path: 'user'
              }
            }
          ]);
          
          // Create history entry
          console.log(`Creating history entry for ticket ${ticketId}`);
          await createTicketHistory({
            data: {
              ticket: ticketId,
              action: 'COMMENT',
              user: userId,
              details: { messageId: savedMessage._id }
            }
          });
          
          // Always broadcast to the room
          console.log(`Broadcasting message to room ${roomId}`);
          io.to(roomId).emit('message', savedMessage);
          
          // Send acknowledgment to sender
          if (tempId) {
            socket.emit('message-ack', {
              messageId: savedMessage._id,
              tempId,
              status: 'delivered',
              timestamp: savedMessage.createdAt
            });
          }
          
          // Store in message queue for users who join later
          if (!messageQueue.has(roomId)) {
            messageQueue.set(roomId, []);
          }
          console.log(`Adding message to queue for room ${roomId} for persistence`);
          
          // Limit queue size to prevent memory issues
          const queue = messageQueue.get(roomId)!;
          queue.push(savedMessage);
          if (queue.length > 50) {
            queue.shift(); // Remove oldest message if queue is too large
          }
          
          // Also emit typing stopped event
          io.to(roomId).emit('typing', { userId, isTyping: false });
          
          // Reset typing status for this user
          const roomTyping = typingUsers.get(roomId);
          if (roomTyping) {
            roomTyping.set(userId, false);
          }
        } catch (error) {
          console.error('Error handling message:', error);
          console.error(error);
          socket.emit('error', { message: 'Failed to save message' });
        }
      });

      // Handle typing events
      socket.on('typing', (data) => {
        const { roomId, userId, isTyping } = data;
        
        // Update typing status for this user in this room
        const roomTyping = typingUsers.get(roomId);
        if (roomTyping) {
          roomTyping.set(userId, isTyping);
        }
        
        // Broadcast typing status to room (except sender)
        socket.to(roomId).emit('typing', { userId, isTyping });
      });

      // Handle message reactions
      socket.on('message-reaction', async (data) => {
        try {
          console.log('Received reaction:', data);
          const { messageId, userId, emoji, action, roomId } = data;
          
          // Get the message from database
          const message = await TicketComment.findById(messageId);
          if (!message) {
            return socket.emit('error', { message: 'Message not found' });
          }
          
          // Initialize reactions array if not exists
          if (!message.reactions) {
            message.reactions = [];
          }
          
          if (action === 'remove') {
            // Remove reaction
            message.reactions = message.reactions.filter(
              reaction => !(reaction.emoji === emoji && reaction.userId.toString() === userId)
            );
          } else {
            // Check if user already reacted with this emoji
            const existingReactionIndex = message.reactions.findIndex(
              reaction => reaction.emoji === emoji && reaction.userId.toString() === userId
            );
            
            if (existingReactionIndex > -1) {
              // User already reacted with this emoji, so remove it (toggle)
              message.reactions.splice(existingReactionIndex, 1);
            } else {
              // Add new reaction
              // @ts-ignore - Type mismatch is expected but works at runtime
              message.reactions.push({
                emoji,
                userId,
                createdAt: new Date()
              });
            }
          }
          
          // Save to database
          await message.save();
          
          // Populate and broadcast updated reactions
          await message.populate('reactions.userId');
          io.to(roomId).emit('message-reaction-update', {
            messageId,
            reactions: message.reactions
          });
        } catch (error) {
          console.error('Error handling reaction:', error);
          socket.emit('error', { message: 'Failed to save reaction' });
        }
      });

      // Handle message read status
      socket.on('read-receipt', async (data) => {
        try {
          const { messageIds, userId, roomId, ticketId } = data;
          
          if (!messageIds || !messageIds.length) return;
          
          // Update multiple messages at once
          const result = await TicketComment.updateMany(
            { _id: { $in: messageIds }, readBy: { $ne: userId } },
            { 
              $set: { isRead: true, readAt: new Date() },
              $addToSet: { readBy: userId }
            }
          );
          
          // Broadcast to relevant room
          io.to(roomId).emit('read-receipt-update', {
            messageIds,
            userId,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
          socket.emit('error', { message: 'Failed to mark messages as read' });
        }
      });

      // Handle user status updates
      socket.on('user-status', (data) => {
        const { userId, status, roomId } = data;
        
        if (userId) {
          userStatus.set(userId, status);
          
          // Broadcast to all connected clients
          io.emit('user-status', { userId, status });
          
          // Also broadcast to specific room if provided
          if (roomId) {
            io.to(roomId).emit('user-status', { userId, status });
          }
        }
      });

      // Handle file upload notifications
      socket.on('file-upload', (data) => {
        const { roomId, fileInfo } = data;
        // Broadcast file upload to room
        io.to(roomId).emit('file-upload', fileInfo);
      });

      // Handle disconnections
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        if (userId) {
          // Remove socket from user's connections
          const userSockets = userConnections.get(userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            
            // If user has no more connections, mark as offline
            if (userSockets.size === 0) {
              userStatus.set(userId, 'offline');
              
              // Broadcast user offline status after a short delay
              // (to handle page refreshes and brief disconnections)
              setTimeout(() => {
                const currentUserSockets = userConnections.get(userId);
                if (!currentUserSockets || currentUserSockets.size === 0) {
                  io.emit('user-status', { 
                    userId, 
                    status: 'offline', 
                    lastSeen: new Date() 
                  });
                }
              }, 5000);
            }
          }
          
          // Remove user from typing status in all rooms
          for (const [roomId, typingMap] of typingUsers.entries()) {
            if (typingMap.has(userId)) {
              typingMap.delete(userId);
              io.to(roomId).emit('typing', { userId, isTyping: false });
            }
          }
        }
      });
    });
  }
  
  return io;
}

// Do not export `initializeSocketIO` directly