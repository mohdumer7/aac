'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  PlusIcon, 
  SearchIcon, 
  EyeIcon, 
  EditIcon,
  CopyIcon,
  MoreHorizontalIcon,
  PlayIcon,
  PauseIcon,
  BarChartIcon,
  WorkflowIcon,
  SettingsIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  useGetApprovalFlowsQuery, 
  useToggleApprovalFlowStatusMutation,
  useCloneApprovalFlowMutation,
  useDeleteApprovalFlowMutation
} from '@/services/endpoints/hrmsApi';
import { HRMS_FORM_CONFIG, HRMSFormTypes } from '@/types/hrms';

export default function ApprovalFlowsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formTypeFilter, setFormTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cloneDialog, setCloneDialog] = useState<{ open: boolean; flow: any }>({ open: false, flow: null });
  const [newFlowName, setNewFlowName] = useState('');

  // API hooks
  const { 
    data: flowsData, 
    isLoading, 
    error,
    refetch
  } = useGetApprovalFlowsQuery({
    formType: formTypeFilter === 'all' ? undefined : formTypeFilter,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
  });

  const [toggleStatus, { isLoading: isToggling }] = useToggleApprovalFlowStatusMutation();
  const [cloneFlow, { isLoading: isCloning }] = useCloneApprovalFlowMutation();
  const [deleteFlow, { isLoading: isDeleting }] = useDeleteApprovalFlowMutation();

  const handleToggleStatus = async (flowId: string, currentStatus: boolean) => {
    try {
      await toggleStatus({ id: flowId, isActive: !currentStatus }).unwrap();
      toast.success(`Flow ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update flow status');
    }
  };

  const handleClone = async () => {
    if (!cloneDialog.flow || !newFlowName.trim()) return;

    try {
      await cloneFlow({ 
        id: cloneDialog.flow._id, 
        newFlowName: newFlowName.trim() 
      }).unwrap();
      toast.success('Flow cloned successfully');
      setCloneDialog({ open: false, flow: null });
      setNewFlowName('');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to clone flow');
    }
  };

  const handleDelete = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this approval flow? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteFlow(flowId).unwrap();
      toast.success('Flow deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete flow');
    }
  };

  const flows = flowsData?.data?.flows || [];
  const pagination = flowsData?.data?.pagination;

  // Filter flows based on search term
  const filteredFlows = flows.filter((flow: any) => 
    flow.flowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flow.formType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Flows</h1>
          <p className="text-muted-foreground">
            Design and manage approval workflows for HR forms
          </p>
        </div>
        <Link href="/dashboard/hrms/approval-flows/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Flow
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search flows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Form Type Filter */}
            <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Form Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Form Types</SelectItem>
                {Object.values(HRMSFormTypes).map((formType) => (
                  <SelectItem key={formType} value={formType}>
                    {HRMS_FORM_CONFIG[formType]?.title || formType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Create Flow Button */}
            <Link href="/dashboard/hrms/approval-flows/new">
              <Button className="w-full">
                <WorkflowIcon className="h-4 w-4 mr-2" />
                Design New Flow
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Flow List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Approval Flows</CardTitle>
              <CardDescription>
                {filteredFlows.length} flow{filteredFlows.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>
                Error loading approval flows. Please try again.
              </AlertDescription>
            </Alert>
          ) : filteredFlows.length === 0 ? (
            <div className="text-center py-8">
              <WorkflowIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No approval flows found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || formTypeFilter !== 'all' || statusFilter !== 'all'
                  ? "No flows match your current filters"
                  : "Get started by creating your first approval flow"
                }
              </p>
              <Link href="/dashboard/hrms/approval-flows/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Approval Flow
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flow Name</TableHead>
                  <TableHead>Form Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlows.map((flow: any) => (
                  <TableRow key={flow._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <WorkflowIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{flow.flowName}</div>
                          {flow.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {HRMS_FORM_CONFIG[flow.formType]?.title || flow.formType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {flow.isActive ? (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-700">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-600">Inactive</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{flow.steps?.length || 0} steps</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {flow.stats?.totalSubmissions || 0} submissions
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(flow.updatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/hrms/approval-flows/${flow._id}`}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/hrms/approval-flows/${flow._id}/edit`}>
                              <EditIcon className="h-4 w-4 mr-2" />
                              Edit Flow
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/hrms/approval-flows/${flow._id}/designer`}>
                              <SettingsIcon className="h-4 w-4 mr-2" />
                              Flow Designer
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setCloneDialog({ open: true, flow })}
                          >
                            <CopyIcon className="h-4 w-4 mr-2" />
                            Clone Flow
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(flow._id, flow.isActive)}
                            disabled={isToggling}
                          >
                            {flow.isActive ? (
                              <>
                                <PauseIcon className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <PlayIcon className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/hrms/approval-flows/${flow._id}/stats`}>
                              <BarChartIcon className="h-4 w-4 mr-2" />
                              View Analytics
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(flow._id)}
                            disabled={isDeleting}
                            className="text-red-600"
                          >
                            Delete Flow
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Clone Flow Dialog */}
      <Dialog open={cloneDialog.open} onOpenChange={(open) => setCloneDialog({ open, flow: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Approval Flow</DialogTitle>
            <DialogDescription>
              Create a copy of &quot;{cloneDialog.flow?.flowName}&quot; with a new name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Flow Name</label>
              <Input
                placeholder="Enter name for cloned flow"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCloneDialog({ open: false, flow: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClone}
              disabled={isCloning || !newFlowName.trim()}
            >
              {isCloning && (
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-current" />
              )}
              Clone Flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}