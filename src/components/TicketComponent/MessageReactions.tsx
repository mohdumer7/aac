// src/components/TicketComponent/MessageReactions.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile, Plus, AlertCircle } from 'lucide-react';
import { Portal } from '@/components/ui/portal';

interface Reaction {
  emoji: string;
  userId: string;
  createdAt: Date;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  messageId: string;
  userId: string;
  onAddReaction: (emoji: string) => void;
  position: string;
}

const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '👏', '🎉', '🔥', '✅', '❌'];

const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  messageId,
  userId,
  onAddReaction,
  position
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isCurrentUser = position === 'right';
  
  // Group reactions by emoji
  const groupedReactions = reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>) || {};
  
  // Log reactions for debugging
  useEffect(() => {
    console.log(`MessageReactions for message ${messageId}:`, reactions);
  }, [reactions, messageId]);
  
  // Handle clicking on a reaction
  const handleReactionClick = (emoji: string) => {
    try {
      onAddReaction(emoji);
      setError(null);
    } catch (err) {
      console.error('Error adding reaction:', err);
      setError('Failed to add reaction');
    }
  };
  
  // Handle adding a new reaction
  const handleAddReaction = (emoji: string) => {
    try {
      onAddReaction(emoji);
      setShowEmojiPicker(false);
      setError(null);
    } catch (err) {
      console.error('Error adding reaction:', err);
      setError('Failed to add reaction');
    }
  };
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if ((!reactions || reactions.length === 0) && !showEmojiPicker) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'} relative z-10`}>
      {error && (
        <div className="absolute -top-8 left-0 right-0 bg-red-100 text-red-600 text-xs p-1 rounded flex items-center justify-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}
      
      {Object.entries(groupedReactions).map(([emoji, users]) => {
        const hasReacted = users.some(r => r.userId === userId);
        
        return (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className={`
              h-6 px-1.5 py-0 rounded-full text-xs flex items-center gap-1
              ${hasReacted ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'hover:bg-gray-100'}
            `}
            onClick={() => handleReactionClick(emoji)}
          >
            <span>{emoji}</span>
            <span className="text-xs">{users.length}</span>
          </Button>
        );
      })}
      
      <Portal>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
              ref={triggerRef}
            >
              <Plus className="h-3.5 w-3.5 text-gray-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-2 z-[100]" 
            align={isCurrentUser ? 'end' : 'start'} 
            side="bottom"
            sideOffset={5}
            forceMount
            avoidCollisions={true}
          >
            <div className="flex flex-wrap gap-2 max-w-[200px] bg-white rounded-lg shadow-lg p-1 border border-gray-200">
              {commonEmojis.map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleAddReaction(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </Portal>
    </div>
  );
};

export default MessageReactions;