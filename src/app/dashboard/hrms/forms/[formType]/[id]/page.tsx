'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircleIcon, 
  EditIcon, 
  FileTextIcon, 
  ShareIcon,
  PrinterIcon,
  HistoryIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from 'lucide-react';
import Link from 'next/link';
import HRMSFormContainer from '@/components/hrms/HRMSFormContainer';
import HRMSFormSection from '@/components/hrms/HRMSFormSection';
import HRMSStatusBadge from '@/components/hrms/HRMSStatusBadge';
import PDFGenerator from '@/components/hrms/PDFGenerator';
import { getFormConfig } from '@/configs/hrms-forms';
import { useGetFormByIdQuery, useGetApprovalInstancesQuery } from '@/services/endpoints/hrmsApi';
import { HRMSFormConfig } from '@/types/hrms';

export default function HRMSFormViewPage() {
  const params = useParams();
  const router = useRouter();
  const formType = params.formType as string;
  const formId = params.id as string;
  
  const [formConfig, setFormConfig] = useState<HRMSFormConfig | null>(null);

  // API hooks
  const { 
    data: formData, 
    isLoading: isLoadingForm, 
    error: formError 
  } = useGetFormByIdQuery({ formType, id: formId });

  const { 
    data: approvalData,
    isLoading: isLoadingApproval
  } = useGetApprovalInstancesQuery({ 
    formType, 
    formId,
    limit: 1 
  });

  useEffect(() => {
    const config = getFormConfig(formType);
    if (!config) {
      toast.error('Invalid form type');
      router.push('/dashboard/hrms');
      return;
    }
    setFormConfig(config);
  }, [formType, router]);

  if (isLoadingForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (formError || !formData?.success) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Form not found or you don't have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!formConfig) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Invalid or unsupported form type: {formType}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const form = formData.data;
  const approvalInstance = approvalData?.data?.instances?.[0];

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Form Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{formConfig.title}</CardTitle>
                <HRMSStatusBadge status={form.isDraft ? 'draft' : form.status} />
              </div>
              <CardDescription>
                Form ID: {form.formId} • Created: {new Date(form.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              {form.isDraft && (
                <Link href={`/dashboard/hrms/forms/${formType}/${formId}/edit`}>
                  <Button size="sm">
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              )}
              
              <PDFGenerator
                formType={formType}
                formId={formId}
                triggerButton={
                  <Button size="sm" variant="outline">
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Generate PDF
                  </Button>
                }
              />
              
              <Button size="sm" variant="outline">
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Approval Status (if form is submitted) */}
      {!form.isDraft && approvalInstance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HistoryIcon className="h-5 w-5" />
              Approval Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current Status</p>
                  <p className="text-sm text-muted-foreground">
                    Step {approvalInstance.currentStepOrder}: {approvalInstance.currentStepName}
                  </p>
                </div>
                <HRMSStatusBadge status={approvalInstance.currentStatus} />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Progress Timeline</h4>
                {approvalInstance.stepProgress.map((step: any, index: number) => (
                  <div key={step.stepOrder} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {step.status === 'approved' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      ) : step.status === 'rejected' ? (
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                      ) : step.status === 'in_progress' ? (
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{step.stepName}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.assignedApprovers?.map((approver: any) => approver.userName).join(', ')}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {step.stepEndDate ? new Date(step.stepEndDate).toLocaleDateString() : 
                       step.stepStartDate ? 'In Progress' : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
              
              {approvalInstance.currentStatus === 'approved' && approvalInstance.finalResolution && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Form Approved</span>
                  </div>
                  <p className="text-sm text-green-800">
                    Approved by {approvalInstance.finalResolution.resolvedBy} on{' '}
                    {new Date(approvalInstance.finalResolution.resolvedDate).toLocaleDateString()}
                  </p>
                  {approvalInstance.finalResolution.finalComments && (
                    <p className="text-sm text-green-700 mt-1">
                      Comments: {approvalInstance.finalResolution.finalComments}
                    </p>
                  )}
                </div>
              )}
              
              {approvalInstance.currentStatus === 'rejected' && approvalInstance.finalResolution && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-900">Form Rejected</span>
                  </div>
                  <p className="text-sm text-red-800">
                    Rejected by {approvalInstance.finalResolution.resolvedBy} on{' '}
                    {new Date(approvalInstance.finalResolution.resolvedDate).toLocaleDateString()}
                  </p>
                  {approvalInstance.finalResolution.finalComments && (
                    <p className="text-sm text-red-700 mt-1">
                      Comments: {approvalInstance.finalResolution.finalComments}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Content */}
      <HRMSFormContainer
        formConfig={formConfig}
        initialData={form}
        mode="view"
        showFormInfo={false}
      >
        {formConfig.sections.map((section) => (
          <HRMSFormSection
            key={section.id}
            section={section}
            disabled={true}
          />
        ))}
      </HRMSFormContainer>
    </div>
  );
}