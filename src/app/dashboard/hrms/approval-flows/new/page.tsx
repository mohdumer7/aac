'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  PlusIcon, 
  TrashIcon, 
  UserIcon,
  UsersIcon,
  BuildingIcon,
  SettingsIcon,
  SaveIcon,
  WorkflowIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  useCreateApprovalFlowMutation,
  useGetAvailableApproversQuery,
  useGetDepartmentsQuery,
  useGetRolesQuery
} from '@/services/endpoints/hrmsApi';
import { HRMS_FORM_CONFIG, HRMSFormTypes } from '@/types/hrms';

interface ApprovalStep {
  stepOrder: number;
  stepName: string;
  stepDescription?: string;
  approverType: 'specific_user' | 'role_based' | 'department_head' | 'reporting_manager';
  specificUsers?: string[];
  requiredRoles?: string[];
  isRequired: boolean;
  allowParallelApproval: boolean;
  requireAllApprovers: boolean;
  timeoutDays?: number;
  notifyOnSubmission: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
}

export default function NewApprovalFlowPage() {
  const router = useRouter();
  const [steps, setSteps] = useState<ApprovalStep[]>([]);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      flowName: '',
      flowDescription: '',
      formType: '',
      isDefault: false,
      applicableDepartments: [],
      settings: {
        allowWithdrawal: true,
        allowDelegation: true,
        requireComments: true,
        autoArchive: true,
        maxProcessingDays: 30
      }
    }
  });

  // API hooks
  const [createFlow, { isLoading: isCreating }] = useCreateApprovalFlowMutation();
  const { data: approversData } = useGetAvailableApproversQuery({});
  const { data: departmentsData } = useGetDepartmentsQuery({});
  const { data: rolesData } = useGetRolesQuery({});

  const approvers = approversData?.data || [];
  const departments = departmentsData?.data || [];
  const roles = rolesData?.data || [];

  const addStep = () => {
    const newStep: ApprovalStep = {
      stepOrder: steps.length + 1,
      stepName: `Approval Step ${steps.length + 1}`,
      stepDescription: '',
      approverType: 'specific_user',
      specificUsers: [],
      requiredRoles: [],
      isRequired: true,
      allowParallelApproval: false,
      requireAllApprovers: true,
      timeoutDays: 7,
      notifyOnSubmission: true,
      notifyOnApproval: true,
      notifyOnRejection: true
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    // Reorder step numbers
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      stepOrder: i + 1
    }));
    setSteps(reorderedSteps);
  };

  const updateStep = (index: number, updates: Partial<ApprovalStep>) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], ...updates };
    setSteps(updatedSteps);
  };

  const onSubmit = async (data: any) => {
    if (steps.length === 0) {
      toast.error('Please add at least one approval step');
      return;
    }

    // Validate steps
    for (const step of steps) {
      if (!step.stepName.trim()) {
        toast.error(`Step ${step.stepOrder} must have a name`);
        return;
      }
      
      if (step.approverType === 'specific_user' && (!step.specificUsers || step.specificUsers.length === 0)) {
        toast.error(`Step ${step.stepOrder} must have at least one approver selected`);
        return;
      }
      
      if (step.approverType === 'role_based' && (!step.requiredRoles || step.requiredRoles.length === 0)) {
        toast.error(`Step ${step.stepOrder} must have at least one role selected`);
        return;
      }
    }

    try {
      const flowData = {
        ...data,
        steps,
        organisation: 'default' // This should come from session/context
      };

      const result = await createFlow(flowData).unwrap();
      
      if (result.success) {
        toast.success('Approval flow created successfully!');
        router.push(`/dashboard/hrms/approval-flows/${result.data._id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create approval flow');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <WorkflowIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Approval Flow</h1>
          <p className="text-muted-foreground">
            Design a new approval workflow for HR forms
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the basic settings for your approval flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flowName">Flow Name *</Label>
                <Input
                  id="flowName"
                  placeholder="e.g., Standard Manpower Approval"
                  {...register('flowName', { required: 'Flow name is required' })}
                />
                {errors.flowName && (
                  <p className="text-sm text-destructive">{errors.flowName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="formType">Form Type *</Label>
                <Select onValueChange={(value) => setValue('formType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select form type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(HRMSFormTypes).map((formType) => (
                      <SelectItem key={formType} value={formType}>
                        {HRMS_FORM_CONFIG[formType]?.title || formType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flowDescription">Description</Label>
              <Textarea
                id="flowDescription"
                placeholder="Describe when and how this flow should be used"
                {...register('flowDescription')}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                onCheckedChange={(checked) => setValue('isDefault', checked as boolean)}
              />
              <Label htmlFor="isDefault">
                Set as default flow for this form type
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Approval Steps */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Approval Steps</CardTitle>
                <CardDescription>
                  Define the approval workflow steps and approvers
                </CardDescription>
              </div>
              <Button type="button" onClick={addStep} variant="outline">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8">
                <WorkflowIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No approval steps defined</h3>
                <p className="text-muted-foreground mb-4">
                  Add approval steps to create your workflow
                </p>
                <Button type="button" onClick={addStep}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Step
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <Card key={index} className="border-2">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Step {step.stepOrder}</Badge>
                          <CardTitle className="text-lg">{step.stepName}</CardTitle>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Step Name</Label>
                          <Input
                            value={step.stepName}
                            onChange={(e) => updateStep(index, { stepName: e.target.value })}
                            placeholder="Enter step name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Approver Type</Label>
                          <Select
                            value={step.approverType}
                            onValueChange={(value: any) => updateStep(index, { approverType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="specific_user">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4" />
                                  Specific Users
                                </div>
                              </SelectItem>
                              <SelectItem value="role_based">
                                <div className="flex items-center gap-2">
                                  <UsersIcon className="h-4 w-4" />
                                  Role Based
                                </div>
                              </SelectItem>
                              <SelectItem value="department_head">
                                <div className="flex items-center gap-2">
                                  <BuildingIcon className="h-4 w-4" />
                                  Department Head
                                </div>
                              </SelectItem>
                              <SelectItem value="reporting_manager">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="h-4 w-4" />
                                  Reporting Manager
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {step.approverType === 'specific_user' && (
                        <div className="space-y-2">
                          <Label>Select Approvers</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                            {approvers.map((approver: any) => (
                              <div key={approver._id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`approver-${index}-${approver._id}`}
                                  checked={step.specificUsers?.includes(approver._id)}
                                  onCheckedChange={(checked) => {
                                    const currentUsers = step.specificUsers || [];
                                    const updatedUsers = checked
                                      ? [...currentUsers, approver._id]
                                      : currentUsers.filter(id => id !== approver._id);
                                    updateStep(index, { specificUsers: updatedUsers });
                                  }}
                                />
                                <Label 
                                  htmlFor={`approver-${index}-${approver._id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {approver.displayName || `${approver.firstName} ${approver.lastName}`}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.approverType === 'role_based' && (
                        <div className="space-y-2">
                          <Label>Select Roles</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {roles.map((role: any) => (
                              <div key={role._id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`role-${index}-${role._id}`}
                                  checked={step.requiredRoles?.includes(role._id)}
                                  onCheckedChange={(checked) => {
                                    const currentRoles = step.requiredRoles || [];
                                    const updatedRoles = checked
                                      ? [...currentRoles, role._id]
                                      : currentRoles.filter(id => id !== role._id);
                                    updateStep(index, { requiredRoles: updatedRoles });
                                  }}
                                />
                                <Label 
                                  htmlFor={`role-${index}-${role._id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {role.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Step Description</Label>
                        <Textarea
                          value={step.stepDescription || ''}
                          onChange={(e) => updateStep(index, { stepDescription: e.target.value })}
                          placeholder="Describe what this step involves"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Timeout (Days)</Label>
                          <Input
                            type="number"
                            value={step.timeoutDays || ''}
                            onChange={(e) => updateStep(index, { timeoutDays: parseInt(e.target.value) || undefined })}
                            placeholder="7"
                            min="1"
                            max="30"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Step Options</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${index}`}
                              checked={step.isRequired}
                              onCheckedChange={(checked) => updateStep(index, { isRequired: checked as boolean })}
                            />
                            <Label htmlFor={`required-${index}`} className="text-sm">
                              Required step
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`parallel-${index}`}
                              checked={step.allowParallelApproval}
                              onCheckedChange={(checked) => updateStep(index, { allowParallelApproval: checked as boolean })}
                            />
                            <Label htmlFor={`parallel-${index}`} className="text-sm">
                              Allow parallel approval
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`notify-submission-${index}`}
                              checked={step.notifyOnSubmission}
                              onCheckedChange={(checked) => updateStep(index, { notifyOnSubmission: checked as boolean })}
                            />
                            <Label htmlFor={`notify-submission-${index}`} className="text-sm">
                              Notify on submission
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`notify-approval-${index}`}
                              checked={step.notifyOnApproval}
                              onCheckedChange={(checked) => updateStep(index, { notifyOnApproval: checked as boolean })}
                            />
                            <Label htmlFor={`notify-approval-${index}`} className="text-sm">
                              Notify on approval
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flow Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Flow Settings
            </CardTitle>
            <CardDescription>
              Configure additional flow behavior and options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maximum Processing Days</Label>
                <Input
                  type="number"
                  defaultValue={30}
                  {...register('settings.maxProcessingDays')}
                  min="1"
                  max="90"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Flow Options</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowWithdrawal"
                    defaultChecked={true}
                    onCheckedChange={(checked) => setValue('settings.allowWithdrawal', checked as boolean)}
                  />
                  <Label htmlFor="allowWithdrawal" className="text-sm">
                    Allow form withdrawal
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowDelegation"
                    defaultChecked={true}
                    onCheckedChange={(checked) => setValue('settings.allowDelegation', checked as boolean)}
                  />
                  <Label htmlFor="allowDelegation" className="text-sm">
                    Allow delegation
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireComments"
                    defaultChecked={true}
                    onCheckedChange={(checked) => setValue('settings.requireComments', checked as boolean)}
                  />
                  <Label htmlFor="requireComments" className="text-sm">
                    Require comments on rejection
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoArchive"
                    defaultChecked={true}
                    onCheckedChange={(checked) => setValue('settings.autoArchive', checked as boolean)}
                  />
                  <Label htmlFor="autoArchive" className="text-sm">
                    Auto-archive completed flows
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/hrms/approval-flows')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating && (
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-b-2 border-current" />
            )}
            <SaveIcon className="h-4 w-4 mr-2" />
            Create Flow
          </Button>
        </div>
      </form>
    </div>
  );
}