'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  LockIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';

export default function WorkflowNavigation() {
  const { 
    workflowType, 
    currentStepIndex, 
    steps, 
    navigateToStep, 
    isStepAccessible 
  } = useWorkflow();

  if (!workflowType || steps.length === 0) {
    return null;
  }

  const currentStep = steps[currentStepIndex];
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < steps.length - 1 && isStepAccessible(currentStepIndex + 1);

  const getStepIcon = (step: any) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <LockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadgeVariant = (step: any) => {
    switch (step.status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span>Workflow Progress</span>
          <Badge variant="outline">{workflowType}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Step Progress */}
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.stepIndex}>
              <div className="min-w-[200px]">
                <Button
                  variant={step.stepIndex === currentStepIndex ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigateToStep(step.stepIndex)}
                  disabled={!isStepAccessible(step.stepIndex)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{index + 1}</span>
                    {getStepIcon(step)}
                    <span className="truncate">{step.stepName}</span>
                  </div>
                </Button>
                <div className="mt-1 text-center">
                  <Badge variant={getStepBadgeVariant(step)} className="text-xs">
                    {step.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRightIcon className="h-4 w-4 text-gray-400 mx-2 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Current Step Info */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div>
            <h4 className="font-medium">
              Step {currentStepIndex + 1}: {currentStep?.stepName}
            </h4>
            <p className="text-sm text-gray-600">
              {currentStep?.status === 'completed' ? 'Completed' : 'In Progress'}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            {canGoBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToStep(currentStepIndex - 1)}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            
            {canGoForward && (
              <Button
                size="sm"
                onClick={() => navigateToStep(currentStepIndex + 1)}
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Step Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Progress: {steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed
        </div>
      </CardContent>
    </Card>
  );
}