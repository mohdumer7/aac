// src/components/TicketComponent/MessageBubble.tsx
import React, { useState, memo, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CornerUpRight, Check, CheckCircle2, Clock, Edit, 
  Trash, Download, Reply, MoreVertical, Pencil, Smile, AlertCircle,
  FileText, Image as ImageIcon, Video, Link, File
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { toast } from 'react-toastify';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import FilePreviewDialog from '@/components/ui/FilePreviewDialog';
import { Portal } from "@/components/ui/portal";
import { createPortal } from 'react-dom';

// Common emojis to use for reactions
const commonEmojis = ['👍', '👎', '❤️', '😄', '😢', '🎉', '😮', '🙏'];

interface MessageBubbleProps {
  message: any;
  currentUserId: string;
  onReply: (message: any) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  formatMessageContent: (content: string) => React.ReactNode;
  getFileIcon: (fileType: string) => React.ReactNode;
  formatFileSize: (bytes: number) => string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
  onReply,
  onReaction,
  onEdit,
  formatMessageContent,
  getFileIcon,
  formatFileSize
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageContentRef = useRef<HTMLDivElement>(null);
  const messageBubbleRef = useRef<HTMLDivElement>(null);
  
  const isCurrentUser = message.user._id === currentUserId;
  const isPending = message.isPending;
  const hasError = message.error;
  
  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editedContent.length, editedContent.length);
    }
  }, [isEditing, editedContent]);
  
  // Handle edit submission
  const handleSubmitEdit = () => {
    if (editedContent.trim() === '') {
      toast.error('Message cannot be empty');
      return;
    }
    
    if (editedContent.trim() !== message.content) {
      onEdit(message._id, editedContent);
    }
    setIsEditing(false);
  };
  
  // Cancel edit
  const handleCancelEdit = () => {
    setEditedContent(message.content || '');
    setIsEditing(false);
  };
  
  // Check if the message is less than 5 minutes old (for edit capability)
  const canEdit = () => {
    if (!isCurrentUser) return false;
    if (isPending || hasError) return false;
    
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    return (now - messageTime) < fiveMinutesInMs;
  };
  
  // Check if the current user has reacted with this emoji
  const hasUserReacted = (emoji: string) => {
    if (!message.reactions) return false;
    
    return message.reactions.some((r: any) => {
      const reactingUserId = r.user || r.userId;
      const matched = r.emoji === emoji && reactingUserId === currentUserId;
      
      // Add debug info for this specific check
      if (r.emoji === emoji) {
        console.log(`[Reaction Check] Emoji: ${emoji}, User: ${reactingUserId}, Current: ${currentUserId}, Matched: ${matched}`);
      }
      
      return matched;
    });
  };
  
  // Count reactions by emoji
  const countReactions = (emoji: string) => {
    if (!message.reactions) return 0;
    return message.reactions.filter((r: any) => r.emoji === emoji).length;
  };
  
  // Get unique reaction emojis
  const getUniqueReactionEmojis = () => {
    if (!message.reactions || message.reactions.length === 0) return [];
    
    // Debug the full reactions list
    console.log(`[DEBUG] All reactions for message ${message._id?.slice(-6) || 'unknown'}:`, 
      message.reactions.map((r: any) => ({
        emoji: r.emoji,
        user: r.user || r.userId
      }))
    );
    
    const emojis = message.reactions.map((r: any) => r.emoji);
    return [...new Set(emojis)] as string[];
  };
  
  // Handle key press in edit mode
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEdit();
    }
    
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  
  // Render status indicators for the message
  const renderMessageStatus = () => {
    if (isPending) {
      return (
        <span className="ml-1 flex items-center text-xs">
          <Clock className="h-3 w-3 text-gray-400 mr-1 animate-pulse" />
          <span className="text-gray-400">Sending...</span>
        </span>
      );
    }
    
    if (hasError) {
      return (
        <span className="ml-1 flex items-center text-xs">
          <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
          <span className="text-red-500">Failed</span>
        </span>
      );
    }
    
    if (isCurrentUser) {
      if (message.readBy && message.readBy.length > 1) {
        return (
          <span className="ml-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          </span>
        );
      } else if (message.deliveredAt) {
        return (
          <span className="ml-1">
            <Check className="h-3 w-3 text-blue-200" />
          </span>
        );
      }
    }
    
    return null;
  };

  // Get appropriate icon based on file type
  const getAppropriateIcon = (fileType: string) => {
    if (!fileType) return <FileText className="h-4 w-4 text-gray-500" />;
    
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('doc') || fileType.includes('docx')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (fileType.includes('xls') || fileType.includes('xlsx')) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else if (fileType.includes('ppt') || fileType.includes('pptx')) {
      return <FileText className="h-4 w-4 text-orange-500" />;
    } else if (fileType.includes('zip') || fileType.includes('rar')) {
      return <File className="h-4 w-4 text-purple-500" />;
    } else {
      return <File className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get file URL with fallback
  const getFileUrl = (attachment: any) => {
    // If we have a direct URL, use it
    if (attachment.url) {
      return attachment.url.startsWith('http') ? attachment.url : `${attachment.url}`;
    }
    
    // If we have a stored filename, construct the URL
    if (attachment.storedFileName) {
      return `/uploads/${attachment.storedFileName}`;
    }
    
    // Fallback to the original filename
    return `/uploads/${attachment.fileName || attachment.originalName || ''}`;
  };
  
  // Get download URL with proper parameters
  const getDownloadUrl = (attachment: any) => {
    const filename = attachment.storedFileName || attachment.fileName;
    const originalName = attachment.originalName || attachment.fileName || 'download';
    
    if (!filename) return '';
    
    // Use our dedicated download API to ensure proper content disposition
    return `/api/download?file=${encodeURIComponent(filename)}&originalName=${encodeURIComponent(originalName)}`;
  };

  // Handle file preview
  const handleFilePreview = (attachment: any) => {
    setPreviewFile(attachment);
    setShowFilePreview(true);
  };

  // Handle file download
  const handleDownload = (attachment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl = getDownloadUrl(attachment);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', attachment.originalName || attachment.fileName || 'download');
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Emoji Picker with absolute positioning
  const EmojiPickerPopover = () => {
    if (!showEmojiPicker) return null;
    
    const [position, setPosition] = useState({ top: 0, left: 0 });
    
    // Calculate position when shown
    useEffect(() => {
      if (showEmojiPicker && messageBubbleRef.current) {
        const rect = messageBubbleRef.current.getBoundingClientRect();
        const bubbleWidth = rect.width;
        const pickerWidth = 250; // Width of the emoji picker
        
        // For right-aligned messages (current user), align to the right edge of the bubble
        // For left-aligned messages (other users), align to the left edge of the bubble
        let leftPos;
        if (isCurrentUser) {
          // Right alignment - ensure it doesn't go off-screen to the right
          leftPos = Math.min(
            window.innerWidth - pickerWidth - 10, 
            rect.right - pickerWidth
          );
        } else {
          // Left alignment - ensure it doesn't go off-screen to the left
          leftPos = Math.max(10, rect.left);
        }
        
        setPosition({
          top: rect.bottom + window.scrollY + 5, // 5px gap below the message
          left: leftPos,
        });
      }
    }, [showEmojiPicker, isCurrentUser]);
    
    // Handle clicks outside to close the picker
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        // Close picker if click is outside both the picker and the message bubble
        if (
          messageBubbleRef.current && 
          !messageBubbleRef.current.contains(e.target as Node) &&
          !(e.target as Element).closest('.emoji-picker-container')
        ) {
          setShowEmojiPicker(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Create portal directly
    return createPortal(
      <div 
        className="emoji-picker-container fixed shadow-lg rounded-lg z-[9999]"
        style={{ 
          top: `${position.top}px`, 
          left: `${position.left}px`,
        }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[250px]">
          <div className="grid grid-cols-8 gap-2">
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                className="text-xl hover:bg-gray-100 p-1 rounded-lg cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onReaction(message._id, emoji);
                  setShowEmojiPicker(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>,
      document.body
    );
  };
  
  return (
    <TooltipProvider>
      <motion.div
        id={`message-${message._id}`}
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0 }
        }}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.2 }}
        className={cn(
          "flex gap-3",
          isCurrentUser ? "flex-row-reverse" : ""
        )}
      >
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          {message.user.avatar ? (
            <AvatarImage src={message.user.avatar} />
          ) : (
            <AvatarFallback className={isCurrentUser ? "bg-indigo-100 text-indigo-800" : "bg-gray-100"}>
              {message.user.firstName?.[0] || ''}
              {message.user.lastName?.[0] || ''}
              {!message.user.firstName && !message.user.lastName ? message.user._id.substring(0, 2) : ''}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div 
          ref={messageBubbleRef}
          className={cn(
            "max-w-[80%]",
            isCurrentUser ? "items-end" : ""
          )}
        >
          <div className={cn(
            "rounded-lg px-4 py-2 relative shadow-sm",
            isPending ? "opacity-80" : "",
            hasError ? "border border-red-300" : "",
            isCurrentUser 
              ? "bg-indigo-500 text-white rounded-tr-none" 
              : "bg-gray-100 text-gray-800 rounded-tl-none"
          )}>
            <div className="flex justify-between items-center mb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "font-medium text-xs",
                    isCurrentUser ? "text-indigo-100" : "text-gray-600"
                  )}>
                    {isCurrentUser ? 'You' : `${message.user.firstName || ''} ${message.user.lastName || ''}`}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isCurrentUser 
                      ? 'You' 
                      : `${message.user.firstName || ''} ${message.user.lastName || ''}`}
                    {message.user.department ? ` • ${message.user.department.name}` : ''}
                  </p>
                </TooltipContent>
              </Tooltip>
              
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn(
                      "text-xs",
                      isCurrentUser ? "text-indigo-100" : "text-gray-500"
                    )}>
                      {format(new Date(message.createdAt), 'h:mm a')}
                      {message.isEdited && (
                        <span className="ml-1 text-xs italic">
                          (edited)
                        </span>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{format(new Date(message.createdAt), 'EEEE, MMMM d, yyyy h:mm a')}</p>
                  </TooltipContent>
                </Tooltip>
                
                {/* Message status indicators */}
                {renderMessageStatus()}
                
                {/* Message options dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={cn(
                        "h-5 w-5 p-0 hover:bg-opacity-20", 
                        isCurrentUser ? "hover:bg-indigo-600" : "hover:bg-gray-200"
                      )}
                    >
                      <MoreVertical className={cn(
                        "h-3 w-3",
                        isCurrentUser ? "text-indigo-100" : "text-gray-500"
                      )} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isCurrentUser ? "end" : "start"} side="top">
                    <DropdownMenuItem onClick={() => onReply(message)} className="flex items-center">
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault();
                      // Position the emoji picker near the current message
                      const messageElement = document.getElementById(`message-${message._id}`);
                      if (messageElement) {
                        // Wait for next tick to allow dropdown to close first
                        setTimeout(() => setShowEmojiPicker(true), 100);
                      } else {
                        setShowEmojiPicker(true);
                      }
                    }} className="flex items-center">
                      <Smile className="h-4 w-4 mr-2" />
                      Add Reaction
                    </DropdownMenuItem>
                    
                    {canEdit() && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsEditing(true)} className="flex items-center">
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {hasError && isCurrentUser && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500 flex items-center">
                          <Reply className="h-4 w-4 mr-2" />
                          Retry
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {message.replyTo && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "text-xs p-2 rounded mb-2 flex flex-col gap-1",
                  isCurrentUser 
                    ? "bg-indigo-600 border-l-2 border-indigo-300" 
                    : "bg-gray-200 border-l-2 border-gray-400"
                )}
              >
                <span className={cn(
                  "font-medium flex items-center gap-1",
                  isCurrentUser ? "text-indigo-100" : "text-gray-700"
                )}>
                  <CornerUpRight className="h-3 w-3" />
                  Replying to {message.replyToUser?.firstName || "User"}
                </span>
                <span className={cn(
                  "italic line-clamp-1",
                  isCurrentUser ? "text-indigo-100" : "text-gray-600"
                )}>
                  {message.replyTo?.content || message.replyToContent || "Original message"}
                </span>
              </motion.div>
            )}
            
            {isEditing ? (
              <div className="mt-1">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={cn(
                    "min-h-[60px] text-sm p-2 resize-none border-0",
                    isCurrentUser ? "bg-indigo-600 text-white placeholder-indigo-200" : "bg-white text-gray-800"
                  )}
                  ref={textareaRef}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCancelEdit}
                    className={isCurrentUser ? "text-indigo-200 hover:text-white hover:bg-indigo-600" : ""}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSubmitEdit}
                    className={isCurrentUser ? "bg-indigo-700 hover:bg-indigo-800" : ""}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn(
                "whitespace-pre-line break-words",
                isCurrentUser ? "text-white" : "text-gray-800"
              )}>
                {formatMessageContent(message.content || '')}
              </div>
            )}
          </div>
          
          {/* Message Reactions */}
          <AnimatePresence>
            {getUniqueReactionEmojis().length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={cn(
                  "flex flex-wrap gap-1 mt-1",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {getUniqueReactionEmojis().map(emoji => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs transition-colors",
                      hasUserReacted(emoji)
                        ? "bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border border-indigo-200"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200"
                    )}
                    onClick={() => onReaction(message._id, emoji)}
                  >
                    <span className="mr-1">{emoji}</span>
                    <span>{countReactions(emoji)}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Custom emoji picker */}
          <EmojiPickerPopover />
          
          {/* Display attachments */}
          <AnimatePresence>
            {message.attachments && message.attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-2 flex flex-wrap gap-2"
              >
                {message.attachments.map((attachment: any, index: number) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -2, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                    className={cn(
                      "rounded-lg overflow-hidden border",
                      isCurrentUser ? "ml-auto border-indigo-200" : "border-gray-200"
                    )}
                    style={{ maxWidth: '250px' }}
                    onClick={() => handleFilePreview(attachment)}
                  >
                    {attachment.fileType?.startsWith('image/') ? (
                      <div className="relative group max-w-[200px] max-h-[200px]">
                        <img 
                          src={getFileUrl(attachment)} 
                          alt={attachment.fileName || 'Image attachment'}
                          className="max-w-[200px] max-h-[200px] rounded-lg object-contain"

                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="bg-white bg-opacity-80"
                            onClick={(e) => handleDownload(attachment, e)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded-lg",
                        isCurrentUser ? "bg-indigo-50 text-indigo-700" : "bg-gray-50 text-gray-700", 
                        "cursor-pointer"
                      )}>
                        {getAppropriateIcon(attachment.fileType)}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate max-w-[150px]">
                            {attachment.fileName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(attachment.fileSize)}
                          </div>
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={(e) => handleDownload(attachment, e)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Message actions */}
          {!isEditing && !isPending && !hasError && (
            <div className={cn(
              "flex mt-1 text-xs text-gray-500 gap-2",
              isCurrentUser ? "justify-end" : ""
            )}>
              <motion.button 
                className="hover:text-indigo-600 transition-colors"
                onClick={() => onReply(message)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reply
              </motion.button>
              
              <motion.button 
                className="hover:text-indigo-600 transition-colors"
                onClick={() => setShowEmojiPicker(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                React
              </motion.button>
              
              {canEdit() && (
                <motion.button 
                  className="hover:text-indigo-600 transition-colors"
                  onClick={() => setIsEditing(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Edit
                </motion.button>
              )}
            </div>
          )}
        </div>
        
        {/* File Preview Dialog */}
        {showFilePreview && previewFile && (
          <FilePreviewDialog
            isOpen={showFilePreview}
            onClose={() => setShowFilePreview(false)}
            file={previewFile}
            formatFileSize={formatFileSize}
          />
        )}
      </motion.div>
    </TooltipProvider>
  );
};

export default memo(MessageBubble);