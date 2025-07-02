'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileTextIcon, 
  ClockIcon, 
  CalendarIcon,
  UserIcon,
  FolderIcon,
  EyeIcon
} from 'lucide-react';
import Link from 'next/link';
import { useGetFormsQuery } from '@/services/endpoints/hrmsApi';
import { HRMSFormTypes } from '@/types/hrms';

export default function DraftWorkflowsPage() {
  // Get draft forms for all form types
  const { data: manpowerDrafts } = useGetFormsQuery({ 
    formType: HRMSFormTypes.MANPOWER_REQUISITION,
    filter: JSON.stringify({ isDraft: true })
  });
  
  const { data: candidateDrafts } = useGetFormsQuery({ 
    formType: HRMSFormTypes.CANDIDATE_INFORMATION,
    filter: JSON.stringify({ isDraft: true })
  });

  const { data: employeeDrafts } = useGetFormsQuery({ 
    formType: HRMSFormTypes.EMPLOYEE_INFORMATION,
    filter: JSON.stringify({ isDraft: true })
  });

  // Combine all drafts
  const allDrafts = [
    ...(manpowerDrafts?.data || []).map((form: any) => ({ ...form, formType: 'manpower_requisition', typeName: 'Manpower Requisition' })),
    ...(candidateDrafts?.data || []).map((form: any) => ({ ...form, formType: 'candidate_information', typeName: 'Candidate Information' })),
    ...(employeeDrafts?.data || []).map((form: any) => ({ ...form, formType: 'employee_information', typeName: 'Employee Information' }))
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getFormStatusColor = (form: any) => {
    if (form.status === 'draft') return 'gray';
    return 'blue';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Draft Workflows & Forms</h1>
        <p className="mt-2 text-gray-600">
          View and continue working on your saved draft forms and workflows
        </p>
      </div>

      {allDrafts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Draft Forms Found</h3>
            <p className="text-gray-600 mb-6">
              You don't have any saved draft forms yet. Start a new workflow or create a form to see drafts here.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard/hrms/workflows/new">
                <Button>Start New Workflow</Button>
              </Link>
              <Link href="/dashboard/hrms/forms">
                <Button variant="outline">Browse Forms</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allDrafts.map((form: any) => (
            <Card key={form._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">{form.typeName}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {form.status || 'draft'}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {form.requestedPosition || form.candidateName || form.firstName + ' ' + form.lastName || 'Untitled Form'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Form Details */}
                <div className="space-y-2 text-sm">
                  {form.department && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      <span>{form.department}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Last saved: {formatDate(form.updatedAt || form.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>Created: {formatDate(form.createdAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/hrms/forms/${form.formType}/${form._id}/edit`} className="flex-1">
                    <Button size="sm" className="w-full">
                      Continue Editing
                    </Button>
                  </Link>
                  
                  <Link href={`/dashboard/hrms/forms/${form.formType}/${form._id}`}>
                    <Button size="sm" variant="outline">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {allDrafts.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Draft Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{allDrafts.length}</div>
                <div className="text-sm text-gray-600">Total Drafts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {allDrafts.filter(f => f.formType === 'manpower_requisition').length}
                </div>
                <div className="text-sm text-gray-600">Manpower Requests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {allDrafts.filter(f => f.formType === 'candidate_information').length}
                </div>
                <div className="text-sm text-gray-600">Candidate Info</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {allDrafts.filter(f => f.formType === 'employee_information').length}
                </div>
                <div className="text-sm text-gray-600">Employee Info</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}