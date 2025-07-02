'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  CircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PlayIcon,
  MapPinIcon
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
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  const getStepIcon = (step: any, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircleIcon className="h-6 w-6 text-white" />;
    } else if (step.status === 'in_progress') {
      return <PlayIcon className="h-6 w-6 text-white" />;
    } else {
      return <CircleIcon className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStepCircleStyle = (step: any, index: number) => {
    if (step.status === 'completed') {
      return 'bg-green-500 border-green-500';
    } else if (step.status === 'in_progress') {
      return 'bg-blue-500 border-blue-500';
    } else if (isStepAccessible(index)) {
      return 'bg-gray-200 border-gray-300 hover:bg-gray-300';
    } else {
      return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Progress Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-blue-600" />
                {workflowType} Workflow
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStepIndex + 1} of {steps.length}: {currentStep?.stepName}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {completedSteps}/{steps.length} Complete
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-6">
          {/* Desktop View - Horizontal Steps */}
          <div className="hidden md:flex items-center justify-between relative">
            {steps.map((step, index) => (
              <React.Fragment key={step.stepIndex}>
                <div className="flex flex-col items-center min-w-[120px]">
                  {/* Step Circle */}
                  <button
                    onClick={() => navigateToStep(step.stepIndex)}
                    disabled={!isStepAccessible(step.stepIndex)}
                    className={`
                      relative w-12 h-12 rounded-full border-2 flex items-center justify-center
                      transition-all duration-200 transform hover:scale-105
                      ${getStepCircleStyle(step, index)}
                      ${!isStepAccessible(step.stepIndex) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                      ${step.stepIndex === currentStepIndex ? 'ring-4 ring-blue-200' : ''}
                    `}
                  >
                    {getStepIcon(step, index)}
                    
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </button>
                  
                  {/* Step Label */}
                  <div className="mt-3 text-center">
                    <p className={`
                      text-sm font-medium
                      ${step.stepIndex === currentStepIndex ? 'text-blue-600' : 'text-gray-700'}
                    `}>
                      {step.stepName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {step.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 relative">
                    <div className="absolute inset-0 bg-gray-200"></div>
                    <div 
                      className={`absolute inset-0 bg-green-500 transition-all duration-300 ${
                        step.status === 'completed' ? 'w-full' : 'w-0'
                      }`}
                    ></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile View - Vertical Steps */}
          <div className="md:hidden space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.stepIndex}
                className={`
                  flex items-center p-4 rounded-lg border transition-all
                  ${step.stepIndex === currentStepIndex ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}
                `}
              >
                <button
                  onClick={() => navigateToStep(step.stepIndex)}
                  disabled={!isStepAccessible(step.stepIndex)}
                  className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center mr-4
                    ${getStepCircleStyle(step, index)}
                    ${!isStepAccessible(step.stepIndex) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                >
                  {getStepIcon(step, index)}
                </button>
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {index + 1}. {step.stepName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {step.status.replace('_', ' ')}
                  </p>
                </div>
                
                {step.stepIndex === currentStepIndex && (
                  <Badge className="bg-blue-500">Current</Badge>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <div>
              {canGoBack && (
                <Button
                  variant="outline"
                  onClick={() => navigateToStep(currentStepIndex - 1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Previous Step
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {currentStep?.status === 'completed' ? 'Step completed' : 'Complete this step to continue'}
              </p>
            </div>

            <div>
              {canGoForward && (
                <Button
                  onClick={() => navigateToStep(currentStepIndex + 1)}
                  className="flex items-center gap-2"
                >
                  Next Step
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}