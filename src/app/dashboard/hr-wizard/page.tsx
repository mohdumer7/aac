'use client';

import { useHrWizard } from '@/hooks/useHrWizard';
import { useGetUserWizardDataQuery } from '@/services/endpoints/hrWizardApi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Loader2, Save, ChevronLeft, ChevronRight, Check, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { WizardSteps } from './components/WizardSteps';
import { FormField } from './components/FormField';
import { cn } from '@/lib/utils';

export default function HrWizardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  // Fetch user data
  const { data: userData, isLoading, error } = useGetUserWizardDataQuery(session?.user?.id || '', {
    skip: !session?.user?.id,
  });

  // Initialize wizard
  const {
    activeStep,
    setActiveStep,
    formMethods,
    isSubmitting,
    handleNext,
    handleBack,
    handleSaveDraft,
    handleSubmit,
    steps,
    currentStep,
    isLastStep
  } = useHrWizard({ 
    userId: session?.user?.id || '',
    initialData: userData 
  });

  // Handle save draft with loading state
  const handleSaveWithLoading = async () => {
    try {
      setIsSaving(true);
      await handleSaveDraft();
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to load user data');
      console.error('Error loading user data:', error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading your information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Onboarding</h1>
          <p className="text-gray-600">Complete your profile to get started with Acero Applications</p>
        </div>

        {/* Progress Steps */}
        <WizardSteps 
          steps={steps} 
          activeStep={activeStep} 
          onStepClick={setActiveStep} 
        />

        {/* Progress Bar */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(((activeStep + 1) / steps.length) * 100)}% Complete
            </span>
          </div>
          <Progress 
            value={(activeStep + 1) * (100 / steps.length)} 
            className="h-2 bg-gray-100" 
          />
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <FormProvider {...formMethods}>
            <form onSubmit={formMethods.handleSubmit(handleSubmit)}>
              <div className="p-6 md:p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">{steps[activeStep].title}</h2>
                  <p className="text-gray-600 mt-1">{steps[activeStep].description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {steps[activeStep].fields.map((field) => (
                    <FormField
                      key={field.id}
                      id={field.id}
                      label={field.label}
                      type={field.type}
                      placeholder={field.placeholder}
                      required={field.required}
                      options={field.options}
                      validation={field.validation}
                    />
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    {activeStep > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting || activeStep === 0}
                        className="w-full sm:w-auto"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous Step
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveWithLoading}
                      disabled={isSubmitting || isSaving}
                      className="w-full sm:w-auto"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Draft
                    </Button>
                    
                    <Button
                      type={isLastStep ? 'submit' : 'button'}
                      onClick={!isLastStep ? handleNext : undefined}
                      disabled={isSubmitting || isSaving}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isLastStep ? 'Submitting...' : 'Processing...'}
                        </>
                      ) : isLastStep ? (
                        <>
                          <FileCheck className="w-4 h-4 mr-2" />
                          Complete Onboarding
                        </>
                      ) : (
                        <>
                          Next Step
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
