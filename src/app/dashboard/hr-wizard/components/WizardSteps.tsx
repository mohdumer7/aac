'use client';

import { Check, Clock, User, Briefcase, FileText, FileCheck, Shield, CreditCard, FileSignature, Calendar, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WizardStepsProps {
  steps: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  activeStep: number;
  onStepClick: (step: number) => void;
}

const stepIcons = [
  { icon: User, label: 'Personal' },
  { icon: Briefcase, label: 'Employment' },
  { icon: FileText, label: 'Visa' },
  { icon: FileCheck, label: 'ID' },
  { icon: Shield, label: 'Benefits' },
  { icon: FileSignature, label: 'Documents' },
  { icon: Calendar, label: 'Leave' },
  { icon: Landmark, label: 'Bank' },
  { icon: Check, label: 'Review' }
];

export function WizardSteps({ steps, activeStep, onStepClick }: WizardStepsProps) {
  return (
    <div className="mb-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between overflow-x-auto pb-4">
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isCompleted = activeStep > index;
          const Icon = stepIcons[index]?.icon || Clock;
          
          return (
            <div key={step.id} className="flex flex-col items-center px-2">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full mb-2 transition-all duration-200',
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                    : isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-white border-2 border-gray-300 text-gray-500',
                  'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                )}
                aria-label={`Go to ${step.title} step`}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </button>
              <span className={cn(
                'text-xs font-medium text-center whitespace-nowrap',
                isActive ? 'text-blue-600 font-semibold' : 'text-gray-500',
                'transition-colors duration-200'
              )}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    'hidden sm:block absolute top-6 left-1/2 w-full h-1 -z-10',
                    isCompleted ? 'bg-green-500' : 'bg-gray-200',
                    'transition-colors duration-300'
                  )} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
