import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { HRWizardFormData } from '@/types/hr-wizard';

const HEALTH_INSURANCE_PROVIDERS = [
  { value: 'provider1', label: 'Aetna' },
  { value: 'provider2', label: 'Blue Cross Blue Shield' },
  { value: 'provider3', label: 'Cigna' },
  { value: 'provider4', label: 'UnitedHealthcare' },
  { value: 'other', label: 'Other' },
];

const BENEFIT_TYPES = [
  { value: 'medical', label: 'Medical' },
  { value: 'dental', label: 'Dental' },
  { value: 'vision', label: 'Vision' },
  { value: 'life', label: 'Life Insurance' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'other', label: 'Other' },
];

const BenefitsStep: React.FC = () => {
  const { control, watch } = useFormContext<HRWizardFormData>();
  
  // Watch the benefits array to handle dynamic fields
  const benefits = watch('benefits') || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Benefits Enrollment</h3>
        <p className="text-sm text-muted-foreground">
          Configure employee benefits and insurance information
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Health Insurance</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="benefits.healthInsurance.provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Provider</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {HEALTH_INSURANCE_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="benefits.healthInsurance.policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter policy number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="benefits.healthInsurance.coverageStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coverage Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="benefits.healthInsurance.coverageEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coverage End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Additional Benefits</h4>
          <div className="space-y-4">
            <FormField
              control={control}
              name="benefits.hasDental"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Dental Coverage</FormLabel>
                    <FormDescription>
                      Employee is eligible for dental benefits
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="benefits.hasVision"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Vision Coverage</FormLabel>
                    <FormDescription>
                      Employee is eligible for vision benefits
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="benefits.hasLifeInsurance"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Life Insurance</FormLabel>
                    <FormDescription>
                      Employee is covered by life insurance
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="benefits.hasRetirementPlan"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Retirement Plan</FormLabel>
                    <FormDescription>
                      Employee is enrolled in retirement plan
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Beneficiaries</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="benefits.primaryBeneficiary.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Beneficiary Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="benefits.primaryBeneficiary.relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spouse, Child, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={control}
                name="benefits.secondaryBeneficiary.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Beneficiary Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="benefits.secondaryBeneficiary.relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spouse, Child, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { BenefitsStep };
