// src/components/TicketComponent/CollapsibleChat.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Minimize2, Maximize2, MessagesSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TicketChat from './TicketChat';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGetTicketCommentsQuery } from '@/services/endpoints/ticketCommentApi';

interface CollapsibleChatProps {
  ticketId: string;
  userId: string;
  currentUser: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// Define the comment type to fix TypeScript errors
interface Comment {
  _id: string;
  user: { _id: string };
  createdAt: string;
}

const CollapsibleChat: React.FC<CollapsibleChatProps> = ({
  ticketId,
  userId,
  currentUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState<Date | null>(null);

  // Use a ref to track if we've processed the comments data
  const processedCommentsRef = useRef(false);
  
  // Memoize query parameters to prevent unnecessary re-fetches
  const queryParams = useMemo(() => ({ 
    ticketId 
  }), [ticketId]);
  
  // Get comments data to track unread messages
  const { 
data: commentsData, 
isLoading: commentsLoading 
} = useGetTicketCommentsQuery(queryParams, {
    // Disable automatic polling/refetching to prevent multiple calls
    pollingInterval: 0,
    refetchOnMountOrArgChange: false
  });
  /* console.log("callling...",{ticketId,
    userId,
    currentUser,commentsData})
  // Update unread count when new comments come in
  useEffect(() => {
    if (commentsData?.data) {
      // If the chat is open, mark messages as read
      if (isOpen && !isMinimized) {
        setLastReadTime(new Date());
        setUnreadCount(0);
        return;
      }
      
      // Otherwise, count unread messages (created after lastReadTime)
      if (lastReadTime) {
        const newMessages = commentsData.data.filter(
          comment => 
            new Date(comment.createdAt) > lastReadTime &&
            comment.user._id !== userId
        );
        setUnreadCount(newMessages.length);
      } else {
        // If first time loading, mark all as read if chat is open
        if (isOpen && !isMinimized) {
          setLastReadTime(new Date());
        } else {
          // Otherwise, count all messages from others as unread
          const unreadMessages = commentsData.data.filter(
            comment => comment.user._id !== userId
          );
          setUnreadCount(unreadMessages.length);
        }
      }
    }
  }, []);
 */
  
  // When opening the chat, mark all messages as read
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setLastReadTime(new Date());
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);
  
  // Update unread count when new comments come in - with proper dependencies
  useEffect(() => {
    // Skip if we don't have comments data yet or if we've already processed this data
    if (!commentsData?.data || processedCommentsRef.current) {
      return;
    }
    
    // Mark that we've processed this data
    processedCommentsRef.current = true;
    
    // If the chat is open, mark messages as read
    if (isOpen && !isMinimized) {
      setLastReadTime(new Date());
      setUnreadCount(0);
      return;
    }
    
    // Otherwise, count unread messages (created after lastReadTime)
    if (lastReadTime) {
      const newMessages = commentsData?.data?.filter(
        (comment: Comment) => 
           new Date(comment.createdAt) > lastReadTime &&
          comment.user._id !== userId
      );
      setUnreadCount(newMessages.length);
    } else {
        // If first time loading, mark all as read if chat is open
      if (isOpen && !isMinimized) {
        setLastReadTime(new Date());
      } else {
        // Otherwise, count all messages from others as unread
        const unreadMessages = commentsData?.data?.filter(
          (comment: Comment) => comment.user._id !== userId
        );
        setUnreadCount(unreadMessages.length);
      }
    }
    
  }, [commentsData]);
  
  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else {
      setIsOpen(false);
    }
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                height: isMinimized ? '60px' : '70vh',
                width: '400px',
              }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 right-0 w-full max-w-md shadow-2xl rounded-lg overflow-hidden z-40"
            >
              <Card className="flex flex-col h-full">
                <div className="p-3 bg-indigo-600 text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MessagesSquare className="h-5 w-5" />
                    <h3 className="font-medium">Ticket Conversation</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-white hover:bg-indigo-700"
                      onClick={toggleMinimize}
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-white hover:bg-indigo-700"
                      onClick={toggleChat}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {!isMinimized && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex-1 overflow-hidden"
                    >
                      <div className="h-full">
                        <TicketChat
                          ticketId={ticketId}
                          userId={userId}
                          roomId={`ticket-${ticketId}`}
                          socketCurrentUser={currentUser}
                          currentUser={currentUser}
                          isLoading={commentsLoading}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={isOpen ? { rotate: 0 } : unreadCount > 0 ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, repeatType: 'reverse', duration: 1 } } : {}}
            >
              <Button 
                onClick={toggleChat} 
                size="lg"
                variant={isOpen ? "secondary" : "default"}
                className="rounded-full h-14 w-14 shadow-lg relative"
              >
                <MessageCircle className="h-6 w-6" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isOpen ? "Close chat" : "Open ticket conversation"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default CollapsibleChat;