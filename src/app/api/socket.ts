// src/app/api/socket.ts
import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextApiResponseServerIO } from '@/types/next';
import { dbConnect } from '@/lib/mongoose';
import { TicketComment, User } from '@/models';
import { createTicketHistory } from '@/server/services/ticketHistoryServices';
import mongoose from 'mongoose';

// Global variable to hold the Socket.io server instance
let io: SocketIOServer;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  // Only allow POST for client ping and GET for initialization
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Client ping to keep socket connection alive
  if (req.method === 'POST') {
    return res.status(200).json({ success: true, timestamp: Date.now() });
  }

  // Ensure database connection
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ success: false, message: 'Failed to connect to database' });
  }

  // If the Socket.io server hasn't been initialized, set it up
  if (!res.socket.server.io) {
    try {
      console.log('Setting up Socket.io server...');
      
      const httpServer: HTTPServer = res.socket.server as any;
      io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
          origin:  '*',
          methods: ['GET', 'POST'],
          credentials: true
        },
        // Make sure we're using WebSocket first, with polling as fallback
        transports: ['websocket', 'polling'],
        // Faster ping timeout and interval for better connection management
        pingTimeout: 60000,
        pingInterval: 25000,
        // Additional connection options for reliability
        connectTimeout: 30000,
        // Server-side doesn't need reconnection options
      });

      // Track online users separately for better performance
      const onlineUsers = new Map<string, { status: string, socketIds: Set<string> }>();

      // Set up event handlers
      io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        let currentTicketRoom: string | null = null;
        let currentUserId: string | null = null;

        // Handle joining a chat room (ticket-specific)
        socket.on('join', async (data: { ticketId: string, userId: string }) => {
          try {
            const { ticketId, userId } = data;
            
            if (!ticketId || !userId) {
              socket.emit('error', { message: 'Invalid join data - ticketId and userId required' });
              return;
            }
            
            currentTicketRoom = `ticket-${ticketId}`;
            currentUserId = userId;
            
            // Leave previous room if any
            if (socket.rooms.size > 1) {
              const rooms = Array.from(socket.rooms);
              rooms.forEach(room => {
                if (room !== socket.id && room !== currentTicketRoom) {
                  socket.leave(room);
                }
              });
            }
            
            // Join the new room
            socket.join(currentTicketRoom);
            console.log(`Socket ${socket.id} joined ${currentTicketRoom}`);
            
            // Update user online status
            if (!onlineUsers.has(userId)) {
              onlineUsers.set(userId, { status: 'online', socketIds: new Set([socket.id]) });
            } else {
              const userData = onlineUsers.get(userId)!;
              userData.socketIds.add(socket.id);
              userData.status = 'online';
              onlineUsers.set(userId, userData);
            }
            
            // Broadcast updated online status to the room
            broadcastOnlineStatus(ticketId);
            
            // Send confirmation to the client
            socket.emit('joined', { ticketId, success: true });
          } catch (error) {
            console.error('Error handling join event:', error);
            socket.emit('error', { message: 'Failed to join ticket room' });
          }
        });

        // Handle leaving a chat room
        socket.on('leave', (ticketId: string) => {
          try {
            const roomName = `ticket-${ticketId}`;
            socket.leave(roomName);
            
            if (currentTicketRoom === roomName) {
              currentTicketRoom = null;
            }
            
            console.log(`Socket ${socket.id} left ${roomName}`);
          } catch (error) {
            console.error('Error handling leave event:', error);
          }
        });

        // Handle new chat messages
        socket.on('message', async (data) => {
          try {
            const { ticketId, userId, content, attachments, replyTo, mentions } = data;
            
            if (!ticketId || !userId || !content) {
              socket.emit('error', { message: 'Invalid message data' });
              return;
            }
            
            // Create a new message document
            const newMessage = new TicketComment({
              ticket: new mongoose.Types.ObjectId(ticketId),
              user: new mongoose.Types.ObjectId(userId),
              content,
              attachments: attachments || [],
              replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : undefined,
              mentions: mentions?.map((id:any) => new mongoose.Types.ObjectId(id)) || [],
              addedBy: userId,
              updatedBy: userId,
              isActive: true,
              readBy: [userId], // Mark as read by sender
              deliveredAt: new Date()
            });
            
            // Save to database
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
            
            // If reply, add the original content and user for easier front-end display
            if (savedMessage.replyTo) {
              // @ts-ignore adding custom properties to the response
              savedMessage.replyToContent = savedMessage.replyTo.content;
              // @ts-ignore adding custom properties to the response
              savedMessage.replyToUser = savedMessage.replyTo.user;
            }
            
            // Create history entry
            await createTicketHistory({
              data: {
                ticket: ticketId,
                action: 'COMMENT',
                user: userId,
                details: { 
                  messageId: savedMessage._id,
                  hasAttachments: attachments && attachments.length > 0,
                  hasMentions: mentions && mentions.length > 0,
                  isReply: !!replyTo
                }
              }
            });
            
            // Broadcast to room
            io.to(`ticket-${ticketId}`).emit('message', savedMessage);
            
            // Also emit typing stopped event
            io.to(`ticket-${ticketId}`).emit('typing', { userId, isTyping: false });
            
            // Send ACK to sender
            socket.emit('message-ack', { 
              messageId: savedMessage._id?.toString(),
              status: 'delivered',
              timestamp: savedMessage.createdAt
            });
          } catch (error) {
            console.error('Error handling message:', error);
            socket.emit('error', { message: 'Failed to save message' });
          }
        });

        // Handle typing events
        socket.on('typing', (data) => {
          try {
            const { ticketId, userId, isTyping } = data;
            
            if (!ticketId || !userId) {
              return;
            }
            
            // Broadcast typing status to room (except sender)
            socket.to(`ticket-${ticketId}`).emit('typing', { userId, isTyping });
          } catch (error) {
            console.error('Error handling typing event:', error);
          }
        });

        // Handle file upload notifications
        socket.on('file-upload', (data) => {
          try {
            const { ticketId, fileInfo } = data;
            
            if (!ticketId || !fileInfo) {
              return;
            }
            
            // Broadcast file upload to room
            io.to(`ticket-${ticketId}`).emit('file-upload', fileInfo);
          } catch (error) {
            console.error('Error handling file upload event:', error);
          }
        });
        
        // Handle read receipts
        socket.on('read-receipt', async (data) => {
          try {
            const { messageIds, userId, ticketId } = data;
            
            if (!messageIds || !messageIds.length || !userId || !ticketId) {
              return;
            }
            
            // Update message read status in database
            const objectMessageIds = messageIds.map((id:any) => 
              new mongoose.Types.ObjectId(id)
            );
            
            const userObjectId = new mongoose.Types.ObjectId(userId);
            
            await TicketComment.updateMany(
              { 
                _id: { $in: objectMessageIds },
                readBy: { $ne: userObjectId }
              },
              { 
                $set: { isRead: true, readAt: new Date() },
                $addToSet: { readBy: userObjectId }
              }
            );
            
            // Broadcast read receipt to room
            io.to(`ticket-${ticketId}`).emit('read-receipt-update', {
              messageIds,
              userId,
              timestamp: new Date()
            });
          } catch (error) {
            console.error('Error handling read receipt:', error);
          }
        });
        
        // Handle user status update
        socket.on('user-status', (data) => {
          try {
            const { userId, status, ticketId } = data;
            
            if (!userId || !status || !ticketId) {
              return;
            }
            
            // Update user status
            if (onlineUsers.has(userId)) {
              const userData = onlineUsers.get(userId)!;
              userData.status = status;
              onlineUsers.set(userId, userData);
            }
            
            // Broadcast to ticket room
            broadcastOnlineStatus(ticketId);
          } catch (error) {
            console.error('Error handling user status update:', error);
          }
        });

        // Handle message reactions
        socket.on('message-reaction', async (data) => {
          try {
            console.log('Message reaction:', data);
            const { messageId, userId, emoji, ticketId, action } = data;
            
            if (!messageId || !userId || !emoji || !ticketId) {
              return;
            }
            
            const message = await TicketComment.findById(messageId);
            
            if (!message) {
              socket.emit('error', { message: 'Message not found' });
              return;
            }
            
            // Initialize reactions array if it doesn't exist
            if (!message.reactions) {
              message.reactions = [];
            }
            
            if (action === 'add') {
              // Add reaction if not already present from this user
              const existingReaction = message.reactions.find(
                r => r.userId.toString() === userId && r.emoji === emoji
              );
              
              if (!existingReaction) {
                message.reactions.push({
                  emoji,
                  userId: new mongoose.Types.ObjectId(userId),
                  createdAt: new Date()
                });
              }
            } else if (action === 'remove') {
              // Remove reaction
              message.reactions = message.reactions.filter(
                r => !(r.userId.toString() === userId && r.emoji === emoji)
              );
            }
            
            await message.save();
            
            // Broadcast updated reactions to room
            io.to(`ticket-${ticketId}`).emit('message-reaction-update', {
              messageId,
              reactions: message.reactions
            });
          } catch (error) {
            console.error('Error handling message reaction:', error);
            socket.emit('error', { message: 'Failed to update reaction' });
          }
        });

        // Handle disconnections
        socket.on('disconnect', () => {
          console.log(`Socket disconnected: ${socket.id}`);
          
          // Update user status if this user was tracked
          if (currentUserId) {
            const userData = onlineUsers.get(currentUserId);
            
            if (userData) {
              userData.socketIds.delete(socket.id);
              
              // If no more active sockets, mark user as offline
              if (userData.socketIds.size === 0) {
                userData.status = 'offline';
                // Set a timer to remove user from online list after 2 minutes
                setTimeout(() => {
                  const currentData = onlineUsers.get(currentUserId!);
                  if (currentData && currentData.socketIds.size === 0) {
                    onlineUsers.delete(currentUserId!);
                  }
                }, 2 * 60 * 1000);
              }
              
              onlineUsers.set(currentUserId, userData);
              
              // Broadcast updated status if in a room
              if (currentTicketRoom) {
                const ticketId = currentTicketRoom.replace('ticket-', '');
                broadcastOnlineStatus(ticketId);
              }
            }
          }
        });
        
        // Helper function to broadcast online user status
        function broadcastOnlineStatus(ticketId: string) {
          // Create status object with user IDs as keys
          const statusUpdate = Array.from(onlineUsers.entries()).reduce((acc, [userId, data]) => {
            acc[userId] = data.status;
            return acc;
          }, {} as Record<string, string>);
          
          io.to(`ticket-${ticketId}`).emit('online-users-update', statusUpdate);
        }
      });

      // Attach Socket.io server to Next.js response
      res.socket.server.io = io;
    } catch (error) {
      console.error('Error initializing socket.io server:', error);
      return res.status(500).json({ success: false, message: 'Failed to initialize socket server' });
    }
  } else {
    console.log('Socket.io server already running');
  }

  // Return a simple response
  res.status(200).json({ success: true, message: 'Socket.io server is running' });
}