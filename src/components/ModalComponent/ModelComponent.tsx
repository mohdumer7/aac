import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import mongoose from "mongoose";
import { Combobox } from "../ui/ComboBoxWrapper";
import { DatePicker } from "../ui/date-picker";
import useUserAuthorised from "@/hooks/useUserAuthorised";
import MultipleSelector from "../ui/multiple-selector";
import { toast } from "react-toastify";
import { FocusScope } from '@radix-ui/react-focus-scope';
import {DismissableLayer} from '@radix-ui/react-dismissable-layer'

interface Field {
  name: string;
  label?: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  format?: string;
  visibility?: boolean;
  section?: string[];
  data?: any[];
  options?: string[];
  onChange?: (value: string) => void;
  validate?: (value: any, formData?: any) => string | undefined;
  CustomComponent?: React.ComponentType<{
    accessData: any;
    handleChange: (e: { target: { value: any } }, fieldName: string) => void;
    selectedItem?: any;
  }>;
}

interface BaseFormData {
  isActive: boolean;
  addedBy?: string;
  updatedBy?: string;
  [key: string]: any;
}

interface DynamicDialogProps<T extends BaseFormData> {
  isOpen: boolean;
  closeDialog: () => void;
  selectedMaster: string;
  onSave: (data: { formData: T; action: string }) => Promise<any>;
  fields: Field[];
  initialData: Partial<T>;
  action: string;
  height?: string;
  width?: string;
  isSubmitting?: boolean;
  quoteStatusData?: any;
  onchangeData: (data: any) => void;
}

function DynamicDialog<T extends BaseFormData>({
  isOpen,
  closeDialog,
  selectedMaster,
  onSave,
  fields,
  initialData,
  action,
  height,
  width,
  isSubmitting = false,
  quoteStatusData,
  onchangeData
}: DynamicDialogProps<T>) {
  const { user }: any = useUserAuthorised();
  const [formData, setFormData] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (!initialData) {
      setFormData({});
      return;
    }

    const formattedData = Object.keys(initialData || {}).reduce((acc: Record<string, any>, key: string) => {
      if (typeof initialData[key] === "object" && initialData[key]?._id) {
        acc[key] = initialData[key]._id;
      } else {
        acc[key] = initialData[key];
      }
      return acc;
    }, {});
    setFormData(formattedData as Partial<T>);
    setErrors({});
  }, [initialData]);

  // Handle form data changes
  const handleChange = (
    e: { target: { value: any } } | any[] | string | null,
    fieldName: string,
    format?: string,
    type?: string,
    data?: any[],
    field?: Field,
    customFunction = (dateValue: any) => { }) => {
    let value: any = "";

    (fieldName === "department") && onchangeData({ id: e, fieldName });

    ////////// Needs refactoring cant hardcode
    fieldName === 'quoteStatus' && setSelectedStatus(field?.data?.find((data) => data._id === e)?.name);
    ////////////////////

    if (type === "multiselect") {
      value = (e as any[]).map((item: { value: any }) => item.value);
    } else if (type === "select") {
      value = e;
    } else if (e === null) {
      value = null;
    } else {
      value = (e as { target: { value: any } }).target.value ?? "";
    }

    setFormData((prev) => {
      let formattedValue = value;
      if (format === "ObjectId") {
        formattedValue = mongoose.Types.ObjectId.isValid(value || "") ? value : null;
      } else if (format === "Date") {
        formattedValue = value ? new Date(value).toISOString() : null;
      }

      const updatedFormData:any = {
        ...prev,
        [fieldName]: formattedValue,
      };
      // Call field's onChange handler if provided
      if (field?.onChange) {
        field.onChange(formattedValue);
      }
     
      // Clear error when field is changed
      if (errors[fieldName]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
      customFunction(updatedFormData[fieldName])
      if (fieldName === 'quoteStatus' && quoteStatusData?.find((data:any) => data._id === formattedValue)?.name === 'L - Lost') {
        updatedFormData['lostDate'] = new Date().toISOString();
      }

      return updatedFormData;
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.name];

      // Required field validation
      if (field.required && (value === undefined || value === null || value === "")) {
        newErrors[field.name] = `${field.label || field.name} is required`;
      }

      // Custom field validation
      if (field.validate && value !== undefined) {
        const error = field.validate(value, formData);
        if (error) {
          newErrors[field.name] = error;
        }
      }

      // Format validation
      if (field.format === "ObjectId" && value && !mongoose.Types.ObjectId.isValid(value)) {
        newErrors[field.name] = `Invalid ${field.label || field.name} format`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // handle close
  const handleClose = () => {
    setFormData({});
    setErrors({});
    closeDialog();
  };

  // Handle form submission
  const handleSubmit = async (status:string) => {
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    try {
      const updatedData = {
        ...formData,
        updatedBy: user._id
      } as T;

      if (status === "delete") {
        updatedData.isActive = false;
      }
      if (action === "Add") {
        updatedData.addedBy = user._id;
      }
      const response: any = await onSave({ formData: updatedData, action });
     
      if (!response || response?.error) {
        toast.error(response?.error.message || "Something Went Wrong!");
        return;
      }
      toast.success(`${selectedMaster} ${action === 'Add' ? 'created' : status === 'delete' ? 'deleted' : 'updated'} successfully`);
      handleClose();
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error(`Error ${action === 'Add' ? 'creating' : 'updating'} ${selectedMaster}`);
    }
  };

  return (

    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent
        className={`max-w-full max-h-[90%] pointer-events-auto mx-2  ${height === 'auto' ? 'h-auto' : 'h-[75%]'} ${width === 'full' ? 'w-[95%] h-[90%]' : 'sm:max-w-md lg:max-w-4xl'}`}>
        <DialogTitle className="pl-1">{`${action} ${selectedMaster?.toProperCase()}`}
          {selectedMaster === 'quote status' && <div>
            <div className="text-sm font-medium pt-2">Quote No# : {initialData?.country?.countryCode}-{initialData?.year?.toString().slice(-2)}-{formData?.quoteNo}</div>
            <div className="text-sm font-medium p-0">Currest Status : {initialData?.quoteStatus?.name}</div>
          </div>}
        </DialogTitle>
        <div className="bg-white h-full max-h-[450px] overflow-y-auto p-2 rounded-md">
          <div className="space-y-4 pr-2 pl-1 my-1 overflow-y-auto">
            <form>
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4`}>
                {fields.map((field, index) => (
                  <div key={index} className={`flex flex-col gap-1 mb-2 ${field.type === "custom" ? "col-span-2" : ""} ${field?.visibility === true ? '' : field?.section && (field?.section?.includes(selectedStatus) ? '' : field.section && 'hidden')} `}>
                    {/* need to remove access hardcoding */}
                    {field.label !== 'access' && field.type !== 'hidden' && <Label>{field.label}</Label>}
                    {
                      (() => {
                        switch (field.type) {
                          case "multiselect":
                            return (
                              <div>
                                <MultipleSelector
                                  value={((formData[field.name] || []) as string[]).map((id) => ({
                                    value: id,
                                    label: field.data?.find((option) => option.value === id)?.label || "Unknown",
                                  }))}
                                  onChange={(selected) => handleChange(selected, field.name, "", "multiselect")}
                                  options={field.data}
                                  placeholder={field.placeholder || "Select options..."}
                                />
                                {errors[field.name] && (
                                  <span className="text-sm text-destructive">{errors[field.name]}</span>
                                )}
                              </div>
                            );
                          case "textarea":
                            return (
                              <div>
                                <textarea
                                  rows={3}
                                  onChange={(e) => handleChange(e, field.name, field.format)}
                                  value={formData[field.name] || ""}
                                  placeholder={field.placeholder || ""}
                                  className={`${errors[field.name] ? "border-destructive" : ""} w-full outline-1 outline-red-900 rounded-lg shadow-md p-4 outline-double bg-gray-100`}
                                />
                                {errors[field.name] && (
                                  <span className="text-sm text-destructive">{errors[field.name]}</span>
                                )}
                              </div>
                            );
                          case "select":
                            return (
                              <div>
                                {/* <FocusScope asChild loop trapped> */}

                                <Combobox
                                  field={field}
                                  formData={formData}
                                  handleChange={handleChange}
                                  placeholder={field.placeholder || ""}
                                  modal
                                  />
                                  {/* </FocusScope> */}
                                {errors[field.name] && (
                                  <span className="text-sm text-destructive">{errors[field.name]}</span>
                                )}
                              </div>
                            );
                          case "date":
                            return (
                              <div>

                                <DatePicker
                                  currentDate={formData[field.name] || undefined}
                                  handleChange={(selectedDate: { toISOString: () => any; }, setDate: any) => {
                                    handleChange(
                                      { target: { value: selectedDate?.toISOString() || "" } },
                                      field.name,
                                      field?.format, field?.type, field?.data, field,
                                      setDate
                                    )

                                    return true
                                  }}

                                  placeholder={field.placeholder}
                                />
                                {errors[field.name] && (
                                  <span className="text-sm text-destructive">{errors[field.name]}</span>
                                )}
                              </div>
                            );
                          case "custom":
                            return field.CustomComponent ? (
                              <div>
                                <field.CustomComponent
                                  accessData={formData[field.name]}
                                  handleChange={handleChange}
                                  selectedItem={initialData}
                                />
                                {errors[field.name] && (
                                  <span className="text-sm text-destructive">{errors[field.name]}</span>
                                )}
                              </div>
                            ) : null;
                          case "hidden":
                            return (
                              <input
                                type="hidden"
                                name={field.name}
                                value={formData[field.name] || ""}
                              />
                            );
                          default:
                            return (
                              <div>
                                <Input
                                  type={field.type}
                                  onChange={(e) => handleChange(e, field.name, field.format)}
                                  value={formData[field.name] || ""}
                                  readOnly={field.readOnly}
                                  placeholder={field.placeholder || ""}
                                  required={field.required || false}
                                  className={errors[field.name] ? "border-destructive" : ""}
                                />
                                {errors[field.name] && (
                                  <span className="text-sm text-destructive">{errors[field.name]}</span>
                                )}
                              </div>
                            );
                        }
                      })()
                    }
                  </div>
                ))}
              </div>
            </form>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={()=>handleSubmit('update')} disabled={isSubmitting} className={`${action === 'Update' && 'bg-blue-800 hover:bg-blue-700 duration-300'} `}>
            {action === 'Add' ? isSubmitting ? "Saving..." : "Save" : isSubmitting ? "Updating..." : "Update"}
          </Button>

          {action === 'Update' && <Button onClick={()=>handleSubmit('delete')} disabled={isSubmitting}>
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DynamicDialog;
