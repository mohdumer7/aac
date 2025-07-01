// src/lib/socketService.ts
import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface SocketUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface ChatMessage {
  _id: string;
  ticket: string;
  user: SocketUser;
  content: string;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    uploadedAt: Date;
  }>;
  replyTo?: string;
  replyToUser?: SocketUser;
  replyToContent?: string;
  mentions?: string[];
  reactions?: Array<{
    emoji: string;
    userId: string;
    createdAt: Date;
  }>;
  isEdited?: boolean;
  readBy?: string[];
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: string;
  isPending?: boolean;
  isRead?: boolean;
  error?: boolean;
}

export interface MessageReaction {
  emoji: string;
  messageId: string;
  reactions: Array<{
    emoji: string;
    userId: string;
    createdAt: Date;
  }>;
}

interface SocketServiceOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export class SocketService extends EventEmitter {
  private static instance: SocketService;
  public socket: Socket | null = null;
  private serverUrl: string;
  private autoConnect: boolean;
  private reconnectionAttempts: number;
  private reconnectionDelay: number;
  private connectionAttempts: number = 0;
  private currentTicketId: string | null = null;
  private currentUserId: string | null = null;
  private currentRoomId: string | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  
  private messagesCache: Map<string, ChatMessage[]> = new Map();
  private typingUsersMap: Map<string, boolean> = new Map();
  private onlineUsersMap: Map<string, string> = new Map();
  private reactionsCache: Map<string, MessageReaction> = new Map();
  private pendingMessages: Map<string, ChatMessage> = new Map();
  private pendingReactions: Map<string, { messageId: string, emoji: string }> = new Map();
  
  private constructor(options: SocketServiceOptions = {}) {
    super();
    this.serverUrl = options.serverUrl || 'http://localhost:3001';
    this.autoConnect = options.autoConnect !== undefined ? options.autoConnect : true;
    this.reconnectionAttempts = options.reconnectionAttempts || 5;
    this.reconnectionDelay = options.reconnectionDelay || 3000;
    
    if (this.autoConnect) {
      this.init();
    }
  }
  
  /**
   * Initialize the socket connection
   */
  public init(): void {
    if (this.isInitialized) return;
    
    try {
      console.log("Initializing socket connection...");
      
      // Connect to the standalone socket server
      // Create socket with proper options
      this.socket = io(this.serverUrl, {
        withCredentials: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.reconnectionAttempts,
        reconnectionDelay: this.reconnectionDelay,
        timeout: 60000 // Increased from 20000 to 60000 (60 seconds)
      });
      
      this.setupEventListeners();
      this.startPingInterval();
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.emit('error', error);
    }
  }
  
  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));
    this.socket.on('error', this.handleError.bind(this));
    
    // Message events
    this.socket.on('message', this.handleMessage.bind(this));
    this.socket.on('messages', this.handleMessages.bind(this));
    this.socket.on('message-ack', this.handleMessageAck.bind(this));
    this.socket.on('typing', this.handleTyping.bind(this));
    this.socket.on('message-reaction', this.handleMessageReaction.bind(this));
    this.socket.on('message-reaction-update', this.handleMessageReactionUpdate.bind(this));
    this.socket.on('file-upload', this.handleFileUpload.bind(this));
    this.socket.on('message-updated', this.handleMessageUpdate.bind(this));
    
    // Read receipts
    this.socket.on('read-receipt', this.handleReadReceipt.bind(this));
    this.socket.on('read-receipt-update', this.handleReadReceiptUpdate.bind(this));
    this.socket.on('messages-read', this.handleMessagesRead.bind(this));
    
    // User status
    this.socket.on('user-status', this.handleUserStatus.bind(this));
    this.socket.on('online-users-update', this.handleOnlineUsersUpdate.bind(this));
    
    // System events
    this.socket.on('joined', this.handleJoinedRoom.bind(this));
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }
  
  /**
   * Connect to a ticket room
   */
  public joinTicketRoom(ticketId: string, userId: string, roomId?: string): void {
    if (!this.socket) {
      this.init();
    }
    
    this.currentTicketId = ticketId;
    this.currentUserId = userId;
    this.currentRoomId = roomId || `ticket-${ticketId}`;
    
    if (this.socket?.connected) {
      console.log(`Joining room for ticket ${ticketId} with user ${userId}, roomId: ${this.currentRoomId}`);
      this.socket.emit('join', { ticketId, userId });
      this.emit('joining', { ticketId });
    } else {
      console.log("Socket not connected, will join when connected");
      // Queue join for when connection is established
      this.once('connected', () => {
        console.log(`Now connected, joining room for ticket ${ticketId}`);
        this.socket?.emit('join', { 
          ticketId: this.currentTicketId, 
          userId: this.currentUserId 
        });
        this.emit('joining', { ticketId });
      });
    }
    
    // Set auth data for reconnection
    if (this.socket) {
      this.socket.auth = { userId };
    }
  }
  
  /**
   * Leave the current ticket room
   */
  public leaveTicketRoom(): void {
    if (this.socket && this.currentTicketId) {
      this.socket.emit('leave', this.currentTicketId);
      this.currentTicketId = null;
      this.currentRoomId = null;
    }
  }
  
  /**
   * Send a message
   */
  public sendMessage(
    content: string,
    attachments: any[] = [], 
    replyTo?: string, 
    mentions: string[] = []
  ): string {
    // Generate a temporary ID for the message
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (!this.currentTicketId || !this.currentUserId) {
      console.error('Cannot send message: Missing ticketId/userId');
      return tempId;
    }
    
    // If this is a reply, get the original message content
    let replyToContent: string | undefined;
    if (replyTo) {
      const replyToMessage = this.getMessageFromCache(replyTo);
      if (replyToMessage) {
        replyToContent = replyToMessage.content;
        console.log(`Found reply content: "${replyToContent}" for message ${replyTo}`);
      } else {
        console.log(`Could not find original message ${replyTo} for reply`);
        replyToContent = undefined;
      }
    }
    
    // Create a pending message object
    const pendingMessage: ChatMessage = {
      _id: tempId,
      ticket: this.currentTicketId,
      user: { 
        _id: this.currentUserId,
        firstName: '', // Will be populated from the server response
        lastName: ''
      },
      content,
      attachments,
      replyToContent,
      ...(replyTo && { replyTo }),
      mentions,
      createdAt: new Date().toISOString(),
      isPending: true,
      readBy: [this.currentUserId]
    };
    
    // Add to pending messages
    this.pendingMessages.set(tempId, pendingMessage);
    
    // Add to current message list and notify subscribers
    this.addMessageToCache(pendingMessage);
    
    // If socket is connected, send to server
    if (this.socket && this.socket.connected) {
      console.log(`Sending message to ticket ${this.currentTicketId} from user ${this.currentUserId}: ${content.substring(0, 30)}...`);
      this.socket.emit('message', {
        ticketId: this.currentTicketId,
        userId: this.currentUserId,
        content,
        attachments,
        replyToContent,
        replyTo,
        mentions,
        tempId
      });
    } else {
      console.warn("Socket not connected, message will be sent when reconnected");
      // Will be sent when reconnected in resendPendingMessages
    }
    
    return tempId;
  }
  
  /**
   * Edit a message
   */
  public editMessage(messageId: string, newContent: string): void {
    if (!this.socket || !this.currentTicketId || !this.currentUserId) {
      console.error('Cannot edit message: Socket not connected or missing ticketId/userId');
      return;
    }
    
    // Send edit request
    this.socket.emit('edit-message', {
      messageId,
      ticketId: this.currentTicketId,
      userId: this.currentUserId,
      content: newContent
    });
    
    // Optimistically update the message in cache
    this.updateMessageInCache(messageId, {
      content: newContent,
      isEdited: true
    });
    
    // Listen for message-updated event to confirm the edit was successful
    const messageUpdatedHandler = (data: { messageId: string, content: string, isEdited: boolean }) => {
      if (data.messageId === messageId) {
        // The edit was confirmed by the server, we can remove this listener
        this.socket?.off('message-updated', messageUpdatedHandler);
        console.log(`Message edit confirmed by server for message ${messageId}`);
      }
    };
    this.socket.on('message-updated', messageUpdatedHandler);
  }
  
  /**
   * Add a reaction to a message
   */
  public addReaction(messageId: string, emoji: string): void {
    if (!this.socket || !this.currentTicketId || !this.currentUserId) {
      console.error('Cannot add reaction: Socket not connected or missing ticketId/userId');
      return;
    }
    
    console.log(`Adding reaction ${emoji} to message ${messageId} by user ${this.currentUserId}`);
    
    // Store pending reaction
    const pendingKey = `${messageId}-${emoji}`;
    this.pendingReactions.set(pendingKey, { messageId, emoji });
    
    // Optimistically update cache
    this.updateMessageReactionInCache(messageId, emoji, this.currentUserId, true);
    console.log("Emitting....")
    // Send reaction
    this.socket.emit('message-reaction', {
      messageId,
      ticketId: this.currentTicketId, 
      userId: this.currentUserId,
      emoji,
      action: 'add'
    });
  }
  
  /**
   * Remove a reaction from a message
   */
  public removeReaction(messageId: string, emoji: string): void {
    if (!this.socket || !this.currentTicketId || !this.currentUserId) {
      console.error('Cannot remove reaction: Socket not connected or missing ticketId/userId');
      return;
    }
    
    console.log(`Removing reaction ${emoji} from message ${messageId} by user ${this.currentUserId}`);
    
    // Optimistically update cache
    this.updateMessageReactionInCache(messageId, emoji, this.currentUserId, false);
    
    // Send reaction removal
    this.socket.emit('message-reaction', {
      messageId,
      ticketId: this.currentTicketId,
      userId: this.currentUserId,
      emoji,
      action: 'remove'
    });
  }
  
  /**
   * Mark messages as read
   */
  public markMessagesAsRead(messageIds: string[]): void {
    if (!this.socket || !this.currentTicketId || !this.currentUserId || messageIds.length === 0) {
      return;
    }
    
    // Send read receipt
    this.socket.emit('read-receipt', {
      messageIds,
      ticketId: this.currentTicketId,
      userId: this.currentUserId
    });
    
    // Optimistically update cache
    messageIds.forEach(id => {
      const message = this.getMessageFromCache(id);
      const readBy = message?.readBy || [];
      if (message && !readBy.includes(this.currentUserId!)) {
        this.updateMessageInCache(id, {
          readBy: [...readBy, this.currentUserId!]
        });
      }
    });
  }
  
  /**
   * Send typing status
   */
  public sendTyping(isTyping: boolean): void {
    if (!this.socket || !this.currentTicketId || !this.currentUserId) {
      return;
    }
    
    this.socket.emit('typing', {
      ticketId: this.currentTicketId,
      userId: this.currentUserId,
      isTyping
    });
  }
  
  /**
   * Update user status
   */
  public updateStatus(status: string): void {
    if (!this.socket || !this.currentUserId) {
      return;
    }
    
    this.socket.emit('user-status', {
      userId: this.currentUserId,
      status,
      ticketId: this.currentTicketId
    });
  }
  
  /**
   * Notify about file upload
   */
  public notifyFileUpload(fileInfo: any): void {
    if (!this.socket || !this.currentTicketId) {
      return;
    }
    
    this.socket.emit('file-upload', {
      ticketId: this.currentTicketId,
      fileInfo
    });
  }
  
  /**
   * Update messages in cache when received from server
   */
  public updateMessages(messages: ChatMessage[]): void {
    if (!this.currentTicketId) return;
    
    console.log(`Updating messages cache with ${messages.length} messages`);
    // Replace entire cache for this ticket
    this.messagesCache.set(this.currentTicketId, messages);
    this.emit('messages-updated', messages);
  }
  
  /**
   * Get all cached messages for current ticket
   */
  public getMessages(): ChatMessage[] {
    if (!this.currentTicketId) return [];
    return this.messagesCache.get(this.currentTicketId) || [];
  }
  
  /**
   * Get typing users for current ticket
   */
  public getTypingUsers(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    this.typingUsersMap.forEach((isTyping, userId) => {
      result[userId] = isTyping;
    });
    return result;
  }
  
  /**
   * Get online users
   */
  public getOnlineUsers(): Record<string, string> {
    const result: Record<string, string> = {};
    this.onlineUsersMap.forEach((status, userId) => {
      result[userId] = status;
    });
    return result;
  }
  
  /**
   * Get message reactions
   */
  public getMessageReactions(): Record<string, any> {
    const result: Record<string, any> = {};
    this.reactionsCache.forEach((reaction, messageId) => {
      result[messageId] = reaction;
    });
    return result;
  }
  
  /**
   * Check if socket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  /**
   * Force reconnection
   */
  public reconnect(): void {
    console.log("Manually reconnecting socket...");
    if (this.socket) {
      this.socket.connect();
    } else {
      this.init();
    }
  }
  
  /**
   * Clean up resources
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.isInitialized = false;
    this.currentTicketId = null;
    this.currentUserId = null;
    this.currentRoomId = null;
    this.removeAllListeners();
  }
  
  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        fetch('/api/ping', { method: 'POST', cache: 'no-store' })
          .catch(err => console.error('Ping error:', err));
      }
    }, 30000); // 30 seconds
  }
  
  /**
   * Handle socket connect event
   */
  private handleConnect(): void {
    console.log('Socket connected');
    this.connectionAttempts = 0;
    this.emit('connected', { roomId: this.currentRoomId });
    
    // Rejoin room if needed
    if (this.currentTicketId && this.currentUserId) {
      console.log(`Rejoining room for ticket ${this.currentTicketId}`);
      this.socket?.emit('join', { 
        ticketId: this.currentTicketId, 
        userId: this.currentUserId 
      });
    }
    
    // Resend any pending messages
    this.resendPendingMessages();
  }
  
  /**
   * Handle socket disconnect event
   */
  private handleDisconnect(reason: string): void {
    console.log('Socket disconnected:', reason);
    this.emit('disconnected', reason);
    
    // If disconnected due to transport error, try to reconnect
    if (reason === 'transport error' || reason === 'ping timeout' || reason === 'timeout') {
      if (this.connectionAttempts < this.reconnectionAttempts) {
        this.connectionAttempts++;
        this.emit('reconnecting', this.connectionAttempts);
        
        setTimeout(() => {
          this.reconnect();
        }, this.reconnectionDelay);
      } else {
        this.emit('reconnect_failed');
      }
    }
  }
  
  /**
   * Handle connection error
   */
  private handleConnectError(error: any): void {
    console.error('Socket connection error:', error);
    this.emit('connect_error', error);
  }
  
  /**
   * Handle socket error
   */
  private handleError(error: any): void {
    console.error('Socket error:', error);
    this.emit('error', error);
  }
  
  /**
   * Handle message update event
   */
  private handleMessageUpdate(data: { messageId: string, content: string, isEdited: boolean }): void {
    const { messageId, content, isEdited } = data;
    
    // Update the message in cache
    this.updateMessageInCache(messageId, {
      content,
      isEdited
    });
    
    // Emit event for subscribers
    this.emit('message-updated', data);
  }
  
  /**
   * Handle incoming message
   */
  private handleMessage(message: ChatMessage): void {
    console.log(`Received message: ${message._id}`);
    console.log(`Message from user: ${message.user._id}, current user: ${this.currentUserId}`);
    
    // Check for duplicate attachments and remove them
    if (message.attachments && message.attachments.length > 0) {
      // Create a map to track unique attachments by fileName and fileSize
      const uniqueAttachments = new Map();
      
      // Filter out duplicate attachments
      message.attachments = message.attachments.filter(attachment => {
        const key = `${attachment.fileName}-${attachment.fileSize}`;
        if (uniqueAttachments.has(key)) {
          return false; // Skip this duplicate
        }
        uniqueAttachments.set(key, true);
        return true;
      });
    }
    
    this.resolvePendingMessage(message);
    
    // Add message to cache
    this.addMessageToCache(message);
    
    // Automatically mark as read if from others
    if (message.user._id !== this.currentUserId) {
      this.markMessagesAsRead([message._id]);
    }
  }
  
  /**
   * Handle incoming messages (bulk)
   */
  private handleMessages(messages: ChatMessage[]): void {
    console.log(`Received ${messages.length} messages in bulk`);
    // Update the cache with all messages
    if (this.currentTicketId) {
      this.messagesCache.set(this.currentTicketId, messages);
      this.emit('messages-updated', messages);
    }
  }
  
  /**
   * Handle message acknowledgement
   */
  private handleMessageAck(ack: { messageId: string, tempId?: string, status: string, timestamp: string }): void {
    console.log(`Message ack received for ${ack.tempId || ack.messageId}`);
    // If this is a response to a pending message, update it
    if (ack.tempId && this.pendingMessages.has(ack.tempId)) {
      const pendingMessage = this.pendingMessages.get(ack.tempId);
      if (pendingMessage) {
        // Remove the pending flag and update ID
        pendingMessage.isPending = false;
        pendingMessage._id = ack.messageId;
        pendingMessage.deliveredAt = new Date(ack.timestamp);
        
        // Update in cache with new ID
        this.removeMessageFromCache(ack.tempId);
        this.addMessageToCache(pendingMessage);
        
        // Clean up pending message
        this.pendingMessages.delete(ack.tempId);
      }
    }
  }
  
  /**
   * Handle typing event
   */
  private handleTyping(data: { userId: string, isTyping: boolean }): void {
    this.typingUsersMap.set(data.userId, data.isTyping);
    this.emit('typing-updated', this.getTypingUsers());
  }
  
  /**
   * Handle message reaction
   */
  private handleMessageReaction(reaction: MessageReaction): void {
    console.log(`Received reaction update for message ${reaction.messageId} with ${reaction.reactions.length} reactions`);
    this.reactionsCache.set(reaction.messageId, reaction);
    
    console.log(`Received reaction update for message ${reaction.messageId} with ${reaction.reactions.length} reactions`);
    
    // Update message in cache with the new reactions
    const message = this.getMessageFromCache(reaction.messageId);
    if (message) {
      message.reactions = reaction.reactions;
      this.updateMessageInCache(reaction.messageId, { reactions: reaction.reactions });
    }
    
    this.emit('reactions-updated', this.getMessageReactions());
  }
  
  /**
   * Handle message reaction update
   */
  private handleMessageReactionUpdate(data: { messageId: string, reactions: any[] }): void {
    const { messageId, reactions } = data;
    
    console.log(`Received reaction update for message ${messageId} with ${reactions?.length || 0} reactions:`, reactions);
    
    // Update message in cache with the new reactions
    const message = this.getMessageFromCache(messageId);
    if (message) {
      // Make a deep copy of the reactions to ensure they're properly updated
      const reactionsCopy = reactions ? [...reactions] : [];
      this.updateMessageInCache(messageId, { reactions: reactionsCopy });
      
      // Log the updated message for debugging
      console.log(`Updated message ${messageId} with reactions:`, reactionsCopy);
    }
    
    // Update reactions cache
    this.reactionsCache.set(messageId, {
      messageId,
      emoji: '',
      reactions: reactions || []
    });
    
    this.emit('reactions-updated', this.getMessageReactions());
  }
  
  /**
   * Handle file upload notification
   */
  private handleFileUpload(fileInfo: any): void {
    this.emit('file-uploaded', fileInfo);
  }
  
  /**
   * Handle read receipt
   */
  private handleReadReceipt(data: { userId: string, messageId: string }): void {
    const { userId, messageId } = data;
    
    // Update message in cache
    const message = this.getMessageFromCache(messageId);
    if (message) {
      message.readBy = [...(message.readBy || []), userId];
      message.isRead = true;
      message.readAt = new Date();
      this.updateMessageInCache(messageId, message);
    }
  }
  
  /**
   * Handle read receipt update
   */
  private handleReadReceiptUpdate(data: { messageIds: string[], userId: string, timestamp: Date }): void {
    const { messageIds, userId, timestamp } = data;
    
    // Update messages in cache
    messageIds.forEach(messageId => {
      const message = this.getMessageFromCache(messageId);
      if (message) {
        message.readBy = [...(message.readBy || []), userId];
        message.isRead = true;
        message.readAt = timestamp;
        this.updateMessageInCache(messageId, message);
      }
    });
  }
  
  /**
   * Handle messages read event
   */
  private handleMessagesRead(data: { userId: string, messageIds: string[], timestamp: Date }): void {
    const { messageIds, userId, timestamp } = data;
    
    // Update messages in cache
    messageIds.forEach(messageId => {
      const message = this.getMessageFromCache(messageId);
      if (message) {
        message.readBy = [...(message.readBy || []), userId];
        message.isRead = true;
        message.readAt = timestamp;
        this.updateMessageInCache(messageId, message);
      }
    });
  }
  
  /**
   * Handle user status
   */
  private handleUserStatus(data: { userId: string, status: string }): void {
    const { userId, status } = data;
    this.onlineUsersMap.set(userId, status);
    this.emit('user-status-updated', this.getOnlineUsers());
  }
  
  /**
   * Handle online users update
   */
  private handleOnlineUsersUpdate(statusObj: Record<string, string>): void {
    // Clear existing map
    this.onlineUsersMap.clear();
    
    // Fill with new data
    Object.entries(statusObj).forEach(([userId, status]) => {
      this.onlineUsersMap.set(userId, status);
    });
    
    this.emit('user-status-updated', this.getOnlineUsers());
  }
  
  /**
   * Handle joined room event
   */
  private handleJoinedRoom(data: { ticketId: string, success: boolean }): void {
    console.log(`Joined room for ticket ${data.ticketId}, success: ${data.success}`);
    if (data.success) {
      this.emit('joined', { ticketId: data.ticketId });
    }
  }
  
  /**
   * Add a message to the cache
   */
  private addMessageToCache(message: ChatMessage): void {
    if (!this.currentTicketId) return;
    
    // Create a new array from the existing messages to avoid non-extensible array issues
    const currentMessages = this.messagesCache.get(this.currentTicketId) || [];
    const messages = [...currentMessages];
    
    // Find if message already exists to avoid duplicates
    const existingIndex = messages.findIndex(m => m._id === message._id);
    
    if (existingIndex >= 0) {
      // Replace existing message
      messages[existingIndex] = message;
    } else {
      // Add new message
      messages.push(message);
      
      // Sort messages by creation date - oldest first (newest at bottom)
      messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
    
    this.messagesCache.set(this.currentTicketId, messages);
    this.emit('messages-updated', messages);
  }
  
  /**
   * Remove a message from the cache
   */
  private removeMessageFromCache(messageId: string): void {
    if (!this.currentTicketId) return;
    
    const messages = this.messagesCache.get(this.currentTicketId) || [];
    const updatedMessages = messages.filter(m => m._id !== messageId);
    
    this.messagesCache.set(this.currentTicketId, updatedMessages);
    this.emit('messages-updated', updatedMessages);
  }
  
  /**
   * Update a message in the cache
   */
  private updateMessageInCache(messageId: string, updates: Partial<ChatMessage>): void {
    if (!this.currentTicketId) return;
    
    // Create a new array by copying the cached messages
    let messages = [...(this.messagesCache.get(this.currentTicketId) || [])];
    const messageIndex = messages.findIndex(m => m._id === messageId);
    
    if (messageIndex >= 0) {
      const newMessage = { ...messages[messageIndex], ...updates };
      console.log({messages, messageIndex, updates, newMessage});
      
      // Replace the element in the new array
      messages[messageIndex] = newMessage;
      
      // Update the cache with the new array
      this.messagesCache.set(this.currentTicketId, messages);
      this.emit('messages-updated', messages);
    }
  }
  /**
   * Get a message from the cache
   */
  private getMessageFromCache(messageId: string): ChatMessage | undefined {
    if (!this.currentTicketId) return undefined;
    
    const messages = this.messagesCache.get(this.currentTicketId) || [];
    return messages.find(m => m._id === messageId);
  }
  
  /**
   * Update message reaction in cache
   */
  private updateMessageReactionInCache(
    messageId: string, 
    emoji: string, 
    userId: string, 
    isAdding: boolean
  ): void {
    const message = this.getMessageFromCache(messageId);
    console.log(`Updating reaction in cache: ${emoji} for message ${messageId}, isAdding: ${isAdding}`);
    
    if (message) {
      // Create a new reactions array to avoid reference issues
      const reactions = message.reactions ? [...message.reactions] : [];
      
      if (isAdding) {
        // Check if reaction already exists
        const existingReactionIndex = reactions.findIndex(
          r => r.emoji === emoji && r.userId === userId
        );
        
        if (existingReactionIndex === -1) {
          // Add new reaction
          reactions.push({
            emoji,
            userId,
            createdAt: new Date()
          });
          console.log(`Added reaction ${emoji} to message ${messageId}`);
        }
      } else {
        // Remove reaction
        const filteredReactions = reactions.filter(
          r => !(r.emoji === emoji && r.userId === userId)
        );
        
        console.log(`Removed reaction ${emoji} from message ${messageId}`);
        // Update with filtered reactions
        this.updateMessageInCache(messageId, { reactions: filteredReactions });
        return;
      }
      
      // Update with new reactions
      this.updateMessageInCache(messageId, { reactions });
    }
  }
  
  /**
   * Resolve a pending message with the actual message from the server
   */
  private resolvePendingMessage(message: ChatMessage): void {
    if (!message || !this.pendingMessages.size) return;
    
    // Check if this message resolves any pending messages
    this.pendingMessages.forEach((pendingMsg, tempId) => {
      // Check if this is the same message based on content, user, and timestamp
      if (
        pendingMsg.content === message.content &&
        pendingMsg.user._id === message.user._id &&
        Math.abs(new Date(pendingMsg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 30000
 ||
        // Also check if this is the same message based on attachments
        (pendingMsg.attachments && message.attachments && 
         pendingMsg.attachments.length > 0 && message.attachments.length > 0 &&
         pendingMsg.attachments.some(a1 => 
           message.attachments?.some(a2 => 
             a1.fileName === a2.fileName && a1.fileSize === a2.fileSize
           )
         ))
      ) {
        // This is likely the same message
        console.log(`Resolving pending message ${tempId} with server message ${message._id}`);
        this.removeMessageFromCache(tempId);
        this.pendingMessages.delete(tempId);
      }
    });
  }
  
  /**
   * Resend any pending messages after reconnection
   */
  private resendPendingMessages(): void {
    if (!this.socket || !this.currentTicketId || !this.currentUserId) return;
    
    console.log(`Resending ${this.pendingMessages.size} pending messages`);
    
    // Resend all pending messages
    this.pendingMessages.forEach((message, tempId) => {
      this.socket?.emit('message', {
        ticketId: this.currentTicketId,
        userId: this.currentUserId,
        content: message.content,
        attachments: message.attachments || [],
        replyToContent: message.replyToContent,
        replyTo: message.replyTo,
        mentions: message.mentions || [],
        tempId
      });
    });
    
    // Resend any pending reactions
    this.pendingReactions.forEach((data, key) => {
      this.socket?.emit('message-reaction', {
        messageId: data.messageId,
        ticketId: this.currentTicketId,
        userId: this.currentUserId,
        emoji: data.emoji,
        action: 'add'
      });
    });
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(options: SocketServiceOptions = {}): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService(options);
    }
    return SocketService.instance;
  }
}

// Factory function to get or create a SocketService instance
export default function getSocketService(options: SocketServiceOptions = {}): SocketService {
  return SocketService.getInstance(options);
}
