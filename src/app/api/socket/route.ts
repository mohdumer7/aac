// src/app/api/socket/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { dbConnect } from '@/lib/mongoose';
import { TicketComment, Ticket } from '@/models';
import { createTicketHistory } from '@/server/services/ticketHistoryServices';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

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

function getSocketIO(server: any): SocketIOServer {
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
      path: '/api/socket',
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
      socket.on('join', async (data) => {
        const { ticketId, userId: joinUserId } = data;
        const roomId = `ticket-${ticketId}`;
        
        // Create room if it doesn't exist
        if (!ticketRooms.has(roomId)) {
          ticketRooms.set(roomId, new Set());
        }
        
        // Add user to room members
        if (joinUserId) {
          console.log(`Adding user ${joinUserId} to room ${roomId}`);
          ticketRooms.get(roomId)?.add(joinUserId);
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
            console.log(`Sending queued message to user ${joinUserId} in room ${roomId}`);
            socket.emit('message', msg);
          }
        }
        
        // Fetch recent messages from database
        try {
          const messages = await TicketComment.find({ ticket: ticketId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate([
              { path: 'user' },
              { path: 'mentions' },
              { path: 'reactions.userId' },
              { 
                path: 'replyTo',
                populate: {
                  path: 'user'
                }
              }
            ]);
          
          console.log(`Sending ${messages.length} messages to user ${joinUserId} in room ${roomId}`);
          // Send messages to the client
          socket.emit('messages', messages);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
        
        // Notify other users in the room that this user is online
        if (joinUserId) {
          socket.to(roomId).emit('user-status', { 
            userId: joinUserId, 
            status: userStatus.get(joinUserId) || 'online' 
          });
        }
        
        // Notify the client that join was successful
        socket.emit('joined', { ticketId, success: true });
      });

      // Handle leaving a room
      socket.on('leave', (ticketId: string) => {
        const roomId = `ticket-${ticketId}`;
        
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
          // Extract message details
          const { ticketId, userId: messageUserId, content, attachments, replyTo, replyToContent, mentions, tempId, user } = data;
          console.log(`Received message from user ${messageUserId} for ticket ${ticketId}`);
          
          // Validate the required fields
          if (!ticketId || !messageUserId || !content) {
            return socket.emit('error', { message: 'Missing required fields for message' });
          }
          
          let userInfo = user || { _id: messageUserId }; // Use provided user info if available
          
          // If user info not provided, try to get it from database
          if (!user && messageUserId) {
            try {
              const dbUser = await fetchUserFromDatabase(messageUserId);
              if (dbUser) {
                userInfo = {
                  _id: messageUserId,
                  firstName: dbUser.firstName || '',
                  lastName: dbUser.lastName || '',
                  avatar: dbUser.avatar || ''
                };
              }
            } catch (error) {
              console.error('Error fetching user info:', error);
              // Continue with basic user info
            }
          }
          
          // Create a message object
          const message = {
            _id: new ObjectId().toString(),
            ticket: ticketId,
            user: userInfo,
            content: content.trim() || ' ', // Ensure not empty
            attachments: attachments || [],
            replyTo,
            replyToContent,
            mentions: mentions || [],
            createdAt: new Date().toISOString(),
            deliveredAt: new Date().toISOString(),
            readBy: [messageUserId],
            tempId // Include tempId to help with matching on the client
          };
          
          const roomId = `ticket-${ticketId}`;
          
          // Save to database if configured
          let savedMessage = message;
          try {
            if (typeof saveMessage === 'function') {
              savedMessage = await saveMessage(message);
            }
          } catch (error) {
            console.error('Error saving message to database:', error);
            // Continue with original message if database save fails
          }
          
          // Send acknowledgment to the sender with tempId for matching
          if (tempId) {
            console.log(`Sending message acknowledgment to sender with tempId ${tempId}`);
            socket.emit('message-ack', {
              messageId: savedMessage._id ? savedMessage._id.toString() : '',
              tempId,
              status: 'delivered',
              timestamp: savedMessage.createdAt
            });
          }
          
          // Now broadcast to everyone EXCEPT the sender
          // This prevents the sender from receiving the message twice
          console.log(`Broadcasting message to others in room ${roomId}`);
          socket.to(roomId).emit('message', savedMessage);
          
          // Store in message queue for users who join later
          if (!messageQueue.has(roomId)) {
            messageQueue.set(roomId, []);
          }
          console.log(`Adding message to queue for room ${roomId}`);
          
          // Limit queue size to prevent memory issues
          const queue = messageQueue.get(roomId)!;
          queue.push(savedMessage);
          if (queue.length > 50) {
            queue.shift(); // Remove oldest message if queue is too large
          }
          
          // Also emit typing stopped event
          io.to(roomId).emit('typing', { userId: messageUserId, isTyping: false });
          
          // Reset typing status for this user
          const roomTyping = typingUsers.get(roomId);
          if (roomTyping) {
            roomTyping.set(messageUserId, false);
          }
        } catch (error) {
          console.error('Error handling message:', error);
          console.error(error);
          socket.emit('error', { message: 'Failed to save message' });
        }
      });

      // Handle typing events
      socket.on('typing', (data) => {
        const { ticketId, userId: typingUserId, isTyping } = data;
        
        // Update typing status for this user in this room
        const roomId = `ticket-${ticketId}`;
        const roomTyping = typingUsers.get(roomId);
        if (roomTyping) {
          roomTyping.set(typingUserId, isTyping);
        }
        
        // Broadcast typing status to room (except sender)
        socket.to(roomId).emit('typing', { userId: typingUserId, isTyping });
      });

      // Handle message reactions
      socket.on('message-reaction', async (data) => {
        try {
          const { messageId, userId: reactionUserId, emoji, action, ticketId } = data;
          console.log(`[REACTION] Handling reaction: ${emoji} from user ${reactionUserId} for message ${messageId}, action: ${action}, ticketId: ${ticketId}`);
          
          // Get the message from database
          let message = await TicketComment.findById(messageId);
          
          if (!message || !message._id) {
            console.error(`Message not found: ${messageId}`);
            return socket.emit('error', { message: 'Message not found or invalid' });
          }
          
          // Initialize reactions array if not exists
          if (!message.reactions) {
            message.reactions = [];
          }
          console.log(`[REACTION] Before update: Message has ${message.reactions.length} reactions`);
          
          if (action === 'remove') {
            // Remove reaction
            message.reactions = message.reactions.filter(
              reaction => !(reaction.emoji === emoji && reaction.userId.toString() === reactionUserId)
            );
          } else {
            // Check if user already reacted with this emoji
            const existingReactionIndex = message.reactions.findIndex(
              reaction => reaction.emoji === emoji && reaction.userId.toString() === reactionUserId
            );
            
            if (existingReactionIndex > -1) {
              // User already reacted with this emoji, so remove it (toggle)
              message.reactions.splice(existingReactionIndex, 1);
            } else {
              // Add new reaction
              message.reactions.push({
                emoji: emoji,
                userId: new mongoose.Types.ObjectId(reactionUserId),
                createdAt: new Date()
              });
            }
          }
          
          console.log(`[REACTION] After update: Message has ${message.reactions.length} reactions`);
          
          // Save to database
          message.markModified('reactions'); // Explicitly mark the reactions array as modified
          console.log(`[REACTION] Saving message with reactions to database:`, 
            message.reactions.map(r => ({ emoji: r.emoji, userId: r.userId }))
          );
          await message.save();
          
          // Broadcast updated reactions to all clients in the room
          try {
            // Get the updated message with populated reactions
            // and user info
            const updatedMessage = await TicketComment.findById(messageId)
              .populate('reactions.userId')
              .populate('user');
              
            console.log(`[REACTION] Retrieved updated message from DB with ${updatedMessage?.reactions?.length || 0} reactions`);
            
            if (!updatedMessage) {
              throw new Error('Failed to retrieve updated message');
            }

            console.log(`[REACTION] Broadcasting reaction update for message ${messageId} with ${updatedMessage.reactions?.length || 0} reactions to room ticket-${ticketId}`);
            
            // Broadcast to all clients in the room
            io.to(`ticket-${ticketId}`).emit('message-reaction-update', {
              messageId,
              reactions: updatedMessage.reactions || []
            });
            
            // Also emit the full message to ensure all clients have the latest version
            io.to(`ticket-${ticketId}`).emit('message', updatedMessage);
          } catch (populateError) {
            console.error('Error populating reaction user data:', populateError);
            socket.emit('error', { message: 'Failed to broadcast reaction update' });
          }
        } catch (error) {
          console.error('Error handling reaction:', error);
          socket.emit('error', { message: 'Failed to save reaction' });
        }
      });

      // Handle message read status
      socket.on('read-receipt', async (data) => {
        try {
          const { messageIds, userId: readUserId, ticketId } = data;
          
          if (!messageIds || !messageIds.length) return;
          
          // Update multiple messages at once
          const result = await TicketComment.updateMany(
            { _id: { $in: messageIds }, readBy: { $ne: readUserId } },
            { 
              $set: { isRead: true, readAt: new Date() },
              $addToSet: { readBy: readUserId }
            }
          );
          
          // Broadcast to relevant room
          io.to(`ticket-${ticketId}`).emit('read-receipt-update', {
            messageIds,
            userId: readUserId,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
          socket.emit('error', { message: 'Failed to mark messages as read' });
        }
      });

      // Handle user status updates
      socket.on('user-status', (data) => {
        const { userId: statusUserId, status, ticketId } = data;
        
        if (statusUserId) {
          userStatus.set(statusUserId, status);
          
          // Broadcast to all connected clients
          io.emit('user-status', { userId: statusUserId, status });
          
          // Also broadcast to specific room if provided
          if (ticketId) {
            io.to(`ticket-${ticketId}`).emit('user-status', { userId: statusUserId, status });
          }
        }
      });

      // Handle file upload notifications
      socket.on('file-upload', (data) => {
        const { ticketId, fileInfo } = data;
        // Broadcast file upload to room
        io.to(`ticket-${ticketId}`).emit('file-upload', fileInfo);
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

// Do not export `getSocketIO` directly