"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, CalendarIcon, Loader2, CheckCircle, Tag, BarChart3, AlignLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import { useGetTicketCategoriesQuery } from '@/services/endpoints/ticketCategoryApi';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Badge } from '@/components/ui/badge';

// Define validation schema
const ticketSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  department: z.string({ required_error: "Department is required" }),
  category: z.string({ required_error: "Category is required" }),
  priority: z.string({ required_error: "Priority is required" }),
  dueDate: z.date().optional(),
});

interface TicketFormComponentProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  userId: string;
  isEdit?: boolean;
}

const TicketFormComponent: React.FC<TicketFormComponentProps> = ({ 
  onSubmit, 
  initialData, 
  userId,
  isEdit = false
}) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialData?.department?._id || '');
  const [formStep, setFormStep] = useState(0);
  
  // Monitor form completion for enabling the submit button
  const [canSubmit, setCanSubmit] = useState(false);
  
  const { data: departmentData = { data: [] }, isLoading: departmentLoading }:any = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    filter: { isActive: true },
    sort: { name: 1 },
  });
  
  const { data: categoryData = { data: [] }, isLoading: categoryLoading }:any = useGetTicketCategoriesQuery({});
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, 
         setValue, watch, trigger } = useForm({
    resolver: zodResolver(ticketSchema),
    mode: "onChange",
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description,
      department: initialData.department?._id,
      category: initialData.category?._id,
      priority: initialData.priority,
      dueDate: initialData.dueDate ? new Date(initialData.dueDate) : undefined,
    } : {
      priority: 'MEDIUM'
    }
  });
  
  // Watch form fields
  const watchedDepartment = watch('department');
  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedPriority = watch('priority');
  const watchedCategory = watch('category');
  
  // Monitor all required form values to enable the submit button
  useEffect(() => {
    if (formStep === 1) {
      const hasRequiredFields = !!watchedTitle && 
                               !!watchedDescription && 
                               !!watchedDepartment && 
                               !!watchedCategory && 
                               !!watchedPriority;
      
      setCanSubmit(hasRequiredFields);
    }
  }, [formStep, watchedTitle, watchedDescription, watchedDepartment, watchedCategory, watchedPriority]);
  
  // Watch for department changes
  useEffect(() => {
    if (watchedDepartment && watchedDepartment !== selectedDepartment) {
      setSelectedDepartment(watchedDepartment);
      // Clear category selection when department changes
      setValue('category', '');
    }
  }, [watchedDepartment, selectedDepartment, setValue]);
  
  // Debug effect to log category data
  useEffect(() => {
    console.log('Category Data:', categoryData);
    console.log('Selected Department:', selectedDepartment);
    console.log('Category Loading:', categoryLoading);
    
    // Filter categories for debugging
    const filteredCategories = selectedDepartment 
      ? categoryData?.data?.filter((cat: any) => {
          // Handle both string and object department references
          const catDepartmentId = typeof cat.department === 'string' 
            ? cat.department 
            : cat.department?._id;
          return catDepartmentId === selectedDepartment;
        }) || []
      : [];
    console.log('Filtered Categories:', filteredCategories);
  }, [categoryData, selectedDepartment, categoryLoading]);
  
  const handleFormSubmit = (data: any) => {
    const formData = {
      ...data,
      creator: userId,
      addedBy: userId,
      updatedBy: userId,
      ...(isEdit && initialData ? { _id: initialData._id } : {})
    };
    
    // Submit the form data
    onSubmit(formData).then((response) => {
    onSubmit(formData);
  };
  
  const goToNextStep = async () => {
    const isStepValid = await trigger(['title', 'description']);
    if (isStepValid) {
      setFormStep(1);
    } else {
      toast.error("Please complete all required fields");
    }
  };
  
  const goToPreviousStep = () => {
    setFormStep(0);
  };
  
  // Get priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'HIGH':
        return "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20";
      case 'MEDIUM':
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      case 'LOW':
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";
    }
  };

  const formVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto border shadow-md overflow-hidden rounded-xl bg-card">
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardHeader className="pb-4 border-b bg-secondary/5">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl text-foreground">{isEdit ? 'Edit Ticket' : 'Create New Ticket'}</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                {isEdit 
                  ? 'Update the ticket details below' 
                  : 'Fill in the details below to create a new support ticket'}
              </CardDescription>
            </div>
            
            {/* Step indicator */}
            <div className="flex items-center space-x-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                1
              </div>
              <div className="w-5 h-0.5 bg-border"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep === 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                2
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {formStep === 0 && (
            <motion.div 
              className="space-y-6" 
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* Title field */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium flex items-center text-foreground">
                  <FileText className="h-4 w-4 mr-2 text-primary/70" />
                  Title
                  <span className="text-primary ml-1">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="title"
                    placeholder="Enter a clear title for your issue"
                    {...register('title')}
                    className={cn(
                      "rounded-md border-input focus:border-primary focus:ring-primary",
                      errors.title ? "border-destructive focus:border-destructive focus:ring-destructive" : ""
                    )}
                    aria-invalid={errors.title ? "true" : "false"}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1 ml-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.title.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Description field */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium flex items-center text-foreground">
                  <AlignLeft className="h-4 w-4 mr-2 text-primary/70" />
                  Description
                  <span className="text-primary ml-1">*</span>
                </label>
                <div className="relative">
                  <Textarea
                    id="description"
                    placeholder="Describe your issue in detail"
                    rows={6}
                    className={cn(
                      "resize-none rounded-md border-input focus:border-primary focus:ring-primary",
                      errors.description ? "border-destructive focus:border-destructive focus:ring-destructive" : ""
                    )}
                    {...register('description')}
                    aria-invalid={errors.description ? "true" : "false"}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1 ml-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  type="button" 
                  className="w-full rounded-md bg-primary hover:bg-primary/90 shadow-sm"
                  onClick={goToNextStep}
                  disabled={!watchedTitle || !watchedDescription}
                >
                  Continue to Details
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
          
          {formStep === 1 && (
            <motion.div 
              className="space-y-6" 
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Department field */}
                <div className="space-y-2">
                  <label htmlFor="department" className="text-sm font-medium flex items-center text-foreground">
                    <Tag className="h-4 w-4 mr-2 text-primary/70" />
                    Department
                    <span className="text-primary ml-1">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => setValue('department', value)} 
                    defaultValue={initialData?.department?._id}
                  >
                    <SelectTrigger className={cn(
                      "rounded-md border-input focus:border-primary focus:ring-primary",
                      errors.department ? "border-destructive" : ""
                    )}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {departmentData?.data?.map((dept: any) => (
                        <SelectItem key={dept._id} value={dept._id} className="cursor-pointer">
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-sm text-destructive mt-1 ml-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.department.message}
                    </p>
                  )}
                </div>
                
                {/* Category field */}
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium flex items-center text-foreground">
                    <Tag className="h-4 w-4 mr-2 text-primary/70" />
                    Category
                    <span className="text-primary ml-1">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => setValue('category', value)}
                    defaultValue={initialData?.category?._id}
                    disabled={!selectedDepartment}
                  >
                    <SelectTrigger className={cn(
                      "rounded-md border-input focus:border-primary focus:ring-primary",
                      errors.category ? "border-destructive" : "",
                      !selectedDepartment ? "opacity-60" : ""
                    )}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {categoryLoading ? (
                        <SelectItem value="loading" disabled className="text-muted-foreground">
                          Loading categories...
                        </SelectItem>
                      ) : (() => {
                        // Filter categories by selected department
                        const filteredCategories = selectedDepartment 
                          ? categoryData?.data?.filter((cat: any) => {
                              // Handle both string and object department references
                              const catDepartmentId = typeof cat.department === 'string' 
                                ? cat.department 
                                : cat.department?._id;
                              return catDepartmentId === selectedDepartment;
                            }) || []
                          : [];
                        
                        return filteredCategories.length > 0 ? (
                          filteredCategories.map((cat: any) => (
                            <SelectItem key={cat._id} value={cat._id} className="cursor-pointer">
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : selectedDepartment ? (
                          <SelectItem value="no-categories" disabled className="text-muted-foreground">
                            No categories available for this department
                          </SelectItem>
                        ) : (
                          <SelectItem value="select-department" disabled className="text-muted-foreground">
                            Select a department first
                          </SelectItem>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive mt-1 ml-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.category.message}
                    </p>
                  )}
                  {!selectedDepartment && (
                    <p className="text-sm text-amber-500 mt-1 ml-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Select a department first
                    </p>
                  )}
                </div>
                
                {/* Priority field */}
                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium flex items-center text-foreground">
                    <BarChart3 className="h-4 w-4 mr-2 text-primary/70" />
                    Priority
                    <span className="text-primary ml-1">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => setValue('priority', value)}
                    defaultValue={initialData?.priority || 'MEDIUM'}
                  >
                    <SelectTrigger className="rounded-md border-input focus:border-primary focus:ring-primary">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      <SelectItem value="LOW" className="cursor-pointer">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                          Low
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM" className="cursor-pointer">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="HIGH" className="cursor-pointer">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                          High
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-sm text-destructive mt-1 ml-1">
                      {errors.priority.message}
                    </p>
                  )}
                </div>
                
                {/* Due Date field */}
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="text-sm font-medium flex items-center text-foreground">
                    <CalendarIcon className="h-4 w-4 mr-2 text-primary/70" />
                    Due Date (Optional)
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-md border-input",
                          !watch('dueDate') ? "text-muted-foreground" : "text-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary/70" />
                        {watch('dueDate') ? (
                          format(watch('dueDate') || new Date(), 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-md shadow-md" align="start">
                      <Calendar
                        mode="single"
                        selected={watch('dueDate')}
                        onSelect={(date) => setValue('dueDate', date)}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        className="rounded-md border-none"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Preview card at bottom of step 2 */}
          {formStep === 1 && (
            <motion.div 
              className="mt-8 pt-6 border-t"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-sm font-medium mb-3 text-foreground">Ticket Preview</h3>
              <div className="bg-secondary/10 rounded-md p-4 border">
                <h4 className="font-medium text-sm mb-2 text-foreground">{watchedTitle || "Your ticket title"}</h4>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {watchedDescription || "Your ticket description"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {watchedPriority && (
                    <Badge className={`text-xs ${getPriorityBadge(watchedPriority)}`}>
                      {watchedPriority}
                    </Badge>
                  )}
                  {watchedCategory && categoryData?.data?.find((cat: any) => cat._id === watchedCategory) && (
                    <Badge variant="outline" className="text-xs">
                      {categoryData?.data?.find((cat: any) => cat._id === watchedCategory)?.name}
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between py-4 border-t bg-secondary/5">
          {formStep === 0 ? (
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-md border-input hover:bg-secondary/20"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          ) : (
            <Button 
              type="button" 
              variant="outline"
              className="rounded-md border-input hover:bg-secondary/20"
              onClick={goToPreviousStep}
            >
              Back
            </Button>
          )}
          
          {formStep === 1 && (
            <Button 
              type="submit" 
              className="rounded-md bg-primary hover:bg-primary/90 shadow-sm"
              disabled={isSubmitting || (!canSubmit)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update Ticket' : 'Create Ticket'
              )}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default TicketFormComponent;