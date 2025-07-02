'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeftIcon,
  PlayIcon,
  UserIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  InfoIcon
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { HRMSFormTypes } from '@/types/hrms';
import { HRMS_WORKFLOW_TEMPLATES } from '@/types/workflow';
import { useGetDepartmentsQuery, useGetUsersQuery } from '@/services/endpoints/hrmsApi';

export default function NewWorkflowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get('template');
  
  const [selectedTemplate, setSelectedTemplate] = useState(templateParam || '');
  const [workflowData, setWorkflowData] = useState({
    requestedBy: '',
    requestedById: '',
    candidateName: '',
    employeeName: '',
    position: '',
    department: '',
    departmentId: '',
    expectedEndDate: '',
    comments: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch master data
  const { data: departmentsData } = useGetDepartmentsQuery();
  const { data: usersData } = useGetUsersQuery();

  const departments = departmentsData?.data || [];
  const users = usersData?.data || [];

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
  };

  const handleStartWorkflow = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a workflow template');
      return;
    }

    // Validate required fields based on template
    if (selectedTemplate === 'recruitment' && !workflowData.requestedBy) {
      toast.error('Requested by person is required for recruitment workflow');
      return;
    }

    if (selectedTemplate === 'onboarding' && !workflowData.employeeName) {
      toast.error('Employee name is required for onboarding workflow');
      return;
    }

    setIsLoading(true);

    try {
      // For now, redirect to the first form of the workflow
      const template = getTemplateByKey(selectedTemplate);
      if (template && template.steps.length > 0) {
        const firstStep = template.steps[0];
        
        // Store workflow data in session storage for the form to pick up
        sessionStorage.setItem('workflowData', JSON.stringify({
          workflowType: selectedTemplate,
          template: template,
          metadata: workflowData
        }));
        
        // Redirect to the first form
        router.push(`/dashboard/hrms/forms/${firstStep.formType}/new?workflow=true`);
      }
    } catch (error: any) {
      console.error('Error starting workflow:', error);
      toast.error('Failed to start workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateByKey = (key: string) => {
    switch (key.toLowerCase()) {
      case 'recruitment':
        return HRMS_WORKFLOW_TEMPLATES.RECRUITMENT;
      case 'onboarding':
        return HRMS_WORKFLOW_TEMPLATES.ONBOARDING;
      case 'business_travel':
        return HRMS_WORKFLOW_TEMPLATES.BUSINESS_TRAVEL;
      default:
        return null;
    }
  };

  const selectedTemplateData = getTemplateByKey(selectedTemplate);

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/hrms/workflows">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Start New Workflow</h1>
          <p className="text-muted-foreground">
            Choose a workflow template and provide initial information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Workflow Template</CardTitle>
            <CardDescription>
              Choose a pre-configured workflow for your HR process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(HRMS_WORKFLOW_TEMPLATES).map(([key, template]) => (
              <div
                key={key}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate === key.toLowerCase()
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTemplateSelect(key.toLowerCase())}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{template.workflowName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {template.steps.length} steps
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {template.workflowType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedTemplate === key.toLowerCase()
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Workflow Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Information</CardTitle>
            <CardDescription>
              Provide details for the workflow instance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTemplate === 'recruitment' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="requestedBy">Requested By (HR/Manager)</Label>
                  <Select
                    value={workflowData.requestedById}
                    onValueChange={(value) => {
                      const selectedUser = users.find(user => user._id === value);
                      setWorkflowData({ 
                        ...workflowData, 
                        requestedById: value,
                        requestedBy: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select requesting person" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position Required</Label>
                  <Input
                    id="position"
                    value={workflowData.position}
                    onChange={(e) => setWorkflowData({ ...workflowData, position: e.target.value })}
                    placeholder="Enter position title needed"
                  />
                </div>
              </>
            )}

            {selectedTemplate === 'onboarding' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Name</Label>
                  <Input
                    id="employeeName"
                    value={workflowData.employeeName}
                    onChange={(e) => setWorkflowData({ ...workflowData, employeeName: e.target.value })}
                    placeholder="Enter employee name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={workflowData.position}
                    onChange={(e) => setWorkflowData({ ...workflowData, position: e.target.value })}
                    placeholder="Enter position title"
                  />
                </div>
              </>
            )}

            {selectedTemplate && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={workflowData.departmentId}
                    onValueChange={(value) => {
                      const selectedDept = departments.find(dept => dept._id === value);
                      setWorkflowData({ 
                        ...workflowData, 
                        departmentId: value,
                        department: selectedDept ? selectedDept.name : ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedEndDate">Expected Completion Date</Label>
                  <Input
                    id="expectedEndDate"
                    type="date"
                    value={workflowData.expectedEndDate}
                    onChange={(e) => setWorkflowData({ ...workflowData, expectedEndDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    value={workflowData.comments}
                    onChange={(e) => setWorkflowData({ ...workflowData, comments: e.target.value })}
                    placeholder="Add any additional comments or instructions"
                    rows={3}
                  />
                </div>
              </>
            )}

            {!selectedTemplate && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Please select a workflow template to configure the workflow details.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Preview */}
      {selectedTemplateData && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps Preview</CardTitle>
            <CardDescription>
              This workflow will guide you through the following steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 overflow-x-auto pb-4">
              {selectedTemplateData.steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="min-w-[200px] p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      {step.isRequired && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                      )}
                    </div>
                    <h4 className="font-medium text-sm">{step.stepName}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {step.formType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                  {index < selectedTemplateData.steps.length - 1 && (
                    <ArrowLeftIcon className="w-5 h-5 text-gray-400 mx-2 transform rotate-180" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Link href="/dashboard/hrms/workflows">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button 
          onClick={handleStartWorkflow}
          disabled={!selectedTemplate || isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-current mr-2" />
          ) : (
            <PlayIcon className="w-4 h-4 mr-2" />
          )}
          Start Workflow
        </Button>
      </div>
    </div>
  );
}