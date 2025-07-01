// src/components/TicketComponent/TicketAssigneesComponent.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X, UserPlus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useGetUsersQuery } from '@/services/endpoints/usersApi';
import { useUpdateTicketAssigneesMutation } from '@/services/endpoints/ticketApi';
import { toast } from 'react-toastify';
import { UserDocument } from '@/types';
import mongoose from 'mongoose';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface TicketAssigneesComponentProps {
  ticketId: string;
  currentAssignees: any[];
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const TicketAssigneesComponent: React.FC<TicketAssigneesComponentProps> = ({
  ticketId,
  currentAssignees = [],
  isOpen,
  onClose,
  userId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  
  const { data: usersData, isLoading: usersLoading }:any = useGetUsersQuery();
  const [updateAssignees, { isLoading: isUpdating }] = useUpdateTicketAssigneesMutation();
  
  // Initialize selected users from current assignees
  useEffect(() => {
    if (currentAssignees && currentAssignees.length > 0) {
      setSelectedUsers(currentAssignees.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  }, [currentAssignees, isOpen]);
  console.log({})
  // Filter users based on search query
  const filteredUsers = usersData ? usersData?.data?.filter((user: any) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
 
          user.email?.toLowerCase().includes(searchQuery.toLowerCase());
  }): [];
  
  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  const handleSubmit = async () => {
    try {
      setFormError(null);
      
      await updateAssignees({
        ticketId,
        assignees: selectedUsers,
        updatedBy: userId
      }).unwrap();
      
      toast.success('Assignees updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update assignees:', error);
      setFormError('Failed to update assignees. Please try again.');
      toast.error('Failed to update assignees');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Manage Assignees</DialogTitle>
          <DialogDescription>
            Assign this ticket to one or more team members
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {formError && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              className="pl-9 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0 rounded-full"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="mb-4">
            <Label className="text-sm text-gray-500">Selected ({selectedUsers.length})</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedUsers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No users selected</p>
              ) : (
                selectedUsers.map(userId => {
                  const user = usersData?.data?.find((u: any) => u._id === userId);
                  if (!user) return null;
                  
console.log("Selected user:", user);
                  return (
                    <Badge 
                      key={userId} 
                      variant="secondary"
                      className="flex items-center gap-1 py-1 pl-2 pr-1 bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {`${user.firstName} ${user.lastName}`}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 rounded-full hover:bg-indigo-100"
                        onClick={() => handleToggleUser(userId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })
              )}
            </div>
          </div>
          
          <ScrollArea className="h-[300px] rounded-md border p-4">
            {usersLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user: any) => (
                  <div 
                    key={user._id} 
                    className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg cursor-pointer"
                    onClick={() => handleToggleUser(user._id)}
                  >
                    <Checkbox 
                      checked={selectedUsers.includes(user._id)}
                      onCheckedChange={() => handleToggleUser(user._id)}
                      className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <div className="flex items-center flex-1 min-w-0">
                      <Avatar className="h-8 w-8 mr-2">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} />
                        ) : (
                          <AvatarFallback className="bg-indigo-100 text-indigo-800">
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{`${user.firstName} ${user.lastName}`}</p>
                        {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-lg">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isUpdating}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketAssigneesComponent;