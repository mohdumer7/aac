import React from 'react';
import { CheckCircle, AlertCircle, FileText, User, Briefcase, FileDigit, FileSignature, FileCheck, FileClock, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn as classNames } from '@/lib/utils';

// Define WizardStepProps here to avoid the missing module error
interface WizardStepProps {
  formMethods: any;
  uploadDocument?: (file: File, docType: string) => Promise<void>;
  deleteDocument?: (documentUrl: string) => Promise<void>;
  isEditing?: boolean;
  isLastStep?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onSaveDraft?: () => Promise<boolean>;
  isFirstStep?: boolean;
  isSubmitting?: boolean;
  isSaving?: boolean;
}

interface ReviewSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  completed?: boolean;
  onEdit?: () => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({
  title,
  icon,
  children,
  completed = true,
  onEdit,
}) => {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between bg-muted/50 p-4">
        <div className="flex items-center space-x-3">
          <div className={classNames(
            'p-2 rounded-full',
            completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
          )}>
            {completed ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          </div>
          <h3 className="font-medium">{title}</h3>
        </div>
        {onEdit && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={onEdit}
            className="text-primary hover:text-primary/80"
          >
            Edit
          </Button>
        )}
      </div>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
};

interface ReviewFieldProps {
  label: string;
  value?: string | number | boolean | null;
  className?: string;
}

const ReviewField: React.FC<ReviewFieldProps> = ({ label, value, className }) => {
  if (value === undefined || value === null || value === '') return null;
  
  const displayValue = typeof value === 'boolean' 
    ? (value ? 'Yes' : 'No')
    : value;
  
  return (
    <div className={classNames('grid grid-cols-1 md:grid-cols-3 gap-4 py-2', className)}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="md:col-span-2 text-sm">
        {displayValue || <span className="text-muted-foreground">Not provided</span>}
      </dd>
    </div>
  );
};

export const ReviewStep: React.FC<WizardStepProps> = ({
  formMethods,
  onNext,
  onBack,
  onSaveDraft,
  isSubmitting = false,
  isLastStep = false,
  isFirstStep = false,
}) => {
  const { handleSubmit } = formMethods;
  // Get form data from formMethods instead of expecting it as a separate prop
  const formData = formMethods.getValues();
  
  // Format date fields
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Handle edit section
  const handleEditSection = (stepIndex: number) => {
    // This would be handled by the parent component to navigate to the specific step
    console.log('Edit section:', stepIndex);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="mt-3 text-2xl font-semibold">Review and Submit</h2>
        <p className="mt-2 text-muted-foreground">
          Please review all the information before submitting.
        </p>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <ReviewSection
          title="Personal Information"
          icon={<User className="h-5 w-5" />}
          completed={!!(formData.firstName && formData.lastName)}
          onEdit={() => handleEditSection(0)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReviewField label="First Name" value={formData.firstName} />
              <ReviewField label="Last Name" value={formData.lastName} />
              <ReviewField label="Email" value={formData.email} />
              <ReviewField label="Phone Number" value={formData.phoneNumber} />
              <ReviewField label="Date of Birth" value={formatDate(formData.dateOfBirth)} />
              <ReviewField label="Gender" value={formData.gender} />
              <ReviewField label="Nationality" value={formData.nationality} />
              <ReviewField label="Marital Status" value={formData.maritalStatus} />
            </div>
            <ReviewField label="Address" value={formData.address} className="col-span-full" />
          </div>
        </ReviewSection>

        {/* Employment Details */}
        <ReviewSection
          title="Employment Details"
          icon={<Briefcase className="h-5 w-5" />}
          completed={!!(formData.position && formData.department)}
          onEdit={() => handleEditSection(1)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReviewField label="Employee ID" value={formData.empId} />
              <ReviewField label="Department" value={formData.department} />
              <ReviewField label="Position" value={formData.position} />
              <ReviewField label="Employment Type" value={formData.employmentType} />
              <ReviewField label="Hire Date" value={formatDate(formData.hireDate)} />
              <ReviewField label="Reports To" value={formData.reportsTo} />
            </div>
            
            {formData.workSchedule && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Work Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReviewField label="Work Days" value={formData.workSchedule.workDays} />
                  <ReviewField label="Work Hours" value={formData.workSchedule.workHours} />
                  <ReviewField 
                    label="Overtime Eligible" 
                    value={formData.workSchedule.overtimeEligible ? 'Yes' : 'No'} 
                  />
                </div>
              </div>
            )}
            
            {formData.compensation && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Compensation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReviewField 
                    label="Base Salary" 
                    value={
                      formData.compensation.salary 
                        ? `${formData.compensation.currency || '$'}${formData.compensation.salary}`
                        : ''
                    } 
                  />
                  <ReviewField 
                    label="Payment Frequency" 
                    value={formData.compensation.paymentFrequency} 
                  />
                </div>
              </div>
            )}
          </div>
        </ReviewSection>

        {/* Documents */}
        <ReviewSection
          title="Documents"
          icon={<FileText className="h-5 w-5" />}
          completed={Array.isArray(formData.documents) && formData.documents.length > 0}
          onEdit={() => handleEditSection(5)}
        >
          {Array.isArray(formData.documents) && formData.documents.length > 0 ? (
            <div className="space-y-2">
              {formData.documents.map((doc: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded</p>
          )}
        </ReviewSection>

        {/* Terms and Conditions */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-muted-foreground">
                By submitting this form, you confirm that all the information provided is accurate and complete to the best of your knowledge. 
                You understand that providing false information may result in termination of employment.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="terms"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      required
                    />
                  </div>
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the terms and conditions outlined above
                  </label>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="privacy"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      required
                    />
                  </div>
                  <label htmlFor="privacy" className="text-sm text-muted-foreground">
                    I consent to the processing of my personal data in accordance with the privacy policy
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewStep;

// Helper function for conditional class names
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
