'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  SaveIcon,
  PlayIcon,
  ArrowLeftIcon,
  WorkflowIcon,
  InfoIcon
} from 'lucide-react';
import { toast } from 'sonner';
import ApprovalFlowDesigner from '@/components/hrms/ApprovalFlowDesigner';
import { 
  useGetApprovalFlowByIdQuery,
  useUpdateApprovalFlowMutation,
  useTestApprovalFlowMutation,
  useGetAvailableApproversQuery,
  useGetRolesQuery
} from '@/services/endpoints/hrmsApi';

export default function FlowDesignerPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = params.id as string;
  
  const [testResults, setTestResults] = useState<any>(null);
  const [showTestResults, setShowTestResults] = useState(false);

  // API hooks
  const { 
    data: flowData, 
    isLoading: isLoadingFlow, 
    error: flowError 
  } = useGetApprovalFlowByIdQuery(flowId);
  
  const { data: approversData } = useGetAvailableApproversQuery({});
  const { data: rolesData } = useGetRolesQuery({});
  
  const [updateFlow, { isLoading: isUpdating }] = useUpdateApprovalFlowMutation();
  const [testFlow, { isLoading: isTesting }] = useTestApprovalFlowMutation();

  const flow = flowData?.data;
  const approvers = approversData?.data || [];
  const roles = rolesData?.data || [];

  const handleSaveDesign = async (flowDesignData: any) => {
    try {
      const result = await updateFlow({
        id: flowId,
        data: {
          flowDesign: flowDesignData
        }
      }).unwrap();

      if (result.success) {
        toast.success('Flow design saved successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save flow design');
    }
  };

  const handleTestFlow = async (flowData: any) => {
    try {
      // Create sample form data for testing
      const sampleFormData = {
        submittedBy: 'sample-user-id',
        department: 'sample-department-id',
        formType: flow?.formType,
        // Add other sample fields as needed
      };

      const result = await testFlow({
        id: flowId,
        sampleFormData
      }).unwrap();

      setTestResults(result.data);
      setShowTestResults(true);
      
      if (result.data.isValid) {
        toast.success('Flow validation completed successfully!');
      } else {
        toast.warning('Flow validation found some issues. Check the results below.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to test flow');
    }
  };

  if (isLoadingFlow) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (flowError || !flow) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Alert variant="destructive">
          <AlertDescription>
            Error loading approval flow. Please try again or go back to the flows list.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard/hrms/approval-flows')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Flows
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <WorkflowIcon className="h-8 w-8" />
              Flow Designer
            </h1>
            <p className="text-muted-foreground">
              Design visual approval workflow for: <span className="font-medium">{flow.flowName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Flow Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Flow Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Flow Name</label>
              <p className="text-sm">{flow.flowName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Form Type</label>
              <p className="text-sm">{flow.formType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-sm">
                {flow.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-gray-500">Inactive</span>
                )}
              </p>
            </div>
          </div>
          {flow.flowDescription && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Description</label>
              <p className="text-sm text-gray-800">{flow.flowDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>How to use the Flow Designer:</strong>
          <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
            <li>Drag approval steps from the panel on the right to add them to your flow</li>
            <li>Double-click on any step to configure its settings and assign approvers</li>
            <li>Connect steps by dragging from the connection points</li>
            <li>Use "Auto Layout" to automatically arrange your flow</li>
            <li>Save your design and test it before activating</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Flow Designer */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Flow Designer</CardTitle>
          <CardDescription>
            Design your approval workflow visually by dragging and connecting approval steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApprovalFlowDesigner
            initialFlowData={flow.flowDesign}
            availableApprovers={approvers}
            availableRoles={roles}
            onSave={handleSaveDesign}
            onTest={handleTestFlow}
          />
        </CardContent>
      </Card>

      {/* Test Results */}
      {showTestResults && testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayIcon className="h-5 w-5" />
              Flow Test Results
            </CardTitle>
            <CardDescription>
              Validation results for your approval flow configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Overall Status */}
              <Alert variant={testResults.isValid ? "default" : "destructive"}>
                <AlertDescription>
                  <strong>Flow Status:</strong> {testResults.isValid ? "✅ Valid" : "❌ Invalid"}
                  {!testResults.isValid && " - Please fix the issues below"}
                </AlertDescription>
              </Alert>

              {/* Step Results */}
              {testResults.steps && testResults.steps.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Step Validation Results:</h4>
                  <div className="space-y-3">
                    {testResults.steps.map((step: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium">Step {step.stepOrder}: {step.stepName}</h5>
                            <p className="text-sm text-gray-600">{step.approverType}</p>
                          </div>
                          <div className="text-sm">
                            {step.approvers.length > 0 ? (
                              <span className="text-green-600">✅ {step.approvers.length} approver(s)</span>
                            ) : (
                              <span className="text-red-600">❌ No approvers</span>
                            )}
                          </div>
                        </div>
                        
                        {step.approvers.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">Assigned Approvers:</p>
                            <div className="flex flex-wrap gap-1">
                              {step.approvers.map((approver: any, i: number) => (
                                <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {approver.userName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {step.issues.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-red-600 mb-1">Issues:</p>
                            <ul className="text-xs text-red-600 ml-4 list-disc">
                              {step.issues.map((issue: string, i: number) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors and Warnings */}
              {testResults.errors && testResults.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-600 ml-4 list-disc">
                    {testResults.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testResults.warnings && testResults.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">Warnings:</h4>
                  <ul className="text-sm text-orange-600 ml-4 list-disc">
                    {testResults.warnings.map((warning: string, index: number) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => setShowTestResults(false)}
                className="mt-4"
              >
                Close Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline"
          onClick={() => handleTestFlow({ nodes: [], edges: [] })}
          disabled={isTesting}
        >
          {isTesting ? (
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-current" />
          ) : (
            <PlayIcon className="h-4 w-4 mr-2" />
          )}
          Test Flow
        </Button>
        <Button 
          onClick={() => router.push(`/dashboard/hrms/approval-flows/${flowId}/edit`)}
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          Edit Flow Settings
        </Button>
      </div>
    </div>
  );
}