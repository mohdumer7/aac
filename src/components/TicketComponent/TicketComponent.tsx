// src/components/TicketComponent/TicketComponent.tsx
"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Clock, Tag, AlertCircle, CheckCircle2, BarChart, UserCircle2, Lock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getStatusColor, getPriorityColor } from '@/lib/getStatusColor';
import { motion } from 'framer-motion';

interface TicketComponentProps {
  ticket: {
    _id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    department: { name: string };
    category: { name: string };
    creator: { firstName: string; lastName: string };
    assignee?: { firstName: string; lastName: string };
    createdAt: Date;
    updatedAt: Date;
    commentCount?: number;
  };
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  compactView?: boolean; // For board view
}

const TicketComponent: React.FC<TicketComponentProps> = ({ 
  ticket, 
  className, 
  onClick,
  style,
  compactView = false
}:any) => {
  // Card icon based on status
  const StatusIcon = () => {
    switch(ticket.status.toUpperCase()) {
      case 'NEW': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'ASSIGNED': return <UserCircle2 className="h-4 w-4 text-indigo-500" />;
      case 'IN_PROGRESS': return <BarChart className="h-4 w-4 text-amber-500" />;
      case 'RESOLVED': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'CLOSED': return <Lock className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get formatted dates
  const createdAtFormatted = formatDistanceToNow(new Date(ticket.createdAt), {addSuffix: true});
  const updatedAtFormatted = formatDistanceToNow(new Date(ticket.updatedAt), {addSuffix: true});
  
  // Extract first letter of names safely
  const creatorInitial = ticket.creator?.firstName ? ticket.creator.firstName.charAt(0) : '?';
  const assigneeInitial = ticket.assignee?.firstName ? ticket.assignee.firstName.charAt(0) : '?';
  
  // Define a shorter ticket ID for space efficiency
  const ticketId = `TKT-${String(ticket._id).substr(-8)}`;
  
  // Define a comprehensive tooltip for the comment count
  const CommentTooltip = () => {
    if (!ticket.commentCount || ticket.commentCount === 0) {
      return <p className="text-xs">No comments yet</p>;
    }
    
    return (
      <div>
        {ticket.commentCount} comment{ticket.commentCount !== 1 ? 's' : ''}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <motion.div 
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        whileTap={{ y: 0, transition: { duration: 0.1 } }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        <Card 
          className={cn(
            "w-full border-l-4 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer bg-card group",
            ticket.status === 'NEW' ? "border-l-blue-500" :
            ticket.status === 'ASSIGNED' ? "border-l-indigo-500" :
            ticket.status === 'IN_PROGRESS' ? "border-l-amber-500" :
            ticket.status === 'RESOLVED' ? "border-l-green-500" :
            "border-l-gray-500",
            compactView ? "p-2 max-w-[270px]" : "p-3",
            className
          )}
          style={style}
          onClick={onClick}
        >
          {/* Ticket header with ID and status */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center">
              <StatusIcon />
              <Tooltip delayDuration={300}>
                <TooltipTrigger className="ml-1.5 text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors truncate max-w-[60px]">
                  {ticketId}
                </TooltipTrigger>
                <TooltipContent side="top">
                  ID: {ticketId}
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="flex gap-1 flex-shrink-0">
              {/* Make badges more compact in the board view */}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Badge className={cn(
                    "text-xs py-0 h-5 font-medium border shadow-sm badge-hover",
                    compactView ? "px-1.5 text-[10px]" : "",
                    getStatusColor(ticket.status)
                  )}>
                    {compactView ? String(ticket.status).replace(/_/g, ' ').substring(0, 3) : String(ticket.status).replace(/_/g, ' ')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Status: {String(ticket.status).replace(/_/g, ' ')}
                </TooltipContent>
              </Tooltip>
              
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Badge className={cn(
                    "text-xs py-0 h-5 font-medium border shadow-sm badge-hover", 
                    compactView ? "px-1.5 text-[10px]" : "",
                    getPriorityColor(ticket.priority)
                  )}>
                    {compactView ? String(ticket.priority).substring(0, 1) : String(ticket.priority)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Priority: {String(ticket.priority)}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {/* Title and description */}
          <div className={cn("mb-2", compactView ? "max-w-full" : "")}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <h3 className={cn(
                  "font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1",
                  compactView ? "text-xs max-w-[230px]" : "text-sm"
                )}>
                  {String(ticket.title)}
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                {String(ticket.title)}
              </TooltipContent>
            </Tooltip>
            
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <p className={cn(
                  "text-muted-foreground",
                  compactView ? "text-[10px] line-clamp-1 max-w-[230px]" : "text-xs line-clamp-2"
                )}>
                  {String(ticket.description)}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                {String(ticket.description)}
              </TooltipContent>
            </Tooltip>
          </div>
          
          {/* Footer information - more compact in board view */}
          <div className={cn(
            "grid text-muted-foreground pt-1.5 border-t border-border",
            compactView ? "grid-cols-1 gap-1 text-[10px]" : "grid-cols-2 gap-y-1.5 gap-x-2 text-xs"
          )}>
            {/* Category */}
            <div className="flex items-center gap-1 overflow-hidden">
              <Tooltip delayDuration={300}>
                <TooltipTrigger className="flex items-center gap-1 truncate">
                  <Tag size={compactView ? 10 : 12} className="flex-shrink-0" />
                  <span className={cn(
                    "truncate",
                    compactView ? "max-w-[100px]" : "max-w-[6rem]"
                  )}>
                    {String(ticket.category?.name || 'Uncategorized')}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Category: {String(ticket.category?.name || 'Uncategorized')}
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Time information */}
            <div className={cn(
              "flex items-center gap-1 overflow-hidden",
              !compactView && "justify-end"
            )}>
              <Tooltip delayDuration={300}>
                <TooltipTrigger className="flex items-center gap-1 truncate">
                  <Clock size={compactView ? 10 : 12} className="flex-shrink-0" />
                  <span className="truncate max-w-[70px]">{compactView 
                    ? createdAtFormatted.replace(' ago', '').replace('about ', '') 
                    : createdAtFormatted}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {new Date(ticket.createdAt).toLocaleString()}
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Comment count - Optional */}
            {ticket.commentCount !== undefined && (
              <div className="flex items-center gap-1">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger className="flex items-center gap-1">
                    <MessageSquare size={compactView ? 10 : 12} className="flex-shrink-0" />
                    <span>{ticket.commentCount}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {ticket.commentCount} comment{ticket.commentCount !== 1 ? 's' : ''}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            
            {/* Creator and assignee information */}
            <div className={cn(
              "flex items-center gap-1 overflow-hidden",
              compactView ? "" : "justify-end col-span-2 mt-0.5"
            )}>
              <Tooltip delayDuration={300}>
                <TooltipTrigger className="flex items-center gap-1">
                  <div className={cn(
                    "flex items-center justify-center bg-muted rounded-full text-[9px] font-medium text-muted-foreground flex-shrink-0",
                    compactView ? "w-3.5 h-3.5 text-[8px]" : "w-4 h-4"
                  )}>
                    {creatorInitial}
                  </div>
                  <span className={cn(
                    "truncate",
                    compactView ? "max-w-[40px] text-[10px]" : "max-w-[4rem] text-xs"
                  )}>
                    {String(ticket.creator?.lastName || '')}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {String(ticket.creator?.firstName || '')} {String(ticket.creator?.lastName || '')}
                </TooltipContent>
              </Tooltip>
              
              {ticket.assignee && (
                <>
                  <span className="text-border mx-0.5 flex-shrink-0">→</span>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger className="flex items-center gap-1">
                      <div className={cn(
                        "flex items-center justify-center bg-primary/10 rounded-full text-[9px] font-medium text-primary flex-shrink-0",
                        compactView ? "w-3.5 h-3.5 text-[8px]" : "w-4 h-4"
                      )}>
                        {assigneeInitial}
                      </div>
                      <span className={cn(
                        "truncate",
                        compactView ? "max-w-[40px] text-[10px]" : "max-w-[4rem] text-xs"
                      )}>
                        {String(ticket.assignee?.lastName || '')}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {String(ticket.assignee?.firstName || '')} {String(ticket.assignee?.lastName || '')}
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};

export default TicketComponent;