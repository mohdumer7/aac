'use client';

import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ObjectId } from 'mongodb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Pencil, Mail, Phone, Hash, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { useGetAllUsersQuery } from '@/services/endpoints/hrWizardApi';
import { UserDocument } from '@/types';
import HrWizard from '../hr-wizard/components/HrWizard';
import { Skeleton } from '@/components/ui/skeleton';

// Extended interface for HR user data with additional properties for display
interface HrUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  jobTitle?: string;
  status: 'active' | 'pending' | 'inactive';
  empId?: string;
  avatar?: string;
  createdAt?: Date | string;
  fullName: string;
  initials: string;
  joinDate: string;
  isActive?: boolean;
  isDraft?: boolean;
}

export default function HrDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [localDrafts, setLocalDrafts] = useState<any[]>([]);
  
  // Fetch all users
  const { data: usersResponse = { data: [], total: 0 }, isLoading, error } = useGetAllUsersQuery({});
  
  // Extract users array from response
  const users = usersResponse.data || [];
  
  // Load local drafts on component mount and when the wizard is closed
  useEffect(() => {
    // Force a reload of local drafts whenever component renders on client
    if (typeof window !== 'undefined') {
      loadLocalDrafts();
      console.log('Loading local drafts...');
    }
  }, [isWizardOpen]); // Reload drafts when wizard closes
  
  // Function to delete a draft
  const handleDeleteDraft = (draftId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const draftKey = 'hr-wizard-draft-new';
      const draftData = localStorage.getItem(draftKey);
      
      if (draftData) {
        const parsedDrafts = JSON.parse(draftData);
        
        // Remove this draft from the collection
        if (parsedDrafts[draftId]) {
          delete parsedDrafts[draftId];
          localStorage.setItem(draftKey, JSON.stringify(parsedDrafts));
          
          // Update the drafts list
          loadLocalDrafts();
          toast.success('Draft deleted');
        }
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };
  
  // Function to load locally saved drafts
  const loadLocalDrafts = () => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      const draftKey = 'hr-wizard-draft-new';
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        const parsedDrafts = JSON.parse(draftData);
        const draftsArray = Object.values(parsedDrafts).map((draft: any) => ({
          ...draft,
          _id: draft._tempId,
          firstName: draft.personal?.firstName || 'Draft',
          lastName: draft.personal?.lastName || 'Employee',
          email: draft.personal?.email || '',
          draftName: draft._draftName || `Draft ${draft._tempId.substring(0, 5)}`,
          status: 'pending',
          createdAt: draft._lastUpdated,
          isDraft: true
        }));
        setLocalDrafts(draftsArray);
      } else {
        setLocalDrafts([]);
      }
    } catch (error) {
      console.error('Error loading local drafts:', error);
      setLocalDrafts([]);
    }
  };

  const filteredUsers = users.filter(user => {
    // Create fullName from firstName and lastName
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().trim();
    
    return fullName.includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.empId?.toLowerCase().includes(searchTerm.toLowerCase())
  });

  const handleEditUser = (user: HrUser) => {
    setSelectedUserId(user._id);
    setIsWizardOpen(true);
  };

  const handleAddNew = () => {
    setSelectedUserId(null);
    setIsWizardOpen(true);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setSelectedUserId(null);
    // Reload local drafts when the wizard closes
    loadLocalDrafts();
  };

  // Format user data for the table
  const tableData = useMemo<HrUser[]>(() => {
    // Combine API users and local drafts
    const allUsers = [...filteredUsers, ...localDrafts.filter(draft => {
      // Only include drafts that don't have a corresponding user in the API data
      return !filteredUsers.some(user => 
        user._id === draft._id || 
        (user.firstName === draft.firstName && user.lastName === draft.lastName && draft.firstName && draft.lastName)
      );
    })];
    
    return allUsers.map((user: any) => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const email = user.email || '';
      const name = firstName || email.split('@')[0] || 'User';
      const fullName = `${firstName} ${lastName}`.trim() || 'Unnamed Employee';
      
      return {
        ...user,
        _id: user._id?.toString() || '',
        firstName,
        lastName,
        email,
        fullName,
        initials: `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U',
        joinDate: user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A',
        status: user.status || 'pending',
        isDraft: user.isDraft || false
      };
    });
  }, [filteredUsers, localDrafts, searchTerm]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">HR Dashboard</h1>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>
      
      {/* Drafts Section */}
      {localDrafts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Saved Drafts
            </CardTitle>
            <CardDescription>
              Resume working on incomplete employee forms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localDrafts.map((draft) => (
                    <TableRow
                      key={draft._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedUserId(draft._id);
                        setIsWizardOpen(true);
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-9 w-9 bg-blue-100">
                            <AvatarFallback>{draft.initials || 'DR'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{draft.draftName || `${draft.firstName} ${draft.lastName}`}</div>
                            <div className="text-sm text-muted-foreground">Draft Employee</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                        >
                          Draft
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {draft._lastUpdated ? format(new Date(draft._lastUpdated), 'MMM d, yyyy h:mm a') : 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserId(draft._id);
                              setIsWizardOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => handleDeleteDraft(draft._id, e)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M3 6h18"/>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              className="pl-9 h-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="px-7">
          <CardTitle>Employees</CardTitle>
          <CardDescription>Manage your employee records and onboarding process</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h3 className="text-lg font-medium">Error loading employees</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No employees found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm 
                  ? 'No employees match your search.' 
                  : 'Get started by adding a new employee.'}
              </p>
              <Button onClick={handleAddNew} className="mt-2">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((user: HrUser) => (
                    <TableRow 
                      key={user._id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleEditUser(user)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatar} alt={user.fullName} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground">{user.jobTitle}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            <span>{user.email || 'No email'}</span>
                          </div>
                          {user.phoneNumber && (
                            <div className="flex items-center text-sm">
                              <Phone className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              <span>{user.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Hash className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                          <span>{user.empId || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.status === 'active' ? 'default' : 'outline'}
                          className={cn(
                            'whitespace-nowrap',
                            user.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : '',
                            user.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : '',
                            user.status === 'inactive' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' : '',
                            user.isDraft ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''
                          )}
                        >
                          {user.isDraft && 'Draft'}
                          {!user.isDraft && user.status === 'active' && 'Active'}
                          {!user.isDraft && user.status === 'pending' && 'Pending'}
                          {!user.isDraft && user.status === 'inactive' && 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {user.joinDate}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(user);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard Dialog */}
      <HrWizard 
        isOpen={isWizardOpen}
        onOpenChange={handleWizardClose}
        empId={selectedUserId || undefined}
        onSuccess={handleWizardClose}
      />
    </div>
  );
}
