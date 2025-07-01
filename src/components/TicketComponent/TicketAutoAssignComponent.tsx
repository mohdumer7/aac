// src/components/TicketComponent/TicketAutoAssignComponent.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAutoAssignTicketMutation } from '@/services/endpoints/ticketApi';
import { useGetUserSkillsQuery } from '@/services/endpoints/userSkillApi';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import { toast } from 'react-toastify';
import { AlertCircle, Loader2, Award, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TicketAutoAssignComponentProps {
  ticket: any;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TicketAutoAssignComponent: React.FC<TicketAutoAssignComponentProps> = ({
  ticket,
  userId,
  isOpen,
  onClose
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedUsers, setAnalyzedUsers] = useState<any[]>([]);
  const [autoAssignTicket, { isLoading }] = useAutoAssignTicketMutation();
  
  // Get department users
  const { data: usersData = {data:[]}, isLoading: usersLoading } = useGetMasterQuery({
    db: 'USER_MASTER',
    filter: { 
      department: ticket.department._id,
      isActive: true
    }
  }, { skip: !isOpen || !ticket?.department?._id });
  
  // Get user skills for this category
  const { data: skillsData = {data:[]}, isLoading: skillsLoading } = useGetUserSkillsQuery({
    categoryId: ticket.category._id
  }, { skip: !isOpen || !ticket?.category?._id });
  
  // Get assigned tickets for workload calculation
  const { data: assignedTicketsData = {data:[]}, isLoading: ticketsLoading } = useGetMasterQuery({
    db: 'TICKET_MASTER',
    filter: { 
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] },
      isActive: true
    }
  }, { skip: !isOpen });
  
  // Handle analysis
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      // Get users
      const users = usersData?.data || [];
      
      // Calculate score for each user
      const userScores = users.map((user:any) => {
        // Find skill rating for this category (0-5)
        const skillRating = skillsData?.data?.find((skill:any) => 
          skill.user._id.toString() === user._id.toString()
        )?.rating || 0;
        
        // Count current assigned tickets
        const workload = assignedTicketsData?.data?.filter((t:any) => 
          t.assignee?._id.toString() === user._id.toString()
        ).length || 0;
        
        // Calculate score (higher is better)
        const score = (skillRating * 2) - (workload * 0.5);
        
        return {
          user,
          skillRating,
          workload,
          score: Math.max(0, score)
        };
      });
      
      // Sort by score (highest first)
      userScores.sort((a:any, b:any) => b.score - a.score);
      
      setAnalyzedUsers(userScores);
      setIsAnalyzing(false);
    }, 1000); // Simulate analysis time
  };
  
  // Auto-assign the ticket to the best user
  const handleAutoAssign = async () => {
    if (analyzedUsers.length === 0) return;
    
    try {
      await autoAssignTicket({
        ticketId: ticket._id,
        departmentId: ticket.department._id,
        categoryId: ticket.category._id,
        updatedBy: userId
      }).unwrap();
      
      toast.success('Ticket auto-assigned successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to auto-assign ticket');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Auto-Assign Ticket</DialogTitle>
          <DialogDescription>
            Find the best assignee for this ticket based on skills and workload
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>About Auto-Assignment</AlertTitle>
            <AlertDescription>
              Auto-assignment selects the best user based on their category skills and current workload.
              Users with higher skills and lower workloads are prioritized.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Department</h4>
                <p>{ticket.department.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Category</h4>
                <p>{ticket.category.name}</p>
              </div>
            </div>
            
            {!isAnalyzing && analyzedUsers.length === 0 && (
              <div className="flex justify-center py-4">
                <Button 
                  onClick={handleAnalyze}
                  disabled={usersLoading || skillsLoading || ticketsLoading}
                >
                  {(usersLoading || skillsLoading || ticketsLoading) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Data...
                    </>
                  ) : (
                    'Analyze Team Availability'
                  )}
                </Button>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                <p className="text-lg font-medium">Analyzing team availability...</p>
                <p className="text-sm text-gray-500">Checking skills and workloads</p>
              </div>
            )}
            
            {!isAnalyzing && analyzedUsers.length > 0 && (
              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-medium">Team Analysis Results</h3>
                
                <div className="space-y-3">
                  {analyzedUsers.slice(0, 5).map((item, index) => (
                    <Card key={item.user._id} className={index === 0 ? 'border-green-200 bg-green-50' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{`${item.user.firstName[0]}${item.user.lastName[0]}`}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{`${item.user.firstName} ${item.user.lastName}`}</CardTitle>
                              <CardDescription>{item.user.designation?.name || 'Team Member'}</CardDescription>
                            </div>
                          </div>
                          {index === 0 && (
                            <Badge className="bg-green-100 text-green-800">Best Match</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                              <Award className="h-4 w-4 mr-1" /> Skill Level
                            </h4>
                            <div className="flex items-center gap-1 mt-1">
                              <Progress value={(item.skillRating / 5) * 100} className="h-2" />
                              <span className="text-xs font-medium">{item.skillRating}/5</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 flex items-center">
                              <UserCheck className="h-4 w-4 mr-1" /> Current Workload
                            </h4>
                            <div className="flex items-center gap-1 mt-1">
                              <Progress 
                                value={Math.min((item.workload / 5) * 100, 100)} 
                                className="h-2" 
                              />
                              <span className="text-xs font-medium">{item.workload} tickets</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          {!isAnalyzing && analyzedUsers.length > 0 && (
            <Button 
              onClick={handleAutoAssign}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Auto-Assign to Best Match'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketAutoAssignComponent;