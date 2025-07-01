// src/components/TicketComponent/TicketChatSystem.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCreateTicketCommentMutation } from '@/services/endpoints/ticketCommentApi';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'react-toastify';
import DashboardLoader from '@/components/ui/DashboardLoader';
import { 
  Paperclip, Send, File, Image, X, AtSign, Reply, CornerUpRight, 
  PlusCircle, UserPlus, Smile, Loader2, MessageSquare, Download, Video
} from 'lucide-react';
import { 

  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Command, CommandInput, CommandItem, CommandList, CommandGroup } from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  department?: any;
}

interface Attachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: Date;
}

interface ChatMessage {
  _id: string;
  ticket: string;
  user: User;
  content: string;
  attachments?: Attachment[];
  replyTo?: string;
  replyToUser?: User;
  replyToContent?: string;
  mentions?: string[];
  createdAt: string;
  isRead?: boolean;
}

interface TicketChatSystemProps {
  ticketId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  userId: string;
  currentUser: User;
}

// Helper to format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

const TicketChatSystem: React.FC<TicketChatSystemProps> = ({
  ticketId,
  messages = [],
  isLoading,
  userId,
  currentUser
}) => {
  // State
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionsPopover, setShowMentionsPopover] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'participants'>('chat');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // RTK Queries and Mutations
  const [createMessage] = useCreateTicketCommentMutation();
  
  // Fetch all team members for mentions and invites
  const { data: teamMembersData = {data:[]}} = useGetMasterQuery({
    db: 'USER_MASTER',
    filter: { isActive: true },
    sort: { firstName: 1 }
  });
  
  const teamMembers = teamMembersData?.data || [];
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
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
  const handleMessageInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
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
  
  // Insert mention into message
  const insertMention = (user: User) => {
    if (mentionStartIndex === -1) return;
    
    const beforeMention = message.substring(0, mentionStartIndex);
    const afterMention = message.substring(mentionStartIndex + mentionQuery.length + 1);
    const mentionText = `@${user.firstName} ${user.lastName} `;
    
    setMessage(beforeMention + mentionText + afterMention);
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
  
  // Handle reply to a message
  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };
  
  // Handle inviting users
  const handleInviteUsers = () => {
    // This would typically make an API call to invite the users
    toast.success(`Invited ${selectedUsers.length} user(s) to the conversation`);
    setInviteDialogOpen(false);
    setSelectedUsers([]);
  };
  
  // Toggle user selection for invites
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };
  
  // Handle message submission
  const handleSubmit = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Process file uploads (mock for now)
      const mockAttachments = selectedFiles.map(file => ({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: URL.createObjectURL(file), // In production, this would be a server URL
        uploadedAt: new Date()
      }));
      
      // Process any @mentions to extract user IDs
      const mentionedUserIds = [];
      const mentionRegex = /@([a-zA-Z]+ [a-zA-Z]+)/g;
      const matches = message.match(mentionRegex) || [];
      
      matches.forEach(match => {
        const name = match.substring(1).trim();
        const user = teamMembers.find(
          (u:any) => `${u.firstName} ${u.lastName}`.toLowerCase() === name.toLowerCase()
        );
        if (user) mentionedUserIds.push(user._id);
      });
      
      // Prepare message payload
      const messageData = {
        ticket: ticketId,
        user: userId,
        content: message,
        addedBy: userId,
        updatedBy: userId,
        ...(replyingTo && { replyTo: replyingTo._id })
        // In a real implementation, we'd include:
        // attachments: uploadedAttachments,
        // mentions: mentionedUserIds
      };
      
      console.log("Sending message with data:", JSON.stringify({
        action: 'create',
        data: messageData
      }, null, 2));
      
      const response = await createMessage({
        action: 'create',
        data: messageData
      }).unwrap();
      
      setMessage('');
      setSelectedFiles([]);
      setReplyingTo(null);
      
      // Scroll to bottom
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error:any) {
      console.error("Message sending error:", error);
      const errorMessage = error?.data?.message || 'Failed to send message';
      toast.error(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: ChatMessage[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toISOString().split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  };
  
  const messageGroups = groupMessagesByDate();
  
  // Format content to highlight mentions
  const formatMessageContent = (content: string) => {
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
  
  // Extract all file attachments for the files tab
  const allFiles = messages
    .filter(msg => msg.attachments && msg.attachments.length > 0)
    .flatMap(msg => (msg.attachments ?? []).map(att => ({
      ...att,
      uploadedBy: msg.user,
      messageId: msg._id,
      uploadedAt: msg.createdAt
    })));
  
  // Extract all participants
  const participants = Array.from(new Set(
    messages.map(msg => msg.user._id)
  )).map(userId => {
    const user = messages.find(msg => msg.user._id === userId)?.user;
    return user;
  }).filter(Boolean);
  
  // Get icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else if (fileType.startsWith('video/')) {
      return <Video className="h-4 w-4" />;
    } else if (fileType.includes('pdf')) {
      return <File className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <File className="h-4 w-4 text-blue-500" />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <File className="h-4 w-4 text-green-500" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="overflow-hidden  flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Ticket Chat
          </CardTitle>
          
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setInviteDialogOpen(true)}
              className="mr-2"
            >
              <UserPlus className="mr-1 h-4 w-4" />
              Invite
            </Button>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="h-9">
                <TabsTrigger value="chat" className="text-xs px-3">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs px-3">
                  Files {allFiles.length > 0 && `(${allFiles.length})`}
                </TabsTrigger>
                <TabsTrigger value="participants" className="text-xs px-3">
                  Team {participants.length > 0 && `(${participants.length})`}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        <DashboardLoader loading={isLoading}>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as any)}
            className="flex-1 flex flex-col"
          >
            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0 data-[state=active]:flex-1">
              {/* Message area */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation by sending a message.</p>
                  </div>
                ) : (
                  <div>
                    {messageGroups.map(group => (
                      <div key={group.date}>
                        <div className="flex justify-center my-4">
                          <Badge variant="outline" className="bg-gray-50">
                            {format(new Date(group.date), 'EEEE, MMMM d, yyyy')}
                          </Badge>
                        </div>
                        
                        {group.messages.map((message, index) => (
                          <div key={`${message._id}-${index}`} className="mb-4" id={`message-${message._id}`}>
                            <div className={cn(
                              "flex gap-3",
                              message.user._id === userId ? "flex-row-reverse" : ""
                            )}>
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                {message.user.avatar ? (
                                  <AvatarImage src={message.user.avatar} />
                                ) : (
                                  <AvatarFallback>
                                    {`${message.user.firstName[0]}${message.user.lastName[0]}`}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              
                              <div className={cn(
                                "max-w-[80%]",
                                message.user._id === userId ? "items-end" : ""
                              )}>
                                <div className={cn(
                                  "rounded-lg px-4 py-2",
                                  message.user._id === userId 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-gray-100 text-gray-800"
                                )}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className={cn(
                                      "font-medium text-xs",
                                      message.user._id === userId ? "text-blue-100" : "text-gray-600"
                                    )}>
                                      {message.user._id === userId ? 'You' : `${message.user.firstName} ${message.user.lastName}`}
                                    </span>
                                    <span className={cn(
                                      "text-xs",
                                      message.user._id === userId ? "text-blue-100" : "text-gray-500"
                                    )}>
                                      {format(new Date(message.createdAt), 'h:mm a')}
                                    </span>
                                  </div>
                                  
                                  {message.replyTo && (
                                    <div className={cn(
                                      "text-xs p-2 rounded mb-2 flex flex-col gap-1",
                                      message.user._id === userId 
                                        ? "bg-blue-600 border-l-2 border-blue-300" 
                                        : "bg-gray-200 border-l-2 border-gray-400"
                                    )}>
                                      <span className={cn(
                                        "font-medium flex items-center gap-1",
                                        message.user._id === userId ? "text-blue-100" : "text-gray-700"
                                      )}>
                                        <CornerUpRight className="h-3 w-3" />
                                        Replying to {message.replyToUser?.firstName || "User"}
                                      </span>
                                      <span className={cn(
                                        "italic line-clamp-1",
                                        message.user._id === userId ? "text-blue-100" : "text-gray-600"
                                      )}>
                                        {message.replyToContent || "Original message"}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className={cn(
                                    "whitespace-pre-line break-words",
                                    message.user._id === userId ? "text-white" : "text-gray-800"
                                  )}>
                                    {formatMessageContent(message.content)}
                                  </div>
                                </div>
                                
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {message.attachments.map((attachment, index) => (
                                      <div key={index} className={cn(
                                        "rounded-lg overflow-hidden",
                                        message.user._id === userId ? "ml-auto" : ""
                                      )}>
                                        {attachment.fileType.startsWith('image/') ? (
                                          <div className="relative group">
                                            <img 
                                              src={attachment.url} 
                                              alt={attachment.fileName}
                                              className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                              <Button size="icon" variant="secondary" asChild>
                                                <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                                                  <Download className="h-4 w-4" />
                                                </a>
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg",
                                            message.user._id === userId ? "bg-blue-100" : "bg-gray-200"
                                          )}>
                                            {getFileIcon(attachment.fileType)}
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-medium truncate max-w-[150px]">
                                                {attachment.fileName}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                {formatFileSize(attachment.fileSize)}
                                              </div>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                              <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                                                <Download className="h-3 w-3" />
                                              </a>
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className={cn(
                                  "flex mt-1 text-xs text-gray-500 gap-2",
                                  message.user._id === userId ? "justify-end" : ""
                                )}>
                                  <button 
                                    className="hover:text-gray-700"
                                    onClick={() => handleReply(message)}
                                  >
                                    Reply
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              
              {/* Message input area */}
              <div className="p-4 border-t">
                {replyingTo && (
                  <div className="flex flex-col text-sm bg-gray-50 p-3 mb-2 rounded-md border-l-4 border-blue-400">
                    <div className="flex justify-between items-center mb-1">
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
                    placeholder="Type a message..."
                    value={message}
                    onChange={handleMessageInput}
                    className="resize-none pr-24"
                    rows={3}
                    ref={textareaRef}
                  />
                  
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                      className="h-8 w-8"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      onClick={handleSubmit}
                      disabled={(!message.trim() && selectedFiles.length === 0) || isSubmitting}
                      size="sm" 
                      className="h-8"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
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
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-2 bg-gray-50 rounded-md border">
                    <div className="w-full text-sm font-medium text-gray-700 mb-1">
                      Attachments ({selectedFiles.length})
                    </div>
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
                            {getFileIcon(file.type)}
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
              </div>
            </TabsContent>
            
            {/* Files Tab */}
            <TabsContent value="files" className="flex-1 m-0 p-4 data-[state=active]:flex-1 overflow-auto">
              <h3 className="text-lg font-medium mb-4">Files & Attachments</h3>
              
              {allFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <File className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No files have been shared in this conversation yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allFiles.map((file, idx) => (
                    <div key={idx} className="border rounded-md p-3 hover:bg-gray-50 transition-colors flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {getFileIcon(file.fileType)}
                          <span className="text-sm font-medium ml-1 truncate max-w-[150px]">{file.fileName}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                          <a href={file.url} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                      
                      {file.fileType.startsWith('image/') && (
                        <div className="h-32 overflow-hidden rounded-md mb-2 bg-gray-50 flex items-center justify-center">
                          <img src={file.url} alt={file.fileName} className="max-h-full object-contain" />
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-auto">
                        <span>
                          {formatFileSize(file.fileSize)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">
                              {`${file.uploadedBy.firstName[0]}${file.uploadedBy.lastName[0]}`}
                            </AvatarFallback>
                          </Avatar>
                          {format(new Date(file.uploadedAt), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Participants Tab */}
            <TabsContent value="participants" className="flex-1 m-0 p-4 data-[state=active]:flex-1 overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Team Members</h3>
                <Button variant="outline" size="sm" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite Others
                </Button>
              </div>
              
              {participants.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No participants yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((user) => (
                    <div key={user?._id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {user?.avatar ? (
                            <AvatarImage src={user.avatar} />
                          ) : (
                            <AvatarFallback>{`${user?.firstName[0]}${user?.lastName[0]}`}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">{`${user?.firstName} ${user?.lastName}`}</div>
                          <div className="text-sm text-gray-500">
                            {user?.department?.name || 'Team Member'}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        user?._id === userId ? 'bg-blue-50 text-blue-700' : 'bg-gray-50'
                      }>
                        {user?._id === userId ? 'You' : 'Team Member'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DashboardLoader>
      </CardContent>
      
      {/* Invite Users Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>
              Add team members to this ticket conversation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input 
              placeholder="Search for team members..."
              className="mb-4"
            />
            
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {teamMembers
                .filter((user:any) => !participants.some((p:any) => p._id === user._id)) // Only show users not already in the conversation
                .map((user:any) => (
                  <div 
                    key={user?._id} 
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md cursor-pointer",
                      selectedUsers.includes(user?._id) 
                        ? "bg-blue-50 border border-blue-200" 
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                    onClick={() => toggleUserSelection(user._id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} />
                        ) : (
                          <AvatarFallback>{`${user.firstName[0]}${user.lastName[0]}`}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">{`${user.firstName} ${user.lastName}`}</div>
                        <div className="text-sm text-gray-500">{user.department?.name || 'Team Member'}</div>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center",
                      selectedUsers.includes(user._id)
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300"
                    )}>
                      {selectedUsers.includes(user._id) && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteUsers}
              disabled={selectedUsers.length === 0}
            >
              Invite {selectedUsers.length > 0 && `(${selectedUsers.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// For TypeScript
const Check = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default TicketChatSystem;