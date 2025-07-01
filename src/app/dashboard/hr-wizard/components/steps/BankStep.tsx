import React from 'react';
import { useFormContext, ControllerRenderProps, FieldValues } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HRWizardFormData } from '@/types/hr-wizard';

type BankAccountType = 'savings' | 'checking' | 'salary';

const BANK_ACCOUNT_TYPES = [
  { value: 'savings' as const, label: 'Savings' },
  { value: 'checking' as const, label: 'Checking' },
  { value: 'salary' as const, label: 'Salary' },
];

interface BankStepProps {}

type BankAccountFieldProps = {
  field: ControllerRenderProps<HRWizardFormData, `bankAccount.${string}`>;
};

const BankStep: React.FC<BankStepProps> = () => {
  const { control } = useFormContext<HRWizardFormData>();

  const renderField = (name: `bankAccount.${string}`, label: string, placeholder: string) => (
    <FormField
      control={control}
      name={name}
      render={({ field }: { field: ControllerRenderProps<HRWizardFormData, typeof name> }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Bank Account Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderField('bankAccount.accountHolderName', 'Account Holder Name', 'John Doe')}
        {renderField('bankAccount.bankName', 'Bank Name', 'e.g., Chase, Bank of America')}
        {renderField('bankAccount.accountNumber', 'Account Number', 'Enter account number')}
        {renderField('bankAccount.routingNumber', 'Routing Number', 'Enter routing number')}

        <FormField
          control={control}
          name="bankAccount.accountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BANK_ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {renderField('bankAccount.iban', 'IBAN (International Bank Account Number)', 'Enter IBAN if applicable')}
        {renderField('bankAccount.swiftCode', 'SWIFT/BIC Code', 'Enter SWIFT/BIC code if applicable')}
        {renderField('bankAccount.branchName', 'Branch Name', 'Enter branch name')}
        {renderField('bankAccount.branchAddress', 'Branch Address', 'Enter branch address')}
      </div>
    </div>
  );
};

export { BankStep };
