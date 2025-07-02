'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusIcon, 
  FileTextIcon, 
  UserPlusIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  EyeIcon,
  WorkflowIcon,
  UserIcon,
  SettingsIcon
} from 'lucide-react';
import { useGetHRMSDashboardQuery } from '@/services/endpoints/hrmsApi';
import { HRMSFormTypes, HRMS_FORM_CONFIG } from '@/types/hrms';
import Link from 'next/link';

export default function HRMSDashboardPage() {
  const { 
    data: dashboardData, 
    isLoading, 
    error 
  } = useGetHRMSDashboardQuery({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircleIcon className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Error Loading Dashboard</h3>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  const formStats = dashboardData?.data?.formStats || {};
  const approvalStats = dashboardData?.data?.approvalStats || [];

  // Calculate overall statistics
  const overallStats = Object.values(formStats).reduce(
    (acc: any, stats: any) => ({
      total: acc.total + stats.total,
      drafts: acc.drafts + stats.drafts,
      submitted: acc.submitted + stats.submitted,
      approved: acc.approved + stats.approved,
      rejected: acc.rejected + stats.rejected,
      pending: acc.pending + stats.pending
    }),
    { total: 0, drafts: 0, submitted: 0, approved: 0, rejected: 0, pending: 0 }
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HRMS Dashboard</h1>
          <p className="text-muted-foreground">
            Manage HR processes from recruitment to onboarding
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/hrms/forms/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Form
            </Button>
          </Link>
          <Link href="/dashboard/hrms/approval-flows">
            <Button variant="outline">
              Approval Flows
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.total}</div>
            <p className="text-xs text-muted-foreground">
              All HR forms in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{overallStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Successfully approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{overallStats.drafts}</div>
            <p className="text-xs text-muted-foreground">
              Saved as drafts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="forms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forms">Forms Overview</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Forms Overview Tab */}
        <TabsContent value="forms">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(HRMSFormTypes).map((formType) => {
              const config = HRMS_FORM_CONFIG[formType];
              const stats = formStats[formType] || {
                total: 0,
                drafts: 0,
                submitted: 0,
                approved: 0,
                rejected: 0,
                pending: 0
              };

              return (
                <Card key={formType} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{config?.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {config?.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <Badge variant="secondary">{stats.total}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {stats.pending}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Approved</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {stats.approved}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Link href={`/dashboard/hrms/forms/${formType}/new`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <PlusIcon className="h-3 w-3 mr-1" />
                          New
                        </Button>
                      </Link>
                      <Link href={`/dashboard/hrms/forms/${formType}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Pending Approvals Tab */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Forms waiting for your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
                <p className="text-gray-600">When forms require your approval, they will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Analytics</CardTitle>
                <CardDescription>Track workflow progress and completion times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Workflows:</span>
                    <Badge variant="outline">3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed This Month:</span>
                    <Badge variant="outline">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Completion Time:</span>
                    <Badge variant="outline">7 days</Badge>
                  </div>
                  <Link href="/dashboard/hrms/workflows" className="block">
                    <Button className="w-full">
                      <WorkflowIcon className="h-4 w-4 mr-2" />
                      View All Workflows
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common HR workflow actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/dashboard/hrms/workflows/new?template=recruitment">
                    <Button variant="outline" className="w-full justify-start">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Start Recruitment Process
                    </Button>
                  </Link>
                  <Link href="/dashboard/hrms/workflows/new?template=onboarding">
                    <Button variant="outline" className="w-full justify-start">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Begin Employee Onboarding
                    </Button>
                  </Link>
                  <Link href="/dashboard/hrms/approval-flows">
                    <Button variant="outline" className="w-full justify-start">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Manage Approval Flows
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Statistics</CardTitle>
                <CardDescription>Overview of all form submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.values(HRMSFormTypes).map((formType) => {
                    const stats = formStats[formType] || { total: 0, drafts: 0, submitted: 0, approved: 0, rejected: 0, pending: 0 };
                    const config = HRMS_FORM_CONFIG[formType];
                    const approvalRate = stats.submitted > 0 ? Math.round((stats.approved / stats.submitted) * 100) : 0;

                    return (
                      <div key={formType} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{config?.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {stats.total} total submissions
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {approvalRate}% approved
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stats.pending} pending
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/hrms/forms/manpower_requisition/new">
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    New Manpower Request
                  </Button>
                </Link>
                
                <Link href="/dashboard/hrms/forms/candidate_information/new">
                  <Button variant="outline" className="w-full justify-start">
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Add Candidate Info
                  </Button>
                </Link>
                
                <Link href="/dashboard/hrms/forms/new_employee_joining/new">
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Employee Joining
                  </Button>
                </Link>
                
                <Link href="/dashboard/hrms/approval-flows/new">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Create Approval Flow
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}