'use client';

import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';

type FormFieldProps = {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'email' | 'tel' | 'textarea' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  className?: string;
  wrapperClassName?: string;
  description?: string;
  accept?: string;
  validation?: {
    min?: number | string;
    max?: number | string;
    minLength?: number;
    maxLength?: number;
    pattern?: string | RegExp;
  };
};

export function FormField({
  id,
  label,
  type = 'text',
  placeholder,
  required = false,
  options = [],
  className,
  wrapperClassName,
  description,
  accept,
  validation = {},
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();

  const fieldError = errors[id];
  const fieldValue = watch(id);
  const hasValue = fieldValue !== undefined && fieldValue !== '' && fieldValue !== false;

  const baseInputClasses = 'block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out';
  
  const inputClasses = cn(
    baseInputClasses,
    fieldError
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300',
    hasValue && !fieldError ? 'border-green-300' : '',
    type === 'file' ? 'p-0 border-0' : '',
    className
  );
  
  const fileInputClasses = cn(
    'file:mr-4 file:py-2 file:px-4 file:rounded-md',
    'file:border-0 file:text-sm file:font-semibold',
    'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    fieldError ? 'border-red-500' : 'border-gray-300',
    'w-full text-sm text-gray-500',
    'bg-white rounded-md',
    'border border-dashed',
    'cursor-pointer',
    className
  );
  
  // Helper function to convert string pattern to RegExp if needed
  const getValidationPattern = (pattern: string | RegExp | undefined): RegExp | undefined => {
    if (!pattern) return undefined;
    return typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  };
  
  // Helper function to handle min/max validation
  const getMinMaxValidation = (val: number | string | undefined): number | undefined => {
    if (val === undefined) return undefined;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  };
  
  // Helper to determine if we should show the success checkmark
  const showSuccessCheck = hasValue && !fieldError && type !== 'file' && (
    type === 'text' || 
    type === 'email' || 
    type === 'tel' || 
    type === 'date' ||
    type === 'number' ||
    type === 'radio'
  );

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <div className="relative">
            <select
              id={id}
              className={cn(inputClasses, 'appearance-none')}
              {...register(id, {
                required,
                minLength: validation?.minLength as number | undefined,
                maxLength: validation?.maxLength as number | undefined,
                pattern: getValidationPattern(validation?.pattern),
              })}
            >
              <option value="">Select {label}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={id}
              type="checkbox"
              className={cn(
                'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
                fieldError ? 'border-red-500' : ''
              )}
              {...register(id, { required })}
            />
            <label htmlFor={id} className="ml-2 block text-sm text-gray-700">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case 'file':
        return (
          <div className="mt-1">
            <input
              id={id}
              type="file"
              className={fileInputClasses}
              accept={accept}
              {...register(id, {
                required,
                validate: (value: FileList | null) => {
                  if (!required) return true;
                  return (value && value.length > 0) || `${label} is required`;
                }
              })}
            />
            {description && (
              <p className="mt-1 text-xs text-gray-500">{description}</p>
            )}
          </div>
        );
        
      case 'textarea':
        return (
          <textarea
            id={id}
            className={cn(inputClasses, 'min-h-[100px]')}
            placeholder={placeholder}
            {...register(id, {
              required,
              minLength: validation?.minLength,
              maxLength: validation?.maxLength,
            })}
          />
        );
        
      default:
        return (
          <div className="relative">
            <input
              id={id}
              type={type}
              className={inputClasses}
              placeholder={placeholder}
              {...register(id, {
                required,
                min: getMinMaxValidation(validation?.min),
                max: getMinMaxValidation(validation?.max),
                minLength: validation?.minLength,
                maxLength: validation?.maxLength,
                pattern: getValidationPattern(validation?.pattern),
              })}
            />
            {showSuccessCheck && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={cn('space-y-2', wrapperClassName)}>
      {type !== 'checkbox' && type !== 'file' && (
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium',
            fieldError ? 'text-red-700' : 'text-gray-700'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {type === 'file' && label && (
        <label
          htmlFor={id}
          className={cn(
            'block text-sm font-medium mt-1',
            fieldError ? 'text-red-700' : 'text-gray-700'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {fieldError && (
        <p className="mt-1 text-sm text-red-600">
          {fieldError.message?.toString() || `${label} is required`}
        </p>
      )}
    </div>
  );
}
