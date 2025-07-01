// src/components/TicketComponent/TicketCommentComponent.tsx
"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCreateTicketCommentMutation } from '@/services/endpoints/ticketCommentApi';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import DashboardLoader from '@/components/ui/DashboardLoader';
import { Paperclip, Send, File, Image, X, AtSign, Reply, CornerUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Comment {
  _id: string;
  ticket: string;
  user: any;
  content: string;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    url: string;
  }>;
  replyTo?: string;
  mentions?: string[];
  createdAt: string;
}

interface TicketCommentComponentProps {
  ticketId: string;
  comments: Comment[];
  isLoading: boolean;
  userId: string;
  currentUserName: string;
}

const TicketCommentComponent: React.FC<TicketCommentComponentProps> = ({
  ticketId,
  comments = [],
  isLoading,
  userId,
  currentUserName
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionsPopover, setShowMentionsPopover] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [createComment] = useCreateTicketCommentMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get department from the first comment's user if available
  const departmentId = comments?.[0]?.user?.department?._id;
  
  // Fetch team members for mentions
  const { data: teamMembersData = {data:[]}} = useGetMasterQuery({
    db: 'USER_MASTER',
    filter: { isActive: true },
    sort: { firstName: 1 }
  });
  
  const teamMembers = teamMembersData?.data || [];
  
  // Current user
  const currentUser = {
    _id: userId,
    firstName: currentUserName.split(' ')[0] || '',
    lastName: currentUserName.split(' ')[1] || ''
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };
  
  // Handle file removal
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle input for detecting @ mentions
  const handleCommentInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setComment(value);
    
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const atSignIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atSignIndex !== -1 && (atSignIndex === 0 || textBeforeCursor[atSignIndex - 1] === ' ')) {
      const query = textBeforeCursor.substring(atSignIndex + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query);
        setMentionStartIndex(atSignIndex);
        setShowMentionsPopover(true);
        return;
      }
    }
    
    setShowMentionsPopover(false);
  };
  
  // Insert mention into comment
  const insertMention = (user: User) => {
    if (mentionStartIndex === -1) return;
    
    const beforeMention = comment.substring(0, mentionStartIndex);
    const afterMention = comment.substring(mentionStartIndex + mentionQuery.length + 1);
    const mentionText = `@${user.firstName} ${user.lastName} `;
    
    setComment(beforeMention + mentionText + afterMention);
    setShowMentionsPopover(false);
    
    // Set focus back to textarea and place cursor after mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = beforeMention.length + mentionText.length;
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };
  
  // Filter team members for mention suggestions
  const filteredTeamMembers = teamMembers.filter((user:any) => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase())
  );
  
  // Handle reply to a comment
  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };
  
  // Handle comment submission
  const handleSubmit = async () => {
    if ((!comment.trim() && selectedFiles.length === 0) || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // For now, we'll mock the file uploads
      const mockAttachments = selectedFiles.map(file => ({
        fileName: file.name,
        fileType: file.type,
        url: URL.createObjectURL(file) // This is just for demo, would be a server URL in production
      }));
      
      // Process any @mentions to extract user IDs
      const mentionedUserIds = [];
      const mentionRegex = /@([a-zA-Z]+ [a-zA-Z]+)/g;
      const matches = comment.match(mentionRegex) || [];
      
      matches.forEach(match => {
        const name = match.substring(1).trim();
        const user = teamMembers.find(
          (u:any) => `${u.firstName} ${u.lastName}`.toLowerCase() === name.toLowerCase()
        );
        if (user) mentionedUserIds.push(user._id);
      });
      
      // Create the payload with the correct structure
      const payload = {
        action: 'create',
        data: {
          ticket: ticketId,
          user: userId,
          content: comment,
          addedBy: userId,
          updatedBy: userId
          // In a real implementation, we'd include:
          // attachments: mockAttachments,
          // replyTo: replyingTo?._id,
          // mentions: mentionedUserIds
        }
      };
      
      console.log("Submitting comment with payload:", JSON.stringify(payload, null, 2));
      
      // Call the createComment mutation with the payload
      const response = await createComment(payload).unwrap();
      console.log("Comment creation response:", response);
      
      setComment('');
      setSelectedFiles([]);
      setReplyingTo(null);
      toast.success('Comment added successfully');
    } catch (error:any) {
      console.error("Comment creation error:", error);
      const errorMessage = error.data?.message || 'Failed to add comment';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Group comments into threads
  const getCommentThreads = () => {
    const threads: { [key: string]: Comment[] } = {};
    const topLevelComments: Comment[] = [];
    
    // Group replies by parent comment
    comments.forEach(comment => {
      if (comment.replyTo) {
        if (!threads[comment.replyTo]) {
          threads[comment.replyTo] = [];
        }
        threads[comment.replyTo].push(comment);
      } else {
        topLevelComments.push(comment);
      }
    });
    
    return { topLevelComments, threads };
  };
  
  const { topLevelComments, threads } = getCommentThreads();
  
  // Format content to highlight mentions
  const formatCommentContent = (content: string) => {
    const parts = [];
    const mentionRegex = /@([a-zA-Z]+ [a-zA-Z]+)/g;
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
      }
      
      const mentionName = match[1];
      parts.push(
        <Badge variant="secondary" className="font-normal" key={`mention-${match.index}`}>
          @{mentionName}
        </Badge>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
    }
    
    return parts;
  };
  
  // Render a comment with its attachments
  const renderComment = (comment: any, isReply = false) => (
    <div 
      key={comment._id} 
      className={`flex gap-3 ${isReply ? 'ml-12 mt-2' : 'mt-4'}`}
      id={`comment-${comment._id}`}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback>
          {`${comment.user.firstName[0]}${comment.user.lastName[0]}`}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className={`${isReply ? 'bg-gray-50' : 'bg-white'} p-3 rounded-lg border`}>
          <div className="flex justify-between items-start mb-1">
            <div className="font-medium">
              {`${comment.user.firstName} ${comment.user.lastName}`}
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          {comment.replyTo && (
            <div className="flex flex-col text-xs bg-gray-50 p-2 rounded-md border-l-2 border-blue-300 mb-2">
              <div className="text-blue-600 font-medium flex items-center mb-1">
                <CornerUpRight className="h-3 w-3 mr-1" />
                Replying to {comment.replyToUser?.firstName || "User"} {comment.replyToUser?.lastName || ""}
              </div>
              <div className="text-gray-600 italic line-clamp-1">
                {comment.replyToContent || "Original comment"}
              </div>
            </div>
          )}
          
          <div className="mt-1 text-gray-700 whitespace-pre-line">
            {formatCommentContent(comment.content)}
          </div>
          
          {comment.attachments && comment.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {comment.attachments.map((attachment:any, index:any) => (
                <div 
                  key={index}
                  className="flex flex-col items-center border rounded-md p-1 bg-gray-50 w-16"
                >
                  {attachment.fileType.startsWith('image/') ? (
                    <div className="w-full h-12 relative overflow-hidden rounded-md">
                      <Image className="h-4 w-4 absolute top-1 right-1 bg-white rounded-full p-1" />
                      <img src={attachment.url} alt={attachment.fileName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <File className="h-8 w-8 my-2 text-gray-400" />
                  )}
                  <span className="text-xs max-w-[60px] truncate">{attachment.fileName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-1 ml-1">
          <button 
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
            onClick={() => handleReply(comment)}
          >
            <Reply className="h-3 w-3 mr-1" />
            Reply
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <Card>
      <CardContent className="p-4">
        <DashboardLoader loading={isLoading}>
          <div className="space-y-2">
            {/* Comment input */}
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback>
                  {currentUserName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                {replyingTo && (
                  <div className="flex flex-col text-sm bg-gray-50 p-3 rounded-md border-l-4 border-blue-400">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-blue-700 flex items-center">
                        <CornerUpRight className="h-4 w-4 mr-1" />
                        Replying to {replyingTo.user.firstName} {replyingTo.user.lastName}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={cancelReply}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-gray-700 line-clamp-2 italic pl-2 border-l-2 border-gray-300">
                      {replyingTo.content}
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <Textarea
                    placeholder="Add a comment or @mention someone..."
                    value={comment}
                    onChange={handleCommentInput}
                    className="resize-none"
                    rows={3}
                    ref={textareaRef}
                  />
                  
                  {showMentionsPopover && (
                    <div className="absolute z-10 bg-white border shadow-lg rounded-md w-full max-h-48 overflow-y-auto mt-1">
                      <Command>
                        <CommandInput placeholder="Search team members..." />
                        <CommandList>
                          {filteredTeamMembers.length > 0 ? (
                            filteredTeamMembers.map((user:any) => (
                              <CommandItem
                                key={user._id}
                                onSelect={() => insertMention(user)}
                                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>{`${user.firstName[0]}${user.lastName[0]}`}</AvatarFallback>
                                </Avatar>
                                <span>{user.firstName} {user.lastName}</span>
                              </CommandItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-gray-500">No matches found</div>
                          )}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-2 bg-gray-50 rounded-md border">
                    <div className="w-full text-sm font-medium text-gray-700 mb-1">File Attachments:</div>
                    {selectedFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex flex-col items-center border rounded-md p-2 bg-white"
                      >
                        {file.type.startsWith('image/') ? (
                          <div className="relative w-24 h-24 mb-1 overflow-hidden rounded-md bg-gray-100">
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={file.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-24 h-24 mb-1 bg-gray-100 rounded-md">
                            <File className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                        <div className="flex items-center gap-1 w-full justify-between">
                          <span className="text-xs max-w-[80px] truncate">{file.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <Paperclip className="h-4 w-4 mr-1" />
                      Attach
                    </Button>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <AtSign className="h-4 w-4 mr-1" />
                          Mention
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0">
                        <Command>
                          <CommandInput placeholder="Search team members..." />
                          <CommandList>
                            {teamMembers.map((user:any) => (
                              <CommandItem
                                key={user._id}
                                onSelect={() => {
                                  setComment(prev => `${prev} @${user.firstName} ${user.lastName} `);
                                  if (textareaRef.current) {
                                    setTimeout(() => textareaRef.current?.focus(), 0);
                                  }
                                }}
                              >
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback>{`${user.firstName[0]}${user.lastName[0]}`}</AvatarFallback>
                                </Avatar>
                                {user.firstName} {user.lastName}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button 
                    onClick={handleSubmit}
                    disabled={(!comment.trim() && selectedFiles.length === 0) || isSubmitting}
                    size="sm"
                  >
                    {isSubmitting ? 'Sending...' : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Comment thread list */}
            {comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="space-y-3 mt-6">
                {topLevelComments.map(comment => (
                  <div key={comment._id}>
                    {renderComment(comment)}
                    
                    {/* Render replies if any */}
                    {threads[comment._id]?.map(reply => (
                      renderComment(reply, true)
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardLoader>
      </CardContent>
    </Card>
  );
};

export default TicketCommentComponent;