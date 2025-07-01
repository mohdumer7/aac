import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { WizardStepProps } from '../types';

export const EmploymentStep: React.FC<WizardStepProps> = ({
  formMethods,
  onNext,
  onBack,
  onSaveDraft,
  isSubmitting = false,
  isLastStep = false,
  isFirstStep = false,
}) => {
  const { control, formState: { errors } } = formMethods;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Employment Details</h3>
        <p className="text-sm text-muted-foreground">
          Enter the employee's employment information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="empId"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="empId">Employee ID *</Label>
              <FormControl>
                <Input
                  id="empId"
                  placeholder="EMP-001"
                  {...field}
                  className={errors.empId ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="department">Department *</Label>
              <FormControl>
                <select
                  id="department"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="">Select department</option>
                  <option value="hr">Human Resources</option>
                  <option value="it">Information Technology</option>
                  <option value="finance">Finance</option>
                  <option value="marketing">Marketing</option>
                  <option value="sales">Sales</option>
                  <option value="operations">Operations</option>
                  <option value="customer-service">Customer Service</option>
                  <option value="rnd">Research & Development</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="position">Job Title *</Label>
              <FormControl>
                <Input
                  id="position"
                  placeholder="e.g., Software Engineer"
                  {...field}
                  className={errors.position ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="employmentType">Employment Type *</Label>
              <FormControl>
                <select
                  id="employmentType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="">Select employment type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="temporary">Temporary</option>
                  <option value="internship">Internship</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="hireDate"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="hireDate">Hire Date *</Label>
              <FormControl>
                <Input
                  id="hireDate"
                  type="date"
                  {...field}
                  className={errors.hireDate ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="reportsTo"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="reportsTo">Reports To</Label>
              <FormControl>
                <Input
                  id="reportsTo"
                  placeholder="Manager's name"
                  {...field}
                  className={errors.reportsTo ? "border-red-500" : ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Work Schedule</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="workSchedule.workDays"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="workDays">Work Days</Label>
                <FormControl>
                  <select
                    id="workDays"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="">Select work days</option>
                    <option value="mon-fri">Monday - Friday</option>
                    <option value="sun-thu">Sunday - Thursday</option>
                    <option value="mon-sat">Monday - Saturday</option>
                    <option value="shift">Shift Work</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="workSchedule.workHours"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="workHours">Work Hours</Label>
                <FormControl>
                  <Input
                    id="workHours"
                    placeholder="e.g., 9:00 AM - 6:00 PM"
                    {...field}
                    className={errors.workSchedule?.workHours ? "border-red-500" : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="workSchedule.overtimeEligible"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="overtimeEligible"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <Label htmlFor="overtimeEligible" className="text-sm font-medium">
                    Overtime Eligible
                  </Label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Compensation</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={control}
            name="compensation.salary"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="salary">Base Salary</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="salary"
                    type="number"
                    className="pl-8"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    {...field}
                    className={errors.compensation?.salary ? "border-red-500" : ""}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="compensation.paymentFrequency"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                <FormControl>
                  <select
                    id="paymentFrequency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="">Select frequency</option>
                    <option value="hourly">Hourly</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="semi-monthly">Semi-monthly</option>
                    <option value="monthly">Monthly</option>
                    <option value="annually">Annually</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="compensation.currency"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="currency">Currency</Label>
                <FormControl>
                  <select
                    id="currency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
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

export default EmploymentStep;
