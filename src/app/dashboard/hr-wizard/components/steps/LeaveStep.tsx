import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { HRWizardFormData } from '@/types/hr-wizard';
import { format } from 'date-fns';

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'other', label: 'Other' },
];

const LeaveStep: React.FC = () => {
  const { control, watch } = useFormContext<HRWizardFormData>();
  const leaveRequests = watch('leave.leaveRequests') || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Leave Management</h3>
        <p className="text-sm text-muted-foreground">
          Configure employee leave balances and requests
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Leave Balances</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={control}
              name="leave.annualLeaveBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Leave (days)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="leave.sickLeaveBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sick Leave (days)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="leave.unpaidLeaveBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unpaid Leave (days)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Leave Requests</h4>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => {
                // Handle adding new leave request
                // This would be implemented with a form array in a real app
              }}
            >
              + Add Request
            </button>
          </div>

          {leaveRequests.length > 0 ? (
            <div className="border rounded-md divide-y">
              {leaveRequests.map((request, index) => (
                <div key={index} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{request.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.startDate), 'MMM d, yyyy')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                    </p>
                    {request.status && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="text-sm text-primary hover:underline"
                      onClick={() => {
                        // Handle edit leave request
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm text-destructive hover:underline"
                      onClick={() => {
                        // Handle delete leave request
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">No leave requests found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add a new leave request to get started
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Leave Policy</h4>
          <FormField
            control={control}
            name="leave.leavePolicy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Notes</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Any special leave policies or notes..."
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

export { LeaveStep };
