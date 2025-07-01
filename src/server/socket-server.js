// src/server/socket-server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const fs = require('fs');
const multer = require('multer');
const { MongoClient } = require('mongodb');

// Create Express app
const app = express();
app.use(cors({
  origin: 'http://10.20.80.71:3000', // use specific origin
  methods: ['GET', 'POST'],
  credentials: true
}));
// const allowedOrigins = ['http://localhost:3000', 'http://10.20.80.71:3000'];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   credentials: true
// };

// app.use(cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for testing
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000, // Increased from default to 60 seconds
  pingInterval: 25000,
  connectTimeout: 60000 // 60 seconds connection timeout
});

// Debug flag - turn this on for detailed logging
const DEBUG = true;

// MongoDB connection from .env
const MONGODB_URI = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_PROD_MONGODB_URI
  : process.env.NEXT_PUBLIC_DEV_MONGODB_URI;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept all file types for now
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Keep track of user connections and rooms
const userConnections = new Map();
const userSockets = new Map(); // Map userId to socketId
const typingUsers = new Map();
const userStatus = new Map();
const ticketRooms = new Map();
const messageQueue = new Map();

// Helper function for logging
function log(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

// Define schemas for models we need
function defineModels() {
  // Only define if they don't already exist
  if (!mongoose.models.TicketComment) {
    console.log('Defining TicketComment model');

    // Define User schema if it doesn't exist
    if (!mongoose.models.User) {
      const UserSchema = new mongoose.Schema({
        firstName: String,
        lastName: String,
        email: String,
        avatar: String
      });
      mongoose.model('User', UserSchema);
    }

    // Define Ticket schema if it doesn't exist
    if (!mongoose.models.Ticket) {
      const TicketSchema = new mongoose.Schema({
        title: String,
        description: String
      });
      mongoose.model('Ticket', TicketSchema);
    }

    // Define TicketComment schema
    const AttachmentSchema = new mongoose.Schema({
      fileName: { type: String, required: true },
      fileType: { type: String, required: true },
      fileSize: { type: Number, required: true },
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    });

    const ReactionSchema = new mongoose.Schema({
      emoji: { type: String, required: true },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      createdAt: { type: Date, default: Date.now }
    });

    const TicketCommentSchema = new mongoose.Schema({
      ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
        required: true,
        index: true
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      content: { type: String, required: true, default: ' ' },
      attachments: [AttachmentSchema],
      replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TicketComment"
      },
      mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }],
      reactions: [ReactionSchema],
      isEdited: { type: Boolean, default: false },
      isRead: { type: Boolean, default: false },
      readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }],
      deliveredAt: { type: Date },
      readAt: { type: Date },
      isActive: { type: Boolean, default: true },
      addedBy: { type: String },
      updatedBy: { type: String }
    }, {
      timestamps: true
    });

    mongoose.model('TicketComment', TicketCommentSchema);
  }
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Define our models
    defineModels();

    console.log('Models loaded successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// Helper function to save message to database
async function saveMessageToDB(message) {
  try {
    if (!mongoose.connection.readyState) {
      log('MongoDB not connected, cannot save message');
      return null;
    }

    // Get the TicketComment model
    let TicketComment;
    try {
      // Try to get the model if it exists
      TicketComment = mongoose.model('TicketComment');
    } catch (error) {
      // Model doesn't exist, create a schema for it
      console.error('TicketComment model not found, using generic document');
      return null;
    }

    // Convert string IDs to ObjectIds
    const ticketId = mongoose.Types.ObjectId.isValid(message.ticket)
      ? new mongoose.Types.ObjectId(message.ticket)
      : message.ticket;

    const senderId = mongoose.Types.ObjectId.isValid(message.user._id)
      ? new mongoose.Types.ObjectId(message.user._id)
      : message.user._id;

    // Create a new comment document
    const ticketComment = new TicketComment({
      ticket: ticketId,
      user: senderId,
      content: message.content || ' ', // Ensure content is never empty
      attachments: message.attachments || [],
      replyTo: message.replyTo ? new mongoose.Types.ObjectId(message.replyTo) : undefined,
      replyToContent: message.replyToContent,
      mentions: message.mentions?.map(id => new mongoose.Types.ObjectId(id)) || [],
      addedBy: senderId,
      updatedBy: senderId,
      isActive: true,
      deliveredAt: new Date(),
      readBy: [senderId] // Mark as read by sender
    });

    // Save to database
    const savedMessage = await ticketComment.save();
    log(`Message saved to database with ID: ${savedMessage._id}`);

    return savedMessage;
  } catch (error) {
    console.error('Error saving message to database:', error);
    return null;
  }
}

// Helper function to load messages from database
async function loadMessagesFromDB(ticketId) {
  try {
    if (!mongoose.connection.readyState) {
      log('MongoDB not connected, cannot load messages');
      return [];
    }

    // Get the TicketComment model
    let TicketComment;
    try {
      // Try to get the model if it exists
      TicketComment = mongoose.model('TicketComment');
    } catch (error) {
      // Model doesn't exist, return empty array
      console.error('TicketComment model not found, cannot load messages');
      return [];
    }

    const objectId = mongoose.Types.ObjectId.isValid(ticketId)
      ? new mongoose.Types.ObjectId(ticketId)
      : ticketId;

    // Find messages for this ticket
    const messages = await TicketComment.find({ ticket: objectId })
      .populate('replyTo', 'content user')
      .sort({ createdAt: 1 })

    log(`Loaded ${messages.length} messages from database for ticket ${ticketId}`);

    // Convert to the format expected by the client
    return messages.map(msg => ({
      _id: msg._id.toString(),
      ticket: msg.ticket.toString(),
      user: {
        _id: msg.user.toString(),
        firstName: 'User', // Default values since we can't populate
        lastName: msg.user.toString().substring(0, 5),
        avatar: null
      },
      content: msg.content,
      attachments: msg.attachments || [],
      replyToContent: msg.replyTo?.content || msg.replyToContent,
      replyTo: msg.replyTo?.toString(),
      mentions: msg.mentions?.map(id => id.toString()) || [],
      reactions: msg.reactions?.map(reaction => ({
        emoji: reaction.emoji,
        userId: reaction.userId.toString(),
        createdAt: reaction.createdAt
      })) || [],
      createdAt: msg.createdAt.toISOString(),
      deliveredAt: msg.deliveredAt,
      readBy: msg.readBy?.map(id => id.toString()) || [],
      isRead: msg.isRead,
      readAt: msg.readAt
    }));
  } catch (error) {
    console.error('Error loading messages from database:', error);
    return [];
  }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  log(`Socket connected: ${socket.id}`);

  // Store user data on connection
  const { userId } = socket.handshake.auth;
  if (userId) {
    // Add socket to user's connections
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId).add(socket.id);
    userSockets.set(userId, socket.id);

    // Set user as online
    userStatus.set(userId, 'online');

    // Broadcast user online status to all clients
    io.emit('user-status', { userId, status: 'online' });
  }

  // Handle joining a room
  socket.on('join', async (data) => {
    const { ticketId, userId: joinUserId } = data;
    const roomId = `ticket-${ticketId}`;

    log(`User ${joinUserId} joining room ${roomId}`);

    // Create room if it doesn't exist
    if (!ticketRooms.has(roomId)) {
      ticketRooms.set(roomId, new Set());
    }
    const roomMembers = ticketRooms.get(roomId);

    // Add user to room members
    if (joinUserId) {
      log(`Adding user ${joinUserId} to room ${roomId}`);
      roomMembers.add(joinUserId);
    }

    // Notify everyone in the room that a new user joined
    if (joinUserId) {
      socket.to(roomId).emit('user-joined', {
        userId: joinUserId,
        username: joinUserId,
        timestamp: new Date()
      });
    }

    // Join the socket to the room
    socket.join(roomId);
    log(`Socket ${socket.id} joined room ${roomId}`);

    // Initialize typing status for this room if not exists
    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Map());
    }

    // Load messages from database
    const dbMessages = await loadMessagesFromDB(ticketId);

    // Send database messages to the client
    if (dbMessages.length > 0) {
      log(`Sending ${dbMessages.length} database messages to user ${joinUserId}`);
      socket.emit('messages', dbMessages);
    }

    // Send any queued messages for this room
    if (messageQueue.has(roomId)) {
      const queuedMessages = messageQueue.get(roomId) || [];
      log(`Found ${queuedMessages.length} queued messages for room ${roomId}`);
      for (const msg of queuedMessages) {
        log(`Sending persisted queued message to user ${joinUserId} in room ${roomId}`);
        socket.emit('message', msg);
      }
    }

    // Notify other users in the room that this user is online
    log(`Notifying other users that ${joinUserId} is online in room ${roomId}`);
    if (joinUserId) {
      socket.to(roomId).emit('user-status', {
        userId: joinUserId,
        status: userStatus.get(joinUserId) || 'online'
      });
    }

    // Send list of online users in this room
    const onlineUsers = {};
    roomMembers.forEach(memberId => {
      onlineUsers[memberId] = userStatus.get(memberId) || 'offline';
    });

    log(`Sending online users to ${joinUserId}: ${JSON.stringify(onlineUsers)}`);
    socket.emit('online-users-update', onlineUsers);

    // Notify the client that join was successful
    socket.emit('joined', { ticketId, success: true });
  });

  // Handle leaving a room
  socket.on('leave', (ticketId) => {
    const roomId = `ticket-${ticketId}`;

    socket.leave(roomId);
    log(`Socket ${socket.id} left room ${roomId}`);

    // Notify others that user left
    // Remove user from room members but keep the room
    if (userId && ticketRooms.has(roomId)) {
      ticketRooms.get(roomId).delete(userId);
      log(`Removed user ${userId} from room ${roomId}`);
    }

    // Remove user from typing status for this room
    if (userId) {
      const roomTyping = typingUsers.get(roomId);
      if (roomTyping) {
        roomTyping.delete(userId);
      }

      // Notify others that user left
      socket.to(roomId).emit('user-left', {
        userId,
        username: userId,
        timestamp: new Date()
      });
    }
  });

  // Handle new chat messages
  socket.on('message', async (data) => {
    try {
      // ... existing code ...
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to save message' });
    }
  });

  // Handle message editing
  socket.on('edit-message', async (data) => {
    try {
      const { messageId, ticketId, userId, content } = data;

      log(`Received edit request for message ${messageId} from user ${userId}`);

      if (!messageId || !ticketId || !userId || !content) {
        return socket.emit('error', { message: 'Missing required fields for message edit' });
      }

      // Get the TicketComment model
      let TicketComment;
      try {
        TicketComment = mongoose.model('TicketComment');
      } catch (error) {
        console.error('TicketComment model not found, cannot edit message');
        return socket.emit('error', { message: 'Database error' });
      }

      // Find and update the message in the database
      const objectId = mongoose.Types.ObjectId.isValid(messageId)
        ? new mongoose.Types.ObjectId(messageId)
        : null;

      if (!objectId) {
        return socket.emit('error', { message: 'Invalid message ID' });
      }

      // Update the message
      console.log('Updating message:', objectId, content);
      const updatedMessage = await TicketComment.findByIdAndUpdate(
        objectId,
        {
          content,
          isEdited: true,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedMessage) {
        return socket.emit('error', { message: 'Message not found' });
      }

      // Broadcast the updated message to all clients in the room
      const roomId = `ticket-${ticketId}`;
      io.to(roomId).emit('message-updated', { messageId, content, isEdited: true });

    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Handle new chat messages (original handler)
  socket.on('message', async (data) => {
    try {
      const { ticketId, userId: messageUserId, content, attachments, replyTo, replyToContent, mentions, tempId, user } = data;

      log(`Received message from user ${messageUserId} in room ticket-${ticketId}: ${content.substring(0, 30)}...`);

      // Create a message object
      const message = {
        _id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ticket: ticketId,
        user: user || { _id: messageUserId }, // Use the provided user object if available
        content: content || ' ', // Ensure content is never empty
        attachments: attachments || [],
        replyTo,
        replyToContent,
        mentions: mentions || [],
        createdAt: new Date().toISOString(),
        deliveredAt: new Date(),
        readBy: [messageUserId],
        tempId // Include the tempId in the broadcast to help clients match messages
      };

      // Save message to database
      const savedMessage = await saveMessageToDB(message);
      if (savedMessage) {
        // Update message ID with the database ID
        message._id = savedMessage._id.toString();
      }

      const roomId = `ticket-${ticketId}`;

      // Get room members
      const roomMembers = Array.from(ticketRooms.get(roomId) || []);
      log(`Room members: ${JSON.stringify(roomMembers)}`);

      // Get connected sockets in this room
      const roomSockets = io.sockets.adapter.rooms.get(roomId);
      log(`Room has ${roomSockets?.size || 0} connected sockets`);

      // Send acknowledgment to sender first with the tempId for matching
      if (tempId) {
        log(`Sending message acknowledgment to sender with tempId ${tempId}`);
        socket.emit('message-ack', {
          messageId: message._id,
          tempId,
          status: 'delivered',
          timestamp: message.createdAt
        });
      }

      // Now broadcast to everyone EXCEPT the sender
      // This prevents the sender from receiving the message twice
      log(`Broadcasting message to others in room ${roomId}`);
      socket.to(roomId).emit('message', message);

      // Store in message queue for users who join later
      if (!messageQueue.has(roomId)) {
        messageQueue.set(roomId, []);
      }
      log(`Adding message to persistence queue for room ${roomId}`);

      // Store message in queue for users who join later
      // Limit queue size to prevent memory issues
      const queue = messageQueue.get(roomId);
      queue.push(message);
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

  // Handle disconnections
  socket.on('disconnect', () => {
    log(`Socket disconnected: ${socket.id}`);

    if (userId) {
      userSockets.delete(userId);
      // Remove socket from user's connections
      const userSocketIds = userConnections.get(userId);
      if (userSocketIds) {
        userSocketIds.delete(socket.id);

        // If user has no more connections, mark as offline
        if (userSocketIds.size === 0) {
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

  // Add handler for reactions
  socket.on('add-reaction', async (data) => {
    try {
      const { messageId, emoji, ticketId, userId } = data;

      log(`Received reaction ${emoji} for message ${messageId} from user ${userId}`);

      if (!messageId || !emoji || !ticketId || !userId) {
        return socket.emit('error', { message: 'Missing required fields for reaction' });
      }

      // Get the TicketComment model
      let TicketComment;
      try {
        TicketComment = mongoose.model('TicketComment');
      } catch (error) {
        console.error('TicketComment model not found, cannot add reaction');
        return socket.emit('error', { message: 'Database error' });
      }

      // Find the message in the database
      const objectId = mongoose.Types.ObjectId.isValid(messageId)
        ? new mongoose.Types.ObjectId(messageId)
        : null;

      if (!objectId) {
        return socket.emit('error', { message: 'Invalid message ID' });
      }

      const message = await TicketComment.findById(objectId);

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      // Check if user already reacted with this emoji
      const userIdObj = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;

      if (!userIdObj) {
        return socket.emit('error', { message: 'Invalid user ID' });
      }

      const existingReactionIndex = message.reactions.findIndex(
        r => r.emoji === emoji && r.userId.toString() === userIdObj.toString()
      );

      let updatedMessage;

      if (existingReactionIndex !== -1) {
        // Remove existing reaction
        message.reactions.splice(existingReactionIndex, 1);
        updatedMessage = await message.save();
      } else {
        // Add new reaction
        message.reactions.push({
          emoji,
          userId: userIdObj,
          createdAt: new Date()
        });
        updatedMessage = await message.save();
      }

      // Broadcast the updated reactions to all clients in the room
      const roomId = `ticket-${ticketId}`;
      io.to(roomId).emit('reaction-updated', {
        messageId,
        reactions: updatedMessage.reactions.map(r => ({
          emoji: r.emoji,
          userId: r.userId.toString(),
          createdAt: r.createdAt
        }))
      });

    } catch (error) {
      console.error('Error handling reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Add handler for message-reaction event (client is using this event name)
  socket.on('message-reaction', async (data) => {
    try {
      const { messageId, emoji, ticketId, userId } = data;

      log(`Received message-reaction ${emoji} for message ${messageId} from user ${userId}`);

      if (!messageId || !emoji || !ticketId || !userId) {
        return socket.emit('error', { message: 'Missing required fields for reaction' });
      }

      // Get the TicketComment model
      let TicketComment;
      try {
        TicketComment = mongoose.model('TicketComment');
      } catch (error) {
        console.error('TicketComment model not found, cannot add reaction');
        return socket.emit('error', { message: 'Database error' });
      }

      // Find the message in the database
      const objectId = mongoose.Types.ObjectId.isValid(messageId)
        ? new mongoose.Types.ObjectId(messageId)
        : null;

      if (!objectId) {
        return socket.emit('error', { message: 'Invalid message ID' });
      }

      const message = await TicketComment.findById(objectId);

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      // Check if user already reacted with this emoji
      const userIdObj = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;

      if (!userIdObj) {
        return socket.emit('error', { message: 'Invalid user ID' });
      }

      const existingReactionIndex = message.reactions.findIndex(
        r => r.emoji === emoji && r.userId.toString() === userIdObj.toString()
      );

      let updatedMessage;

      if (existingReactionIndex !== -1) {
        // Remove existing reaction
        message.reactions.splice(existingReactionIndex, 1);
        updatedMessage = await message.save();
      } else {
        // Add new reaction
        message.reactions.push({
          emoji,
          userId: userIdObj,
          createdAt: new Date()
        });
        updatedMessage = await message.save();
      }

      // Broadcast the updated reactions to all clients in the room
      const roomId = `ticket-${ticketId}`;
      io.to(roomId).emit('reaction-updated', {
        messageId,
        reactions: updatedMessage.reactions.map(r => ({
          emoji: r.emoji,
          userId: r.userId.toString(),
          createdAt: r.createdAt
        }))
      });

    } catch (error) {
      console.error('Error handling reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // Add handler for marking messages as read
  socket.on('mark-as-read', async (data) => {
    try {
      const { messageIds, userId } = data;

      log(`Marking messages as read: ${messageIds.join(', ')} by user ${userId}`);

      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0 || !userId) {
        return socket.emit('error', { message: 'Missing required fields for marking messages as read' });
      }

      // Get the TicketComment model
      let TicketComment;
      try {
        TicketComment = mongoose.model('TicketComment');
      } catch (error) {
        console.error('TicketComment model not found, cannot mark messages as read');
        return socket.emit('error', { message: 'Database error' });
      }

      const userIdObj = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : null;

      if (!userIdObj) {
        return socket.emit('error', { message: 'Invalid user ID' });
      }

      // Find messages and update readBy field
      for (const messageId of messageIds) {
        const objectId = mongoose.Types.ObjectId.isValid(messageId)
          ? new mongoose.Types.ObjectId(messageId)
          : null;

        if (!objectId) {
          log(`Invalid message ID: ${messageId}`);
          continue;
        }

        await TicketComment.findByIdAndUpdate(
          objectId,
          {
            $addToSet: { readBy: userIdObj },
            $set: { isRead: true, readAt: new Date() }
          }
        );
      }

      // Broadcast read status to all clients
      const message = await TicketComment.findById(messageIds[0]);
      if (message) {
        const roomId = `ticket-${message.ticket}`;
        io.to(roomId).emit('messages-read', {
          messageIds,
          userId
        });
      }

    } catch (error) {
      console.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  // Add handler for updating user status
  socket.on('update-status', (data) => {
    const { status, userId } = data;

    if (!userId || !status) {
      return socket.emit('error', { message: 'Missing required fields for status update' });
    }

    // Update user status
    userStatus.set(userId, status);

    // Broadcast to all clients
    io.emit('user-status', { userId, status });

    log(`User ${userId} status updated to ${status}`);
  });

  // Add handler for file upload notifications
  socket.on('file-uploaded', (data) => {
    const { ticketId, messageId, userId, ...fileData } = data;

    if (!ticketId || !messageId || !userId) {
      return socket.emit('error', { message: 'Missing required fields for file upload notification' });
    }

    // Broadcast to all clients in the room
    const roomId = `ticket-${ticketId}`;
    io.to(roomId).emit('file_uploaded', {
      ...fileData,
      messageId,
      uploadedBy: userId,
      uploadedAt: new Date()
    });

    log(`File upload notification sent for message ${messageId} in room ${roomId}`);
  });
});

// API routes
app.get('/api/ping', (req, res) => {
  console.log('Ping received from', req.ip);
  res.json({
    timestamp: Date.now(),
    status: 'ok',
    server: 'socket-server',
    version: '1.0.0',
    env: process.env.NODE_ENV
  });
});

app.post('/api/ping', (req, res) => {
  console.log('POST ping received from', req.ip);
  res.json({
    timestamp: Date.now(),
    status: 'ok',
    server: 'socket-server',
    version: '1.0.0',
    method: 'POST',
    body: req.body
  });
});

// Add a root route for simple server verification
app.get('/', (req, res) => {
  res.send('Socket server is running. Use /api/ping to test API connectivity.');
});

// File upload endpoint
app.post('/api/file-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const { ticketId, userId } = req.body;

    if (!ticketId || !userId) {
      return res.status(400).json({ status: 'error', message: 'Missing ticketId or userId' });
    }

    // Create file info
    const fileInfo = {
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    // Return success response
    res.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: fileInfo
    });

    log(`File uploaded: ${fileInfo.fileName} for ticket ${ticketId} by user ${userId}`);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ status: 'error', message: 'File upload failed', error: error.message });
  }
});

// Debug endpoint to get room info
app.get('/api/debug/rooms', (req, res) => {
  const rooms = {};

  ticketRooms.forEach((members, roomId) => {
    rooms[roomId] = {
      members: Array.from(members),
      socketCount: io.sockets.adapter.rooms.get(roomId)?.size || 0,
      messageCount: messageQueue.get(roomId)?.length || 0
    };
  });

  res.json({
    rooms,
    userCount: userConnections.size,
    socketCount: io.sockets.sockets.size,
    mongodbConnected: mongoose.connection.readyState === 1
  });
});

// Start server
const PORT = process.env.PORT || 3001;

// Connect to MongoDB then start server
connectToMongoDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);

    // Print server info
    console.log(`
Server Information:
- Socket.IO server running on port ${PORT}
- CORS enabled for all origins
- Debug mode: ${DEBUG ? 'ON' : 'OFF'}
- MongoDB connection: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
- MongoDB URI: ${MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'Not set'}
- Transports: websocket, polling
- Message queue enabled for offline message persistence
`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});