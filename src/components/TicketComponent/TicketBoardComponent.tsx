// src/components/TicketComponent/TicketBoardComponent.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateTicketMutation, useAssignTicketMutation } from '@/services/endpoints/ticketApi';
import { SortableTicketItem } from './SortableTicketItem';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import TicketComponent from './TicketComponent';


// Define column types with proper typing
interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  department: {
    _id: string;
    name: string;
  };
  category: {
    _id: string;
    name: string;
  };
  creator: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  assignee?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  efforts: number;
  totalEfforts: number;
}

interface Column {
  id: string;
  title: string;
  status: string;
  tickets: Ticket[];
  color?: string;
  icon?: string;
}

interface TicketBoardComponentProps {
  tickets: Ticket[];
  onTicketClick: (ticketId: string) => void;
  userId: string;
}

// Droppable container component with enhanced visuals
const DroppableColumn = ({ id, children, title, count, color = 'gray' }:any) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id
  });

  // Map color names to tailwind classes (more refined)
  const colorMap:any = {
    gray: { bg: 'bg-secondary/20', border: 'border-secondary/30', text: 'text-secondary-foreground', hover: 'bg-secondary/30' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', hover: 'bg-blue-100/50' },
    green: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', hover: 'bg-emerald-100/50' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', hover: 'bg-amber-100/50' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', hover: 'bg-purple-100/50' },
    red: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary-foreground', hover: 'bg-primary/20' }
  };

  const colors:any = colorMap[color] || colorMap.gray;

  return (
    <div className="flex flex-col h-full w-[270px] transition-all duration-200 rounded-lg shadow-card">
      <div className={`flex items-center justify-between p-3 ${colors.bg} rounded-t-lg border-t border-l border-r ${colors.border}`}>
        <h3 className={`font-medium ${colors.text} flex items-center`}>
          {title}
          <span className={`ml-2 text-xs font-medium bg-white/80 ${colors.text} rounded-full px-2.5 py-1 shadow-sm`}>
            {count}
          </span>
        </h3>
      </div>
      <div 
        ref={setNodeRef}
        className={`space-y-3 min-h-[500px] p-3 rounded-b-lg transition-all duration-200
                    flex-1 overflow-auto border ${colors.border} bg-white
                    ${isOver ? `${colors.hover} border-dashed` : ''}`}
        style={{ 
          transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {children}
      </div>
    </div>
  );
};

const TicketBoardComponent: React.FC<TicketBoardComponentProps> = ({ 
  tickets, 
  onTicketClick,
  userId
}) => {
  const router = useRouter();
  const [columns, setColumns] = useState<{ [key: string]: Column }>({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [updateTicket] = useUpdateTicketMutation();
  const [assignTicket] = useAssignTicketMutation();
  const [dragStartClientOffset, setDragStartClientOffset] = useState({ x: 0, y: 0 });
  
  // Assignment dialog state
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [ticketToAssign, setTicketToAssign] = useState<Ticket | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Set up sensors for drag and drop with custom offset measurement
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Slightly reduced to make dragging more responsive
      }
    }),
    useSensor(KeyboardSensor)
  );

  // Fetch users for assignment dialog
  const { data: usersData = {data:[]}, isLoading: usersLoading } = useGetMasterQuery({
    db: 'USER_MASTER',
    filter: ticketToAssign ? { department: ticketToAssign.department._id, isActive: true } : {},
    sort: { firstName: 1 }
  }, { skip: !ticketToAssign });

  // Store the previous tickets ref to avoid unnecessary re-renders
  const prevTicketsRef:any = useRef(null);
  
  // Initialize columns with tickets and added visual indicators
  useEffect(() => {
    // Skip re-processing if no change in tickets data
    if (prevTicketsRef.current && 
        JSON.stringify(prevTicketsRef.current) === JSON.stringify(tickets)) {
      return;
    }
    
    // Update the ref
    prevTicketsRef.current = tickets;
    
    const initialColumns: { [key: string]: Column } = {
      new: {
        id: 'new',
        title: 'New',
        status: 'NEW',
        tickets: [],
        color: 'blue'
      },
      inProgress: {
        id: 'inProgress',
        title: 'In Progress',
        status: 'IN_PROGRESS',
        tickets: [],
        color: 'amber'
      },
      resolved: {
        id: 'resolved',
        title: 'Resolved',
        status: 'RESOLVED',
        tickets: [],
        color: 'green'
      },
      closed: {
        id: 'closed',
        title: 'Closed',
        status: 'CLOSED',
        tickets: [],
        color: 'purple'
      }
    };

    // Distribute tickets to columns based on status
    tickets.forEach(ticket => {
      switch (ticket.status.toUpperCase()) {
        case 'NEW':
          initialColumns.new.tickets.push(ticket);
          break;
        case 'ASSIGNED':
          initialColumns.assigned?.tickets.push(ticket);
          break;
        case 'IN_PROGRESS':
          initialColumns.inProgress.tickets.push(ticket);
          break;
        case 'RESOLVED':
          initialColumns.resolved.tickets.push(ticket);
          break;
        case 'CLOSED':
          initialColumns.closed.tickets.push(ticket);
          break;
        default:
          initialColumns.new.tickets.push(ticket);
      }
    });

    setColumns(initialColumns);
  }, [tickets]);

  // Find which column a ticket is in
  const findColumnOfTicket = (ticketId: string): { columnId: string, ticketIndex: number } | null => {
    for (const [columnId, column] of Object.entries(columns)) {
      const ticketIndex = column.tickets.findIndex(t => t._id === ticketId);
      if (ticketIndex !== -1) {
        return { columnId, ticketIndex };
      }
    }
    return null;
  };

  // Handle start of drag to track which ticket is being dragged
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticketId = active.id as string;
    
    // Capture the initial client offset for more accurate positioning
    if (event.activatorEvent && 'clientY' in event.activatorEvent) {
      setDragStartClientOffset({
        x: (event.activatorEvent as MouseEvent).clientX,
        y: (event.activatorEvent as MouseEvent).clientY
      });
    }
    
    setActiveDragId(ticketId);
    
    // Find the ticket being dragged
    const source = findColumnOfTicket(ticketId);
    if (source) {
      const { columnId, ticketIndex } = source;
      setActiveTicket(columns[columnId].tickets[ticketIndex]);
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      console.log("Updating ticket status:", { ticketId, newStatus, userId });
      
      const response = await updateTicket({
        action: 'update',
        data: {
          _id: ticketId,
          status: newStatus,
          updatedBy: userId
        }
      }).unwrap();
      
      console.log("Update ticket response:", response);
      
      // Check for both SUCCESS and Success (case insensitive)
      if (response && (response.status === 'SUCCESS' || response.status === 'Success')) {
        toast.success(`Ticket status updated to ${newStatus}`);
        return true;
      } else {
        toast.error(`Failed to update status: ${response?.message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error('Failed to update ticket status');
      return false;
    }
  };

  // Handle ticket assignment
  const handleAssignTicket = async () => {
    if (!selectedAssignee || !ticketToAssign) return;
    setIsAssigning(true);
    
    try {
      await assignTicket({
        ticketId: ticketToAssign._id,
        assigneeId: selectedAssignee,
        updatedBy: userId
      }).unwrap();
      
      // Close the dialog
      setIsAssignDialogOpen(false);
      
      // If we have a pending status change, continue with it
      if (pendingStatusChange) {
        await updateTicketStatus(ticketToAssign._id, pendingStatusChange);
      }
      
      toast.success('Ticket assigned successfully');
      
      // Reset state
      setTicketToAssign(null);
      setSelectedAssignee('');
      setPendingStatusChange(null);
      setIsAssigning(false);
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error('Failed to assign ticket');
    }
  };

  // Handle drag end with improved animation
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over) {
      setActiveDragId(null);
      setActiveTicket(null);
      return;
    }
    
    // Extract IDs
    const ticketId = active.id as string;
    const overId = over.id as string;
    
    // Make sure we only process drops on columns
    if (!columns[overId]) {
      setActiveDragId(null);
      setActiveTicket(null);
      return;
    }
    
    const destinationColumnId = overId;
    
    // Find source column and ticket
    const source = findColumnOfTicket(ticketId);
    if (!source) {
      setActiveDragId(null);
      setActiveTicket(null);
      return;
    }
    
    const { columnId: sourceColumnId, ticketIndex } = source;
    
    // If dropped in the same column, just clean up
    if (sourceColumnId === destinationColumnId) {
      setActiveDragId(null);
      setActiveTicket(null);
      return;
    }
    
    // Get the ticket being moved
    const ticket = columns[sourceColumnId].tickets[ticketIndex];
    const newStatus = columns[destinationColumnId].status;
    
    // Special case for assigning a ticket
    if (destinationColumnId === 'assigned' && (!ticket?.assignee || sourceColumnId === 'new')) {
      setTicketToAssign(ticket);
      setPendingStatusChange(newStatus);
      setIsAssignDialogOpen(true);
      setActiveDragId(null);
      setActiveTicket(null);
      return;
    }

    // Create deep copies of the state
    const newColumns = JSON.parse(JSON.stringify(columns));
    
    // Remove from source column immediately to prevent the snap-back effect
    newColumns[sourceColumnId].tickets = newColumns[sourceColumnId].tickets.filter((t:any) => t._id !== ticketId);
    
    // Update ticket status
    const updatedTicket = { ...ticket, status: newStatus };
    
    // Add to destination column immediately
    newColumns[destinationColumnId].tickets.push(updatedTicket);
    
    // First, update local state immediately
    setColumns(newColumns);
    
    // Close the drag operation
    setActiveDragId(null);
    setActiveTicket(null);
    
    try {
      // Update the backend
      await updateTicketStatus(ticket._id, newStatus);
      
      // Add a class to the moved ticket to highlight it briefly
      setTimeout(() => {
        const ticketElement = document.querySelector(`[data-ticket-id="${ticket._id}"]`);
        if (ticketElement) {
          ticketElement.classList.add('animate-highlight');
          
          // Remove the highlight class after animation completes
          setTimeout(() => {
            ticketElement.classList.remove('animate-highlight');
          }, 1000);
        }
      }, 100);
      
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Failed to update ticket status");
      
      // If the backend update fails, revert the visual change
      const revertColumns = JSON.parse(JSON.stringify(columns));
      revertColumns[sourceColumnId].tickets.push(ticket);
      revertColumns[destinationColumnId].tickets = revertColumns[destinationColumnId].tickets.filter(
        (t:any) => t._id !== ticket._id
      );
      setColumns(revertColumns);
    }
  };
  
  // Handle navigating to ticket details
  const handleTicketClick = (ticketId: string) => {
    if (activeDragId) return; // Don't navigate during drag operations
    router.push(`/dashboard/ticket/${ticketId}`);
  };

  const updateColumnsState = (newColumns:any) => {
    // Update state immediately instead of using requestAnimationFrame
    // This helps prevent the snap-back effect
    setColumns(newColumns);
  };
  
  // Empty state component for cleaner code
  const EmptyColumnState = ({ columnColor = 'gray' }) => {
    const colorMap:any = {
      gray: { bg: 'bg-secondary/10', text: 'text-secondary-foreground/40', border: 'border-secondary/20' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-500/70', border: 'border-blue-100' },
      green: { bg: 'bg-emerald-50', text: 'text-emerald-500/70', border: 'border-emerald-100' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-500/70', border: 'border-amber-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-500/70', border: 'border-purple-100' },
      red: { bg: 'bg-primary/5', text: 'text-primary/40', border: 'border-primary/10' }
    };
    
    const colors = colorMap[columnColor] || colorMap.gray;
    
    return (
      <div className={`flex flex-col items-center justify-center h-40 border border-dashed ${colors.border} rounded-lg ${colors.bg} transition-all duration-200 animate-fade-in`}>
        <svg className={`w-8 h-8 ${colors.text} mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className={`text-sm font-medium ${colors.text}`}>No tickets</p>
        <p className={`text-xs ${colors.text} mt-1`}>Drag tickets here</p>
      </div>
    );
  };

  // Main component with redesigned styling
  return (
    <>
      <div className="w-full max-w-[83vw] overflow-x-scroll bg-background/50 rounded-xl p-4">
        <div className="w-full overflow-x-auto pb-6 pt-2 snap-x hide-scrollbar">
          <div className="flex gap-6 px-1">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {Object.entries(columns).map(([columnId, column]) => (
                <div key={columnId} className="snap-start animate-fade-in flex-shrink-0">
                  <DroppableColumn 
                    id={columnId} 
                    title={column.title} 
                    count={column.tickets.length}
                    color={column.color}
                  >
                    <SortableContext 
                      items={column.tickets.map(t => t._id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      {column.tickets.map(ticket => (
                        <SortableTicketItem 
                          key={ticket._id}
                          id={ticket._id}
                          ticket={ticket}
                          onTicketClick={handleTicketClick}
                        />
                      ))}
                    </SortableContext>
                    
                    {/* Empty state for columns with no tickets */}
                    {column.tickets.length === 0 && (
                      <EmptyColumnState columnColor={column.color} />
                    )}
                  </DroppableColumn>
                </div>
              ))}
              
              {/* Drag overlay with enhanced styling */}
              <DragOverlay 
                className="dnd-overlay"
                dropAnimation={{
                  duration: 300,
                  easing: 'cubic-bezier(0.2, 0, 0.2, 1)',
                  keyframes: ({ active, dragOverlay }) => {
                    return [
                      { opacity: 0, transform: 'scale(1.05)' },
                      { opacity: 0, transform: 'scale(1.05)' },
                      { opacity: 0, transform: 'scale(1.05)' },
                    ];
                  }
                }}
                adjustScale={false}
                modifiers={[]}
                zIndex={1000}
              >
                {activeTicket ? (
                  <div className="w-[270px] shadow-lg animated-ticket cursor-grabbing">
                    <TicketComponent
                      ticket={activeTicket}
                      compactView={true}
                      className="border-2 border-primary/20"
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
      
      {/* Redesigned Assign Ticket Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-lg border shadow-md bg-white">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-semibold text-primary">
              {ticketToAssign?.assignee ? 'Reassign Ticket' : 'Assign Ticket'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Select a team member to assign this ticket to
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Assignee</Label>
              <Select onValueChange={setSelectedAssignee} value={selectedAssignee}>
                <SelectTrigger className="w-full border border-input rounded-md h-10 focus-ring">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent className="rounded-md border-border">
                  {usersData?.data?.map((user:any) => (
                    <SelectItem key={user._id} value={user._id} className="cursor-pointer py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary w-7 h-7 rounded-full flex items-center justify-center text-xs ring-2 ring-white">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <span>{`${user.firstName} ${user.lastName}`}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="border-t pt-3">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} className="rounded-md border h-10">
              Cancel
            </Button>
            <Button 
              onClick={handleAssignTicket}
              disabled={!selectedAssignee || isAssigning}
              className="rounded-md bg-primary hover:bg-primary/90 h-10 text-white"
            >
              {isAssigning ? 'Assigning...' : 'Assign Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* CSS for animations */}
      <style jsx global>{`
        .animated-ticket {
          transform: scale(1);
          transition: all 0.2s ease-out;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .dnd-overlay .animated-ticket {
          transform: scale(1.03);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .snap-x {
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        
        .snap-start {
          scroll-snap-align: start;
        }
        
        /* Enhanced scrollbars with your design system colors */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 8px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #d55959;
          border-radius: 8px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #c94a4a;
        }
        
        /* Animation to highlight a ticket after it's moved */
        @keyframes highlightTicket {
          0% { 
            box-shadow: 0 0 0 2px #d55959; 
            transform: translateY(-2px);
          }
          70% { 
            box-shadow: 0 0 0 2px #d55959; 
            transform: translateY(-2px);
          }
          100% { 
            box-shadow: none; 
            transform: translateY(0);
          }
        }
        
        .animate-highlight {
          animation: highlightTicket 1s ease-out forwards;
        }
        
        /* Cursor styles for dragging */
        [data-draggable=true] {
          cursor: grab;
        }
        
        [data-draggable=true]:active {
          cursor: grabbing;
        }
        
        /* Fix the drag overlay positioning */
        .dnd-overlay {
          cursor: grabbing !important;
          pointer-events: none !important;
          transform-origin: 0 0 !important;
          margin-top: -120px !important; /* Bring the overlay much closer to cursor */
          margin-left: -140px !important; /* Center horizontally */
          z-index: 9999 !important;
        }
      `}</style>
    </>
  );
};

export default TicketBoardComponent;