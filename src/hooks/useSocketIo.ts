// src/hooks/useSocketIo.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useMarkAsReadMutation } from '@/services/endpoints/ticketCommentApi';
import { toast } from 'react-toastify';

interface UseSocketIoProps {
  ticketId: string;
  userId: string;
  roomId?: string;
  currentUser?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

// Interface for reaction object
interface Reaction {
  emoji: string;
  user: string;
  createdAt?: string;
}

type Message = {
  _id: string;
  tempId?: string;
  ticket: string;
  user: any;
  content: string;
  attachments?: any[];
  replyTo?: string;
  replyToContent?: string;
  replyToUser?: any;
  reactions?: Reaction[];
  mentions?: string[];
  createdAt: string;
  isPending?: boolean;
  readBy?: string[];
  isEdited?: boolean;
};

/**
 * Custom hook for Socket.io integration with the chat
 * Simplified for stability based on working direct connection
 */
export const useSocketIo = ({ ticketId, userId, roomId, currentUser }: UseSocketIoProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);
  
  // Use state for typing users to ensure component updates when typing status changes
  const [typingUsers, setTypingUsers] = useState<{[key: string]: string}>({});
  
  // Use refs for other frequently changing data to prevent re-renders
  const onlineUsersRef = useRef<any[]>([]);
  
  // Socket reference
  const socketRef = useRef<Socket | null>(null);
  
  // Mutation for marking messages as read
  const [markAsRead] = useMarkAsReadMutation();

  // Connect socket function to ensure reliable connection
  const connectSocket = useCallback(() => {
    // Create socket instance
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    
    // Socket.io options - start with polling for greater reliability
    const socketOptions = {
      transports: ['polling'], // Use polling only to avoid WebSocket connection issues
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000, // Shorter timeout
      forceNew: true,
      query: {
        ticketId,
        userId
      }
    };
    
    console.log(`Connecting to socket at ${socketUrl} with options:`, socketOptions);
    
    // Initialize socket
    const socket = io(socketUrl, socketOptions);
    socketRef.current = socket;
    
    // Set up all event handlers
    
    // Connection established
    socket.on('connect', () => {
      console.log(`Socket connected! Transport: ${socket.io.engine.transport.name}`);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      setConnectionAttempts(0);
      
      // Join ticket room
      socket.emit('join', { 
        ticketId, 
        userId, 
        roomId 
      });
    });
    
    // Connection error
    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      console.log('Socket options used:', socketOptions);
      
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError(error);
    });
    
    // Disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      setIsConnected(false);
    });
    
    // Server ping for heartbeat
    socket.on('ping', () => {
      setLastPingTime(Date.now());
    });
    
    // Receive messages
    socket.on('message', (data) => {
      // Add message to state
      setMessages(prev => {
        // Improved duplicate detection
        // Check if we already have this message by ID or tempId
        const exists = prev.some(msg => 
          // Check permanent ID match
          msg._id === data._id || 
          // Check if the server returned our temporary ID
          (data.tempId && msg.tempId === data.tempId) ||
          // Check if this is a response to our temporary message
          (msg.tempId && data._id && socket.io.engine.transport.name === "polling" && 
           msg.content === data.content && 
           msg.user._id === data.user._id &&
           Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 10000)
        );
        
        if (exists) {
          // Update the existing message with server data
          return prev.map(msg => {
            // Update by either direct ID match or temporary ID match
            if (msg._id === data._id || 
                (data.tempId && msg.tempId === data.tempId) ||
                (msg.tempId && data._id && 
                 msg.content === data.content && 
                 msg.user._id === data.user._id &&
                 Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 10000)) {
              // Preserve existing reactions if the new data doesn't have any
              const reactions = data.reactions?.length ? data.reactions : 
                                (msg.reactions?.length ? msg.reactions : []);
              
              return {
                ...data,
                _id: data._id || msg._id, // Keep the permanent ID if available
                isPending: false,
                reactions // Use preserved reactions
              };
            }
            return msg;
          });
        }
        
        // Otherwise add as new message
        return [...prev, { ...data, isPending: false }];
      });
      
      // Mark as read if not our own message
      if (data.user._id !== userId) {
        socket.emit('mark-read', {
          messageIds: [data._id],
          userId
        });
      }
    });
    
    // Message edited
    socket.on('message-edited', (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === data.messageId 
            ? {...msg, content: data.content, isEdited: true} 
            : msg
        )
      );
    });
    
    // Reaction added or removed - listen for all possible server event names
    socket.on('reaction-updated', handleReactionUpdate);
    socket.on('message-reaction-update', handleReactionUpdate);
    
    // Shared reaction update handler
    function handleReactionUpdate(data: any) {
      console.log('➡️ Reaction update received:', JSON.stringify(data));
      console.log('[REACTION DEBUG] Received reaction update from server:', {
        time: new Date().toISOString(),
        eventName: data.event || 'unknown',
        messageId: data.messageId,
        ticketId: data.ticketId,
        reactionsCount: data.reactions?.length || 0
      });
      
      if (!data || !data.messageId || !data.reactions) {
        console.error('Invalid reaction data received:', data);
        return;
      }
      
      // Store reactions in a global variable for debugging
      try {
        // Use safer method for debugging that doesn't trigger linter errors
        console.log('[REACTION DEBUG STORAGE]', data.reactions);
        // Store for debugging in console
        if (typeof window !== 'undefined') {
          (window as any)._debugReactions = data.reactions;
        }
      } catch (e) {
        // Ignore error - this is just for debugging
      }
      
      // Always log the full reaction data for debugging
      console.log(`Full reactions data for message ${data.messageId}:`, 
        JSON.stringify(data.reactions.map((r: any) => ({
          emoji: r.emoji,
          user: r.userId || r.user
        })))
      );
      
      // Extract userId from reaction data for debugging (if available)
      const reactingUserId = data.userId || 'unknown';
      const isOwnReaction = reactingUserId === userId;
      console.log(`This reaction was ${isOwnReaction ? 'MINE' : 'from another user'} (${reactingUserId})`);
      
      setMessages(prev => {
        // First try to find the message by its permanent ID
        let messageFound = false;
        const messagesBeforeUpdate = [...prev];
        
        const updatedMessages = prev.map(msg => {
          // Check for exact ID match
          if (msg._id === data.messageId) {
            messageFound = true;
            console.log(`✅ Updating reactions for message ${msg._id}:`, data.reactions);
            console.log('Previous reactions:', msg.reactions);
            
            // Convert server reaction format to client format
            // Server sends: { emoji, userId, createdAt }
            // Client expects: { emoji, user, createdAt }
            const formattedReactions = data.reactions.map((r: any) => ({
              emoji: r.emoji,
              user: r.userId || r.user, // Use userId if available, fallback to user
              createdAt: r.createdAt
            }));
            
            console.log('Formatted reactions:', formattedReactions);
            
            // Ensure we keep any additional properties that might be on the message
            const updatedMsg = {
              ...msg,
              reactions: formattedReactions
            };
            
            // Verify reactions were correctly assigned
            console.log(`Updated message now has ${updatedMsg.reactions?.length || 0} reactions`);
            
            return updatedMsg;
          }
          
          return msg;
        });
        
        if (!messageFound) {
          console.warn(`❌ Message not found for reaction update. ID: ${data.messageId}, userId: ${data.userId}`);
          console.log('Available messages:', messagesBeforeUpdate.map(m => ({ 
            id: m._id, 
            tempId: m.tempId, 
            content: m.content?.substring(0, 20),
            userId: m.user?._id
          })));
        }
        
        return updatedMessages;
      });
    }
    
    // Handle force-update of a reaction (for debugging)
    socket.on('force-reaction-update', (data) => {
      console.log('Force reaction update received:', data);
      
      // This event can be manually triggered for debugging
      if (data.messageId && Array.isArray(data.reactions)) {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === data.messageId 
              ? {...msg, reactions: data.reactions}
              : msg
          )
        );
      }
    });
    
    // Handle our own reaction confirmations
    socket.on('self-reaction-updated', (data) => {
      console.log('✅ Self reaction update confirmed:', data);
      
      if (!data || !data.messageId || !data.reactions) {
        console.error('Invalid self reaction data received:', data);
        return;
      }
      
      // Update our message with the confirmed reactions from server
      setMessages(prev => {
        return prev.map(msg => {
          if (msg._id === data.messageId) {
            console.log(`Updating reactions for our message ${msg._id}:`, data.reactions);
            return {
              ...msg,
              reactions: data.reactions
            };
          }
          return msg;
        });
      });
    });
    
    // Message read status updated
    socket.on('read-status-updated', (data) => {
      setMessages(prev => 
        prev.map(msg => {
          if (data.messageIds.includes(msg._id)) {
            const readBy = Array.isArray(msg.readBy) ? [...msg.readBy] : [];
            if (!readBy.includes(data.userId)) {
              readBy.push(data.userId);
            }
            return {...msg, readBy};
          }
          return msg;
        })
      );
    });
    
    // Typing indicators
    socket.on('typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.isTyping
      }));
    });
    
    // Online users update
    socket.on('online-users', (users) => {
      onlineUsersRef.current = users;
    });
    
    // File uploaded
    socket.on('file_uploaded', (fileData) => {
      setMessages(prev => {
        const updatedMessages = [...prev];
        const messageIndex = updatedMessages.findIndex((m) => m._id === fileData.messageId);
        
        if (messageIndex !== -1) {
          const message = {...updatedMessages[messageIndex]};
          message.attachments = [...(message.attachments || []), fileData];
          updatedMessages[messageIndex] = message;
        }
        
        return updatedMessages;
      });
    });
    
    return socket;
  }, [ticketId, userId, roomId]);

  // Initialize on mount
  useEffect(() => {
    // Track if component is mounted
    let isMounted = true;
    let connectionTimeout: NodeJS.Timeout | null = null;
    
    // Connect immediately
    if (!socketRef.current) {
      try {
        setIsConnecting(true);
        const socket = connectSocket();
        
        // Set a connection timeout
        connectionTimeout = setTimeout(() => {
          if (isMounted && socketRef.current && !socketRef.current.connected) {
            console.log("Connection attempt timed out");
            setConnectionError(new Error("Connection timeout - server may be unavailable"));
            setIsConnecting(false);
          }
        }, 8000);
      } catch (error) {
        console.error("Failed to connect socket:", error);
        setConnectionError(error instanceof Error ? error : new Error('Failed to connect socket'));
        setIsConnecting(false);
      }
    }
    
    // Cleanup
    return () => {
      isMounted = false;
      
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      
      if (socketRef.current) {
        console.log("Disconnecting socket on cleanup");
        
        try {
          // First remove all listeners to prevent errors during disconnect
          socketRef.current.removeAllListeners();
          
          // Disable reconnection before disconnecting
          if (socketRef.current.io && socketRef.current.io.opts) {
            socketRef.current.io.opts.reconnection = false;
          }
          
          // Then disconnect
          socketRef.current.disconnect();
        } catch (e) {
          console.log("Error during socket cleanup:", e);
        }
        
        socketRef.current = null;
      }
    };
  }, [connectSocket]);
  
  // Manual reconnection function
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionAttempts(prev => prev + 1);
    setIsConnecting(true);
    setConnectionError(null);
    connectSocket();
  }, [connectSocket]);
  
  // Function to send a message
  const sendMessage = useCallback((content: string, attachments: any[] = [], replyTo?: string, mentions: string[] = []) => {
    if (!socketRef.current) {
      return null;
    }
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Find reply content if available
    let replyToContent;
    let replyToUser;
    if (replyTo) {
      const replyMessage = messages.find(msg => msg._id === replyTo);
      if (replyMessage) {
        replyToContent = replyMessage.content;
        replyToUser = replyMessage.user;
      }
    }
    
    // Create a temporary message object to display immediately
    const message = {
      _id: tempId,  // Temporary ID that will be replaced when the server responds
      tempId,       // Used to match the server response
      ticket: ticketId,
      user: currentUser || { _id: userId },
      content,
      attachments: attachments || [],
      replyTo,
      replyToContent,
      replyToUser,
      mentions,
      createdAt: new Date().toISOString(),
      isPending: true,  // Mark as pending until server confirms
      readBy: [userId]  // Mark as read by the sender
    };
    
    // Add to messages state to show immediately
    setMessages(prev => {
      // Check if we already have this message (prevent duplicates)
      const exists = prev.some(msg => 
        msg.tempId === tempId || 
        (msg.content === content && 
         msg.user._id === userId &&
         Math.abs(new Date(msg.createdAt).getTime() - Date.now()) < 5000)
      );
      
      if (exists) {
        return prev;
      }
      
      return [...prev, message];
    });
    
    // Emit to server
    socketRef.current.emit('message', {
      ticketId,
      userId,
      content,
      attachments,
      replyTo,
      replyToContent,
      mentions,
      tempId,
      user: currentUser
    });
    
    return tempId;
  }, [messages, ticketId, userId, currentUser]);
  
  // Function to edit a message
  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('edit-message', {
      messageId,
      content: newContent,
      userId
    });
    
    // Optimistic update
    setMessages(prev => 
      prev.map(msg => 
        msg._id === messageId 
          ? {...msg, content: newContent, isEdited: true} 
          : msg
      )
    );
  }, [userId]);
  
  // Function to add a reaction
  const addReaction = useCallback((messageId: string, emoji: string, action: 'add' | 'remove' = 'add') => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error('Cannot add reaction: Socket not connected');
      toast.error('Cannot add reaction - no connection');
      return;
    }

    try {
      console.log(`[REACTION] Emitting ${action} reaction ${emoji} to message ${messageId.slice(-6)} by user ${userId}`);
      
      // Find the message to check existing reactions
      const message = messages.find(msg => msg._id === messageId);
      if (!message) {
        console.error(`Message not found: ${messageId}`);
        return;
      }
      
      // Check if user already reacted with this emoji
      const userReactionExists = message.reactions?.some(
        (r: Reaction) => r.emoji === emoji && (r.user === userId || r.user === currentUser?._id)
      );
      
      // Determine action based on existing reactions (toggle behavior)
      const effectiveAction = userReactionExists ? 'remove' : 'add';
      
      console.log(`[REACTION] User has ${userReactionExists ? 'already' : 'not'} reacted with this emoji. Action: ${effectiveAction}`);
      
      // Emit reaction event to server
      socketRef.current.emit('message-reaction', {
        messageId,
        emoji,
        userId,
        ticketId: ticketId,
        action: effectiveAction,
        timestamp: new Date().toISOString()
      });

      // Optimistic update
      setMessages(prev => {
        return prev.map(msg => {
          if (msg._id === messageId) {
            const reactions = Array.isArray(msg.reactions) ? [...msg.reactions] : [];
            
            // Check if user already reacted with this emoji
            const existingReactionIndex = reactions.findIndex(
              (r: Reaction) => r.emoji === emoji && (r.user === userId || r.user === currentUser?._id)
            );
            
            if (existingReactionIndex >= 0) {
              // Remove the reaction (toggle behavior)
              console.log(`[REACTION] Removing existing reaction at index ${existingReactionIndex}`);
              reactions.splice(existingReactionIndex, 1);
            } else {
              // Add the reaction
              console.log(`[REACTION] Adding new reaction`);
              reactions.push({ 
                emoji, 
                user: userId, 
                createdAt: new Date().toISOString()
              });
            }
            
            console.log(`[REACTION] Updated reactions:`, reactions);
            
            return {
              ...msg,
              reactions
            };
          }
          return msg;
        });
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, [socketRef, userId, currentUser, ticketId, messages, setMessages]);
  
  // Function to mark messages as read
  const markMessagesAsRead = useCallback((messageIds: string[]) => {
    if (!socketRef.current || messageIds.length === 0) return;
    
    // Emit read status
    socketRef.current.emit('mark-read', {
      messageIds,
      userId
    });
    
    // Optimistic update
    setMessages(prev => 
      prev.map(msg => {
        if (!messageIds.includes(msg._id)) return msg;
        
        const readBy = Array.isArray(msg.readBy) ? [...msg.readBy] : [];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
        }
        
        return {...msg, readBy};
      })
    );
    
    // Also update in database
    markAsRead({ commentIds: messageIds, userId }).catch(() => {});
  }, [userId, markAsRead]);
  
  // Function for typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('typing', {
      ticketId,
      userId,
      isTyping
    });
  }, [ticketId, userId]);
  
  // Function to get online users
  const getOnlineUsers = useCallback(() => {
    return onlineUsersRef.current;
  }, []);
  
  // Function to notify about a file upload
  const notifyFileUpload = useCallback((fileData: any) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('file_uploaded', {
      ...fileData,
      ticketId,
      userId
    });
  }, [ticketId, userId]);
  
  // Function to simulate reaction updates from server (for debugging when reactions don't appear)
  const simulateReactionUpdate = useCallback((messageId: string) => {
    if (!socketRef.current) return;
    
    // Find the message
    const message = messages.find(msg => msg._id === messageId);
    if (!message) {
      console.error(`Message not found: ${messageId}`);
      return;
    }
    
    // Get current reactions
    const currentReactions = Array.isArray(message.reactions) ? [...message.reactions] : [];
    
    console.log(`Simulating reaction update for message: ${messageId}`);
    console.log(`Current reactions:`, currentReactions);
    
    // Simulate a reaction-updated event
    setMessages(prev => 
      prev.map(msg => {
        if (msg._id === messageId) {
          console.log(`Force updating reactions for message ${msg._id}`);
          // Apply our own copy to force a re-render
          return {
            ...msg,
            reactions: [...currentReactions]
          };
        }
        return msg;
      })
    );
    
    toast.info(`Simulated reaction update for message ${messageId.slice(-6)}`);
  }, [messages]);
  
  // Function to test reactions (for debugging)
  const testReaction = useCallback((messageId: string, emoji: string) => {
    if (!socketRef.current?.connected) {
      console.error('Cannot test reaction: Socket not connected');
      return;
    }
    
    console.log(`[TEST] Sending test reaction ${emoji} to message ${messageId}`);
    
    // Use consistent event name
    socketRef.current.emit('message-reaction', {
      messageId,
      emoji,
      userId,
      ticketId,
      action: 'add',
      timestamp: new Date().toISOString()
    });
  }, [socketRef, userId, ticketId]);
  
  // Update messages externally
  const updateMessages = useCallback((newMessages: any[]) => {
    console.log(`[DEBUG] updateMessages called with ${newMessages.length} messages`);
    
    setMessages(prev => {
      // Log current messages with reactions for debugging
      const messagesWithReactions = prev.filter(msg => msg.reactions && msg.reactions.length > 0);
      if (messagesWithReactions.length > 0) {
        console.log(`[DEBUG] Current messages with reactions (${messagesWithReactions.length}):`, 
          messagesWithReactions.map(m => ({ 
            id: m._id.slice(-6), 
            reactions: m.reactions?.length || 0
          }))
        );
      }
      
      // Map of message IDs to their reactions from current state
      const existingReactionsMap: Record<string, any[]> = {};
      prev.forEach(msg => {
        if (msg._id && Array.isArray(msg.reactions) && msg.reactions.length > 0) {
          existingReactionsMap[msg._id] = msg.reactions;
          console.log(`[DEBUG] Saving ${msg.reactions.length} reactions for message ${msg._id.slice(-6)}`);
        }
      });
      
      // Keep temporary messages that don't have a matching processed message
      const tempMessages = prev.filter(msg => 
        msg.tempId && 
        // Only keep if not already in new messages
        !newMessages.some(m => 
          m._id === msg._id || 
          (msg.content === m.content && 
           msg.user?._id === m.user?._id && 
           Math.abs(new Date(msg.createdAt).getTime() - new Date(m.createdAt).getTime()) < 10000)
        )
      );
      
      // Process new messages to restore reactions if needed
      const processedMessages = newMessages.map(msg => {
        const processedMsg = {...msg};
        
        // If a message has no reactions but we have saved reactions for it, restore them
        if (msg._id && 
            existingReactionsMap[msg._id] && 
            (!Array.isArray(msg.reactions) || msg.reactions.length === 0)) {
          processedMsg.reactions = existingReactionsMap[msg._id];
          console.log(`[DEBUG] Restored ${existingReactionsMap[msg._id].length} reactions for message ${msg._id.slice(-6)}`);
        }
        
        return processedMsg;
      });
      
      // Merge with temp messages - avoid duplicates by filtering the tempMessages
      const tempMessagesFiltered = tempMessages.filter(
        (temp: any) => !processedMessages.some(msg => msg._id === temp._id)
      );
      
      console.log(`[DEBUG] Merging ${processedMessages.length} processed messages with ${tempMessagesFiltered.length} temp messages`);
      return [...tempMessagesFiltered, ...processedMessages];
    });
  }, []);
  
  return {
    isConnected,
    isConnecting,
    connectionError,
    connectionAttempts,
    messages,
    typingUsers,
    getOnlineUsers,
    updateMessages,
    sendMessage,
    editMessage,
    addReaction,
    markMessagesAsRead,
    sendTyping,
    notifyFileUpload,
    connectSocket,
    reconnect,
    testReaction,
    simulateReactionUpdate
  };
};