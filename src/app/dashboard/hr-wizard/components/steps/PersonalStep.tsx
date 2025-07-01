import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { WizardStepProps } from '../types';

export const PersonalStep: React.FC<WizardStepProps> = ({
  formMethods,
  onNext,
  onBack,
  onSaveDraft,
  isSubmitting = false,
  isLastStep = false,
  isFirstStep = false,
}) => {
  const { control, formState: { errors } } = formMethods;
  // Get nested errors for the personal step
  const personalErrors = errors.personal || {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Personal Information</h3>
        <p className="text-sm text-muted-foreground">
          Enter the employee's personal details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="personal.firstName"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="firstName">First Name *</Label>
              <FormControl>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...field}
                  className={personalErrors.firstName ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personal.lastName"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="lastName">Last Name *</Label>
              <FormControl>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...field}
                  className={personalErrors.lastName ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personal.email"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="email">Email *</Label>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  {...field}
                  className={personalErrors.email ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personal.phoneNumber"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <FormControl>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...field}
                  className={personalErrors.phoneNumber ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personal.dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <FormControl>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...field}
                  className={personalErrors.dateOfBirth ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personal.gender"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="gender">Gender</Label>
              <FormControl>
                <select
                  id="gender"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="personal.nationality"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="nationality">Nationality</Label>
              <FormControl>
                <Input
                  id="nationality"
                  placeholder="e.g., American, British, Indian"
                  {...field}
                  className={personalErrors.nationality ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="personal.maritalStatus"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <FormControl>
                <select
                  id="maritalStatus"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="">Select marital status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FormField
          control={control}
          name="personal.address"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="address">Address</Label>
              <FormControl>
                <Input
                  id="address"
                  placeholder="123 Main St, City, Country"
                  {...field}
                  className={personalErrors.address ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default PersonalStep;
