import React from 'react';
import { Calendar, FileText, Globe, MapPin, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { WizardStepProps } from '../types';

export const VisaStep: React.FC<WizardStepProps> = ({
  formMethods,
  onNext,
  onBack,
  onSaveDraft,
  isSubmitting = false,
  isLastStep = false,
  isFirstStep = false,
}) => {
  const { control, watch, setValue, formState: { errors } } = formMethods;
  const visaType = watch('visa.type');
  const requiresVisaSponsorship = watch('visa.requiresSponsorship');

  // Set default values for visa fields when country changes
  React.useEffect(() => {
    if (!visaType) return;
    
    // Set default values based on visa type
    switch (visaType) {
      case 'employment':
        setValue('visa.sponsorshipType', 'employer', { shouldDirty: true });
        break;
      case 'family':
        setValue('visa.sponsorshipType', 'family', { shouldDirty: true });
        break;
      case 'student':
        setValue('visa.sponsorshipType', 'institution', { shouldDirty: true });
        break;
      default:
        break;
    }
  }, [visaType, setValue]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Visa & Work Permit Information</h3>
        <p className="text-sm text-muted-foreground">
          Provide details about the employee's visa and work authorization status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Visa Status */}
        <div className="md:col-span-2">
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Current Visa Status
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="visa.status"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="visaStatus">Visa Status *</Label>
                  <FormControl>
                    <select
                      id="visaStatus"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Select status</option>
                      <option value="citizen">Citizen</option>
                      <option value="permanent_resident">Permanent Resident</option>
                      <option value="work_visa">Work Visa</option>
                      <option value="dependent_visa">Dependent Visa</option>
                      <option value="student_visa">Student Visa</option>
                      <option value="tourist_visa">Tourist Visa</option>
                      <option value="no_visa">No Visa</option>
                      <option value="other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="visa.country"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="visaCountry">Country of Issue *</Label>
                  <FormControl>
                    <select
                      id="visaCountry"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Select country</option>
                      <option value="AE">United Arab Emirates</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="QA">Qatar</option>
                      <option value="KW">Kuwait</option>
                      <option value="OM">Oman</option>
                      <option value="BH">Bahrain</option>
                      <option value="IN">India</option>
                      <option value="PK">Pakistan</option>
                      <option value="PH">Philippines</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="visa.number"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="visaNumber">Visa/Residence Permit Number</Label>
                  <FormControl>
                    <Input
                      id="visaNumber"
                      placeholder="e.g., 1234567890"
                      {...field}
                      className={errors.visa?.number ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="visa.issueDate"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="visaIssueDate">Issue Date</Label>
                  <FormControl>
                    <Input
                      id="visaIssueDate"
                      type="date"
                      {...field}
                      className={errors.visa?.issueDate ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="visa.expiryDate"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="visaExpiryDate">Expiry Date *</Label>
                  <FormControl>
                    <Input
                      id="visaExpiryDate"
                      type="date"
                      {...field}
                      className={errors.visa?.expiryDate ? "border-red-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Visa Sponsorship */}
        <div className="md:col-span-2 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Visa Sponsorship
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="visa.requiresSponsorship"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="requiresSponsorship">Requires Visa Sponsorship? *</Label>
                  <FormControl>
                    <select
                      id="requiresSponsorship"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                      value={field.value ? 'yes' : 'no'}
                      onChange={(e) => field.onChange(e.target.value === 'yes')}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requiresVisaSponsorship && (
              <>
                <FormField
                  control={control}
                  name="visa.sponsorshipType"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="sponsorshipType">Sponsorship Type *</Label>
                      <FormControl>
                        <select
                          id="sponsorshipType"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Select type</option>
                          <option value="employer">Employer Sponsorship</option>
                          <option value="family">Family Sponsorship</option>
                          <option value="self">Self-Sponsored</option>
                          <option value="institution">Educational Institution</option>
                          <option value="other">Other</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="visa.sponsorName"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="sponsorName">Sponsor Name *</Label>
                      <FormControl>
                        <Input
                          id="sponsorName"
                          placeholder="e.g., Company Name or Person's Name"
                          {...field}
                          className={errors.visa?.sponsorName ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="visa.sponsorContact"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="sponsorContact">Sponsor Contact</Label>
                      <FormControl>
                        <Input
                          id="sponsorContact"
                          placeholder="Email or phone number"
                          {...field}
                          className={errors.visa?.sponsorContact ? "border-red-500" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </div>

        {/* Visa History */}
        <div className="md:col-span-2 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Visa History
          </h4>
          <div className="space-y-4">
            <FormField
              control={control}
              name="visa.previousVisas"
              render={({ field }) => (
                <FormItem>
                  <Label>Previous Visas (if any)</Label>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="List any previous visas held in this country"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="visa.visaRenewalRequired"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="visaRenewalRequired"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    <Label htmlFor="visaRenewalRequired" className="text-sm font-medium">
                      Visa Renewal Required
                    </Label>
                  </div>
                  <FormDescription className="text-xs">
                    Check if this visa will need to be renewed in the future
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div className="md:col-span-2 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Additional Notes
          </h4>
          <FormField
            control={control}
            name="visa.notes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Any additional information about the visa or work permit..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default VisaStep;
