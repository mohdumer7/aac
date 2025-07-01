import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "../ui/ComboBoxWrapper";
import { DatePicker } from "../ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-toastify";
import { CompleteUserData } from "@/utils/userUtils";
import { ChevronRight, ChevronLeft, Save, X } from "lucide-react";

interface UserFormDialogProps {
  isOpen: boolean;
  closeDialog: () => void;
  onSave: (data: { formData: CompleteUserData; action: string }) => Promise<any>;
  initialData?: any;
  action: string;
  fields: any;
  masterData: {
    departments?: any[];
    designations?: any[];
    roles?: any[];
    employeeTypes?: any[];
    locations?: any[];
    organisations?: any[];
    countries?: any[];
    visaTypes?: any[];
    reportingTo?: any[];
    statusOptions?: any[];
    genderOptions?: any[];
    maritalStatusOptions?: any[];
  };
  isSubmitting?: boolean;
  onFieldChange?: (params: { id: string; fieldName: string }) => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  isOpen,
  closeDialog,
  onSave,
  initialData = {},
  action,
  fields,
  masterData,
  isSubmitting = false,
  onFieldChange,
}) => {
  // State for form data and validation
  const [formData, setFormData] = useState<CompleteUserData>({} as CompleteUserData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("core");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Tabs configuration
  const tabs = [
    { id: "core", label: "Core Info", icon: "👤" },
    { id: "personal", label: "Personal Details", icon: "🏠" },
    { id: "employment", label: "Employment", icon: "💼" },
    { id: "visa", label: "Visa Details", icon: "🛂" },
    { id: "identification", label: "Identification", icon: "🪪" },
    { id: "benefits", label: "Benefits", icon: "🏥" },
  ];

  // Group fields by category tab
  const fieldsByCategory = {
    core: [
      "empId", "email", "firstName", "lastName", "fullName", 
      "displayName", "password", "imageUrl", "isActive"
    ],
    personal: [
      "gender", "dateOfBirth", "maritalStatus", "nationality", "personalNumber"
    ],
    employment: [
      "department", "designation", "reportingTo", "employeeType", "role", 
      "reportingLocation", "activeLocation", "extension", "mobile", 
      "joiningDate", "relievingDate", "organisation", "personCode", "status", "availability"
    ],
    visa: [
      "visaType", "visaIssueDate", "visaExpiryDate", "visaFileNo", 
      "workPermit", "labourCardExpiryDate", "iloeExpiryDate"
    ],
    identification: [
      "passportNumber", "passportIssueDate", "passportExpiryDate", 
      "emiratesId", "emiratesIdIssueDate", "emiratesIdExpiryDate"
    ],
    benefits: [
      "medicalInsurance"
    ],
  };

  // Initialize form data with initial values
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData({ ...initialData });
    } else {
      setFormData({} as CompleteUserData);
    }
  }, [initialData, isOpen]);

  // Handle form field changes
  const handleChange = (e: any, fieldName: string, format?: string, fieldType?: string, data?: any[], field?: any) => {
    let value;

    if (e?.target?.value !== undefined) {
      value = e.target.value;
    } else if (e !== undefined) {
      value = e;
    } else {
      value = null;
    }

    // Special handling for certain types
    if (format === "Date" && value) {
      value = new Date(value);
    } else if (format === "ObjectId" && value) {
      // If it's an ObjectId reference, we handle it differently
      const dataItem = data?.find((item) => item._id === value);
      value = dataItem?._id || value;
    }

    // Handle special case for department changes
    if (fieldName === "department" && onFieldChange) {
      onFieldChange({ id: value, fieldName });
    }

    // Auto-generate fullName if first or last name changes
    if (fieldName === "firstName" || fieldName === "lastName") {
      const firstName = fieldName === "firstName" ? value : formData.firstName || "";
      const lastName = fieldName === "lastName" ? value : formData.lastName || "";
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
        fullName: `${firstName} ${lastName}`.trim(),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    }

    // Clear error when field is changed
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: "" });
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Get fields for current tab - using either category property or name lookup
    const fieldsToValidate = fields.filter((field: any) => 
      (field.category === activeTab) || 
      (fieldsByCategory[activeTab as keyof typeof fieldsByCategory]?.includes(field.name))
    );

    // Validate required fields
    fieldsToValidate.forEach((field: any) => {
      if (field.required && !formData[field.name as keyof CompleteUserData]) {
        newErrors[field.name] = `${field.label} is required`;
        isValid = false;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Navigate to next tab if validation passes
  const handleNextTab = () => {
    if (validateForm()) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id);
      }
    } else {
      setSubmitAttempted(true);
      toast.error("Please fill all required fields correctly");
    }
  };

  // Navigate to previous tab
  const handlePreviousTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setSubmitAttempted(true);
    
    // Validate all tabs before submission
    let allTabsValid = true;
    const allErrors: Record<string, string> = {};
    
    // Check each tab for validation - using either category property or name lookup
    Object.keys(fieldsByCategory).forEach(tabId => {
      const fieldsToValidate = fields.filter((field: any) => 
        (field.category === tabId) || 
        (fieldsByCategory[tabId as keyof typeof fieldsByCategory]?.includes(field.name))
      );
      
      fieldsToValidate.forEach((field: any) => {
        if (field.required && !formData[field.name as keyof CompleteUserData]) {
          allErrors[field.name] = `${field.label} is required`;
          allTabsValid = false;
        }
      });
    });
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      allErrors.email = "Please enter a valid email address";
      allTabsValid = false;
    }
    
    setErrors(allErrors);
    
    if (!allTabsValid) {
      toast.error("Please fill all required fields across all tabs");
      return;
    }

    try {
      const response = await onSave({ formData, action });
      if (response?.data?.status === "success") {
        toast.success(`User ${action === "Add" ? "created" : "updated"} successfully`);
        closeDialog();
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    }
  };

  // Render form fields for the current tab
  const renderTabFields = (tabId: string) => {
    // First check for fields with matching category, then fall back to using the fieldsByCategory array
    const tabFields = fields.filter((field: any) => 
      (field.category === tabId) || 
      (fieldsByCategory[tabId as keyof typeof fieldsByCategory]?.includes(field.name))
    );

    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-h-[60vh] overflow-y-auto p-1">
        {tabFields.map((field: any, index: number) => (
          <div key={index} className="flex flex-col gap-1">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {renderField(field)}
            {errors[field.name] && (
              <p className="text-xs text-red-500">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render appropriate input field based on type
  const renderField = (field: any) => {
    const { type, name, readOnly, placeholder, data } = field;

    switch (type) {
      case "text":
      case "email":
      case "number":
        return (
          <Input
            id={name}
            name={name}
            type={type}
            placeholder={placeholder || `Enter ${field.label}`}
            value={formData[name as keyof CompleteUserData] || ""}
            onChange={(e) => handleChange(e, name, field.format, field.type, field.data, field)}
            readOnly={readOnly}
            className={errors[name] ? "border-red-500" : ""}
          />
        );
      case "select":
        return (
          <Combobox
            field={field}
            formData={formData}
            handleChange={(value) => handleChange(value, name, field.format, field.type, field.data, field)}
            placeholder={placeholder || `Select ${field.label}`}
          />
        );
      case "date":
        return (
          <DatePicker
            field={field}
            formData={formData}
            handleChange={(value) => handleChange(value, name, field.format, field.type, field.data, field)}
          />
        );
      default:
        return (
          <Input
            id={name}
            name={name}
            type="text"
            placeholder={placeholder || `Enter ${field.label}`}
            value={formData[name as keyof CompleteUserData] || ""}
            onChange={(e) => handleChange(e, name, field.format, field.type, field.data, field)}
            readOnly={readOnly}
            className={errors[name] ? "border-red-500" : ""}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {action === "Add" ? "Add New User" : "Update User"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-flow-col auto-cols-auto w-full">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-1"
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-4">
              {renderTabFields(tab.id)}
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter className="flex justify-between items-center mt-6 sm:justify-between">
          <div>
            {activeTab !== tabs[0].id && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousTab}
                className="mr-2"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}
            {activeTab !== tabs[tabs.length - 1].id && (
              <Button
                type="button"
                onClick={handleNextTab}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSubmitting ? "Saving..." : "Save User"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog; 