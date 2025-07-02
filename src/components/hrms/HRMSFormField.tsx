'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, UploadIcon } from 'lucide-react';
import { format } from 'date-fns';
import { HRMSFormField as HRMSFormFieldType } from '@/types/hrms';

interface HRMSFormFieldProps {
  field: HRMSFormFieldType;
  disabled?: boolean;
}

// Helper function to safely extract display value from possibly nested objects like users
const extractSafeDisplayValue = (value: any): string => {
  // Return directly if value is a primitive type
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  
  // If it's a Date object, format it
  if (value instanceof Date) return value.toLocaleDateString();
  
  // Handle user objects - extract the most suitable display property
  if (typeof value === 'object') {
    // Try common user display fields
    if (value.displayName) return value.displayName;
    if (value.userName) return value.userName;
    if (value.email) return value.email;
    if (value.firstName && value.lastName) return `${value.firstName} ${value.lastName}`;
    if (value.firstName) return value.firstName;
    if (value.name) return value.name;
    
    // If it has an _id, it's likely a reference object that hasn't been properly handled
    if (value._id) return '[Object Reference]';
    
    // For arrays, join the display values of items
    if (Array.isArray(value)) {
      return value.map(item => extractSafeDisplayValue(item)).join(', ');
    }
    
    // For other objects with a toString method, use it
    if (value.toString && value.toString !== Object.prototype.toString) {
      const stringValue = value.toString();
      if (stringValue !== '[object Object]') return stringValue;
    }
  }
  
  // Default case - should avoid getting here
  return '[Complex Object]';
};

export default function HRMSFormField({ field, disabled = false }: HRMSFormFieldProps) {
  const { control, formState: { errors }, watch } = useFormContext();
  
  const error = errors[field.name];
  const watchedValues = watch();

  // Check if field should be shown based on dependencies
  const shouldShow = React.useMemo(() => {
    if (!field.showIf) return !field.hidden;
    return field.showIf(watchedValues) && !field.hidden;
  }, [field.showIf, field.hidden, watchedValues]);

  if (!shouldShow) return null;

  // Function to safely render any field value that might be a user object
  const getSafeFieldValue = (value: any) => {
    if (disabled && value !== null && value !== undefined && typeof value === 'object') {
      return extractSafeDisplayValue(value);
    }
    return value;
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              pattern: field.validation?.pattern ? {
                value: new RegExp(field.validation.pattern),
                message: field.validation.errorMessage || `Invalid ${field.label.toLowerCase()}`
              } : undefined,
              minLength: field.validation?.min ? {
                value: field.validation.min,
                message: `${field.label} must be at least ${field.validation.min} characters`
              } : undefined,
              maxLength: field.validation?.max ? {
                value: field.validation.max,
                message: `${field.label} must be no more than ${field.validation.max} characters`
              } : undefined
            }}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                type={field.type}
                placeholder={field.placeholder}
                disabled={disabled || field.disabled}
                className={cn(error && "border-destructive")}
                value={getSafeFieldValue(controllerField.value)}
              />
            )}
          />
        );

      case 'number':
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              min: field.validation?.min ? {
                value: field.validation.min,
                message: `${field.label} must be at least ${field.validation.min}`
              } : undefined,
              max: field.validation?.max ? {
                value: field.validation.max,
                message: `${field.label} must be no more than ${field.validation.max}`
              } : undefined
            }}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                type="number"
                placeholder={field.placeholder}
                disabled={disabled || field.disabled}
                className={cn(error && "border-destructive")}
                onChange={(e) => {
                  // Always return a number (or null) to maintain controlled status
                  const value = e.target.value === '' ? null : Number(e.target.value);
                  controllerField.onChange(value);
                }}
                value={getSafeFieldValue(controllerField.value)}
              />
            )}
          />
        );

      case 'textarea':
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false,
              minLength: field.validation?.min ? {
                value: field.validation.min,
                message: `${field.label} must be at least ${field.validation.min} characters`
              } : undefined,
              maxLength: field.validation?.max ? {
                value: field.validation.max,
                message: `${field.label} must be no more than ${field.validation.max} characters`
              } : undefined
            }}
            render={({ field: controllerField }) => (
              <Textarea
                {...controllerField}
                placeholder={field.placeholder}
                disabled={disabled || field.disabled}
                className={cn(
                  "min-h-[100px]",
                  error && "border-destructive"
                )}
                value={getSafeFieldValue(controllerField.value)}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false
            }}
            render={({ field: controllerField }) => {
              // For view mode, display the label instead of the value
              if (disabled) {
                // Find the option that matches the current value
                const selectedOption = field.options?.find(option => option.value === controllerField.value);
                return (
                  <div className="p-2 border rounded bg-muted/30">
                    {selectedOption ? selectedOption.label : (controllerField.value || '—')}
                  </div>
                );
              }
              
              // For edit mode, use the regular select component
              return (
                <Select
                  onValueChange={controllerField.onChange}
                  value={typeof controllerField.value === 'object' && disabled ? 
                    extractSafeDisplayValue(controllerField.value) : (controllerField.value || '')}
                  disabled={field.disabled}
                >
                  <SelectTrigger className={cn(error && "border-destructive")}>
                    <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
        );

      case 'checkbox':
        return (
          <Controller
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.name}
                  checked={controllerField.value}
                  onCheckedChange={controllerField.onChange}
                  disabled={disabled || field.disabled}
                />
                <Label 
                  htmlFor={field.name}
                  className="text-sm font-normal cursor-pointer"
                >
                  {field.label}
                </Label>
              </div>
            )}
          />
        );

      case 'radio':
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false
            }}
            render={({ field: controllerField }) => (
              <RadioGroup
                onValueChange={controllerField.onChange}
                value={controllerField.value}
                disabled={disabled || field.disabled}
                className="flex flex-col space-y-2"
              >
                {field.options?.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} />
                    <Label htmlFor={`${field.name}-${option.value}`} className="font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        );

      case 'date':
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false
            }}
            render={({ field: controllerField }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !controllerField.value && "text-muted-foreground",
                      error && "border-destructive"
                    )}
                    disabled={disabled || field.disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {controllerField.value ? (
                      typeof controllerField.value === 'object' && !(controllerField.value instanceof Date) ? 
                        extractSafeDisplayValue(controllerField.value) :
                        format(new Date(controllerField.value), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={controllerField.value ? new Date(controllerField.value) : undefined}
                    onSelect={(date) => controllerField.onChange(date?.toISOString())}
                    disabled={disabled || field.disabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
        );

      case 'file':
        return (
          <Controller
            name={field.name}
            control={control}
            rules={{
              required: field.required ? `${field.label} is required` : false
            }}
            render={({ field: controllerField }) => (
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    controllerField.onChange(file);
                  }}
                  disabled={disabled || field.disabled}
                  className={cn(error && "border-destructive")}
                />
                <Button type="button" variant="outline" size="sm" disabled={disabled || field.disabled}>
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
            )}
          />
        );

      default:
        // For unsupported field types or any other field that might render a user object directly
        return (
          <div className="text-sm">
            {disabled && field.value && typeof field.value === 'object' ? 
              extractSafeDisplayValue(field.value) : 
              <div className="text-muted-foreground">
                Field type '{field.type}' not supported
              </div>
            }
          </div>
        );
    }
  };

  // For checkbox, don't render separate label
  if (field.type === 'checkbox') {
    return (
      <div className="space-y-2">
        {renderField()}
        {error && (
          <p className="text-sm text-destructive">{error.message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className={cn("text-sm font-medium", field.required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
        {field.label}
      </Label>
      {renderField()}
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
}