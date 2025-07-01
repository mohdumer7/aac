// src/app/dashboard/ticket/[id]/page.tsx
"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetTicketsQuery, useUpdateTicketMutation } from '@/services/endpoints/ticketApi';
import { useGetTicketCommentsQuery } from '@/services/endpoints/ticketCommentApi';
import { useGetTicketTasksQuery } from '@/services/endpoints/ticketTaskApi';
import { useGetTicketHistoryQuery } from '@/services/endpoints/ticketHistoryApi';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import DashboardLoader from '@/components/ui/DashboardLoader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, CheckSquare, Clock, Edit, MoreHorizontal } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import TicketFormComponent from '@/components/TicketComponent/TicketFormComponent';
import TicketDetailComponent from '@/components/TicketComponent/TicketDetailComponent';
import { toast } from 'react-toastify';

const TicketDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user: authorisedUser, status } = useUserAuthorised();
  const user = authorisedUser && '_id' in authorisedUser ? authorisedUser as { _id: string; role?: { name?: string } } : undefined;
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch ticket data
  const { data: ticketData = { data: [] }, isLoading: ticketLoading, refetch: refetchTicket } = useGetTicketsQuery({
    id: id as string
    
  });
  
  // Fetch ticket comments, tasks, and history
  const { data: commentsData = {}, isLoading: commentsLoading } = useGetTicketCommentsQuery({ ticketId: id as string });
  const { data: tasksData = {}, isLoading: tasksLoading } = useGetTicketTasksQuery({ ticketId: id as string });
  const { data: historyData = {}, isLoading: historyLoading } = useGetTicketHistoryQuery({ ticketId: id as string });
  
  // Update ticket mutation
  const [updateTicket, { isLoading: isUpdating }] = useUpdateTicketMutation();
  
  const ticket = ticketData?.data?.[0];
  const loading = ticketLoading || status === 'loading' || isUpdating;
  
  // Handle ticket edit submission
  const handleEditSubmit = async (formData:any) => {
    try {
      await updateTicket({
        action: 'update',
        data: {
          ...formData,
          _id: id,
        }
      }).unwrap();
      
      toast.success('Ticket updated successfully');
      setIsEditDialogOpen(false);
      refetchTicket(); // Refresh ticket data
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };
  
  // Check if user can edit this ticket
  const canEdit = user && ticket && (
    (user as any)._id === ticket.creator._id || 
    (user as any)._id === ticket.assignee?._id || 
    user?.role?.name?.toUpperCase() === 'ADMIN'
  );
  
  if (loading && !ticket) {
    return (
      <DashboardLoader loading={true}>
        <div />
      </DashboardLoader>
    );
  }
  
  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-semibold mb-2">Ticket Not Found</h2>
        <p className="text-gray-500 mb-4">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button onClick={() => router.push('/dashboard/ticket')}>Return to Tickets</Button>
      </div>
    );
  }
  
  return (
    <DashboardLoader loading={loading}>
      <TooltipProvider>
        <div className="container px-4 py-6 mx-auto max-w-7xl">

          
          {/* Use TicketDetailComponent to display ticket details */}
          <TicketDetailComponent 
            ticket={ticket}
            onEditClick={() => setIsEditDialogOpen(true)}
            userId={user?._id || ''}
            userRole={user?.role?.name || ''}
          />
          
          {/* Edit Ticket Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Edit Ticket</DialogTitle>
                <DialogDescription>
                  Update the details for ticket {ticket.ticketId || `TKT-${ticket._id.toString().substr(-8)}`}
                </DialogDescription>
              </DialogHeader>
              
              <TicketFormComponent 
                onSubmit={handleEditSubmit}
                initialData={ticket}
                userId={user?._id || ''}
                isEdit={true}
              />
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </DashboardLoader>
  );
};

// Status and priority styling
const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    ASSIGNED: 'bg-indigo-100 text-indigo-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };
  return statusMap[status.toUpperCase()] || statusMap.NEW;
};

const getPriorityColor = (priority:any) => {
  const priorityMap = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-orange-100 text-orange-800',
    LOW: 'bg-green-100 text-green-800',
  };
  return priorityMap[(priority?.toUpperCase() as keyof typeof priorityMap)] || priorityMap.MEDIUM;
};

export default TicketDetailPage;