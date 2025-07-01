'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  SearchIcon, 
  EyeIcon,
  MessageSquareIcon,
  XCircleIcon,
  AlertCircleIcon,
  FileTextIcon,
  CalendarIcon,
  UserIcon
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useGetApprovalInstancesQuery, useApproveInstanceMutation, useRejectInstanceMutation, useRequestChangesMutation } from '@/services/endpoints/hrmsApi';
import { HRMS_FORM_CONFIG } from '@/types/hrms';
import HRMSStatusBadge from '@/components/hrms/HRMSStatusBadge';
import { HRMSApprovalInstanceFilters } from '@/types/hrms';

export default function HRMSApprovalsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_changes' | null>(null);
  const [comments, setComments] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // API mutations
  const [approveInstance, { isLoading: isApproving }] = useApproveInstanceMutation();
  const [rejectInstance, { isLoading: isRejecting }] = useRejectInstanceMutation();
  const [requestChanges, { isLoading: isRequestingChanges }] = useRequestChangesMutation();

  // Filters based on active tab
  const getFilters = (): HRMSApprovalInstanceFilters => {
    const baseFilters: HRMSApprovalInstanceFilters = {
      page: 1,
      limit: 20,
      sortBy: 'submittedDate',
      sortOrder: 'desc'
    };

    if (searchTerm) {
      baseFilters.formType = searchTerm;
    }

    switch (activeTab) {
      case 'pending':
        return {
          ...baseFilters,
          viewType: 'approver',
          currentStatus: 'in_progress'
        };
      case 'my_submissions':
        return {
          ...baseFilters,
          viewType: 'submitter'
        };
      case 'all':
        return baseFilters;
      default:
        return baseFilters;
    }
  };

  const { 
    data: approvalsData, 
    isLoading, 
    error,
    refetch
  } = useGetApprovalInstancesQuery(getFilters());

  const handleApprovalAction = async (instance: any, action: 'approve' | 'reject' | 'request_changes') => {
    setSelectedInstance(instance);
    setActionType(action);
    setComments('');
    setIsDialogOpen(true);
  };

  const executeAction = async () => {
    if (!selectedInstance || !actionType) return;

    try {
      const currentStep = selectedInstance.stepProgress.find(
        (step: any) => step.stepOrder === selectedInstance.currentStepOrder
      );

      const payload = {
        id: selectedInstance._id,
        stepOrder: selectedInstance.currentStepOrder,
        comments,
        attachments: []
      };

      let result;
      switch (actionType) {
        case 'approve':
          result = await approveInstance(payload).unwrap();
          toast.success('Form approved successfully');
          break;
        case 'reject':
          if (!comments.trim()) {
            toast.error('Comments are required for rejection');
            return;
          }
          result = await rejectInstance(payload).unwrap();
          toast.success('Form rejected');
          break;
        case 'request_changes':
          if (!comments.trim()) {
            toast.error('Comments are required when requesting changes');
            return;
          }
          result = await requestChanges(payload).unwrap();
          toast.success('Change request sent');
          break;
      }

      setIsDialogOpen(false);
      setSelectedInstance(null);
      setActionType(null);
      setComments('');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    }
  };

  const instances = approvalsData?.data?.instances || [];
  const pagination = approvalsData?.data?.pagination;

  // Filter instances that need current user's approval
  const pendingForMe = instances.filter((instance: any) => {
    if (instance.currentStatus !== 'in_progress') return false;
    
    const currentStep = instance.stepProgress.find(
      (step: any) => step.stepOrder === instance.currentStepOrder
    );
    
    return currentStep?.assignedApprovers?.some(
      (approver: any) => approver.userId === session?.user?.id
    );
  });

  const getFormTitle = (formType: string) => {
    return HRMS_FORM_CONFIG[formType]?.title || formType;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HRMS Approvals</h1>
          <p className="text-muted-foreground">
            Manage and review HR form submissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {pendingForMe.length} pending your approval
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            {pendingForMe.length}
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by form type or employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Pending Approval ({pendingForMe.length})
          </TabsTrigger>
          <TabsTrigger value="my_submissions">
            <FileTextIcon className="h-4 w-4 mr-2" />
            My Submissions
          </TabsTrigger>
          <TabsTrigger value="all">
            All Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forms Pending Your Approval</CardTitle>
              <CardDescription>
                Review and approve forms that require your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pendingForMe.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">
                    No forms are currently pending your approval
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Type</TableHead>
                      <TableHead>Form ID</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Submitted Date</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingForMe.map((instance: any) => (
                      <TableRow key={instance._id}>
                        <TableCell className="font-medium">
                          {getFormTitle(instance.formType)}
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/dashboard/hrms/forms/${instance.formType}/${instance.formId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {instance.formNumber || instance.formId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            {instance.submittedBy?.displayName || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            {new Date(instance.submittedDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            Step {instance.currentStepOrder}: {instance.currentStepName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprovalAction(instance, 'approve')}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprovalAction(instance, 'request_changes')}
                            >
                              <MessageSquareIcon className="h-4 w-4 mr-1" />
                              Changes
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApprovalAction(instance, 'reject')}
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my_submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Form Submissions</CardTitle>
              <CardDescription>
                Track the status of forms you have submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : instances.length === 0 ? (
                <div className="text-center py-8">
                  <FileTextIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any forms for approval
                  </p>
                  <Link href="/dashboard/hrms">
                    <Button>
                      Create Your First Form
                    </Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Type</TableHead>
                      <TableHead>Form ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted Date</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((instance: any) => (
                      <TableRow key={instance._id}>
                        <TableCell className="font-medium">
                          {getFormTitle(instance.formType)}
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/dashboard/hrms/forms/${instance.formType}/${instance.formId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {instance.formNumber || instance.formId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <HRMSStatusBadge status={instance.currentStatus} size="sm" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            {new Date(instance.submittedDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {instance.currentStatus === 'approved' ? (
                            <span className="text-green-600 text-sm">Completed</span>
                          ) : instance.currentStatus === 'rejected' ? (
                            <span className="text-red-600 text-sm">Rejected</span>
                          ) : (
                            <div className="text-sm">
                              Step {instance.currentStepOrder}: {instance.currentStepName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/hrms/forms/${instance.formType}/${instance.formId}`}>
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Approval Instances</CardTitle>
              <CardDescription>
                Complete overview of all form approvals in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Similar table structure as other tabs */}
              <div className="text-center py-8 text-muted-foreground">
                This view shows all approval instances across the organization.
                Implementation can be expanded based on specific requirements.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Form'}
              {actionType === 'reject' && 'Reject Form'}
              {actionType === 'request_changes' && 'Request Changes'}
            </DialogTitle>
            <DialogDescription>
              {selectedInstance && (
                <>
                  {actionType === 'approve' && 'Are you sure you want to approve this form? This action will move it to the next step in the approval process.'}
                  {actionType === 'reject' && 'Please provide a reason for rejecting this form. The submitter will be notified.'}
                  {actionType === 'request_changes' && 'Please specify what changes are needed. The form will be sent back to the submitter.'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedInstance && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div><strong>Form:</strong> {getFormTitle(selectedInstance.formType)}</div>
                  <div><strong>ID:</strong> {selectedInstance.formNumber || selectedInstance.formId}</div>
                  <div><strong>Submitted by:</strong> {selectedInstance.submittedBy?.displayName}</div>
                  <div><strong>Current Step:</strong> {selectedInstance.currentStepName}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Comments {(actionType === 'reject' || actionType === 'request_changes') && '*'}
              </label>
              <Textarea
                placeholder={
                  actionType === 'approve' ? 'Optional comments...' :
                  actionType === 'reject' ? 'Please provide reason for rejection...' :
                  'Please specify what changes are needed...'
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={executeAction}
              disabled={
                isApproving || isRejecting || isRequestingChanges ||
                ((actionType === 'reject' || actionType === 'request_changes') && !comments.trim())
              }
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {(isApproving || isRejecting || isRequestingChanges) && (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-current" />
              )}
              {actionType === 'approve' && 'Approve'}
              {actionType === 'reject' && 'Reject'}
              {actionType === 'request_changes' && 'Request Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}