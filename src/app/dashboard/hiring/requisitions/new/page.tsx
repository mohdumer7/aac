"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useUserAuthorised from "@/hooks/useUserAuthorised";
import { useGetMasterQuery } from "@/services/endpoints/masterApi";
import { toast } from "react-toastify";
import { Combobox } from "@/components/ui/ComboBoxWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, FileText } from "lucide-react";

export default function NewRequisitionPage() {
  const router = useRouter();
  const { user, status, authenticated } = useUserAuthorised();
  const [formData, setFormData] = useState<any>({
    vacancyReason: "New Position",
    isNewPositionBudgeted: false,
    nonBudgeted: false,
    vacantPositionsCount: 1,
    candidateType: "External",
    status: "Draft"
  });
  const [activeTab, setActiveTab] = useState("position");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch master data
  const { data: departmentData = [], isLoading: departmentLoading }: any = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    filter: { isActive: true },
    sort: { name: 'asc' },
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any, field: string) => {
    let value = e?.target?.value !== undefined ? e.target.value : e;

    // Special handling for checkboxes
    if (field === "isNewPositionBudgeted" || field === "nonBudgeted") {
      value = e.target.checked;
    }

    // Update formData
    setFormData({ 
      ...formData, 
      [field]: value 
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields: Record<string, string> = {
      department: "Department is required",
      requestedPosition: "Requested position is required",
      vacancyReason: "Vacancy reason is required",
    };
    
    // Check for missing required fields
    Object.entries(requiredFields).forEach(([field, errorMessage]) => {
      if (!formData[field]) {
        newErrors[field] = errorMessage;
      }
    });
    
    // Additional validation for replacement information
    if (formData.vacancyReason === "Replacement") {
      if (!formData.previousEmployeeName) {
        newErrors.previousEmployeeName = "Previous employee name is required for replacement";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (action: "save" | "submit") => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        requestedBy: user?._id,
        status: action === "submit" ? "Pending Department Head" : "Draft",
        addedBy: user?._id,
        updatedBy: user?._id,
      };

      // Send to API
      const response = await fetch("/api/hiring/requisitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          action === "save" 
            ? "Requisition saved as draft" 
            : "Requisition submitted for approval"
        );
        router.push("/dashboard/hiring/requisitions");
      } else {
        throw new Error(result.error || "Failed to save requisition");
      }
    } catch (error: any) {
      console.error("Error saving requisition:", error);
      toast.error(error.message || "An error occurred while saving the requisition");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authenticated) {
    return <div>Please login to continue</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/dashboard/hiring/requisitions")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">New Manpower Requisition</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manpower Requisition Form</CardTitle>
          <CardDescription>
            Use this form to request new positions or replacements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="position">Position Information</TabsTrigger>
              <TabsTrigger value="previous">Previous Employee</TabsTrigger>
              <TabsTrigger value="candidate">Candidate Information</TabsTrigger>
            </TabsList>

            <TabsContent value="position" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                  <Select 
                    onValueChange={(value) => handleChange(value, "department")}
                    value={formData.department}
                  >
                    <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentData?.data?.map((dept: any) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestedPosition">Requested Position <span className="text-red-500">*</span></Label>
                  <Input 
                    id="requestedPosition" 
                    placeholder="Enter position title" 
                    value={formData.requestedPosition || ''}
                    onChange={(e) => handleChange(e, "requestedPosition")}
                    className={errors.requestedPosition ? "border-red-500" : ""}
                  />
                  {errors.requestedPosition && <p className="text-red-500 text-sm">{errors.requestedPosition}</p>}
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Vacancy Reason <span className="text-red-500">*</span></Label>
                <RadioGroup 
                  value={formData.vacancyReason} 
                  onValueChange={(value) => handleChange(value, "vacancyReason")}
                  className="flex space-x-8"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="New Position" id="newPosition" />
                    <Label htmlFor="newPosition">New Position</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Replacement" id="replacement" />
                    <Label htmlFor="replacement">Replacement</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.vacancyReason === "New Position" && (
                <div className="space-y-2 mt-4">
                  <Label>New Position Details</Label>
                  <div className="flex space-x-8">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isNewPositionBudgeted"
                        checked={formData.isNewPositionBudgeted}
                        onCheckedChange={(checked) => handleChange({ target: { checked } }, "isNewPositionBudgeted")}
                      />
                      <Label htmlFor="isNewPositionBudgeted">Budgeted</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="nonBudgeted"
                        checked={formData.nonBudgeted}
                        onCheckedChange={(checked) => handleChange({ target: { checked } }, "nonBudgeted")}
                      />
                      <Label htmlFor="nonBudgeted">Non-Budgeted</Label>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-4">
                <Label htmlFor="vacantPositionsCount">Number of Vacant Positions</Label>
                <Input 
                  id="vacantPositionsCount" 
                  type="number" 
                  min="1" 
                  value={formData.vacantPositionsCount || 1}
                  onChange={(e) => handleChange(e, "vacantPositionsCount")}
                  className="w-32"
                />
              </div>

              <Button 
                type="button" 
                onClick={() => setActiveTab("previous")}
                className="mt-4"
              >
                Next
              </Button>
            </TabsContent>

            <TabsContent value="previous" className="space-y-4">
              {formData.vacancyReason === "Replacement" ? (
                <>
                  <h3 className="text-lg font-medium">Previous Employee Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="previousEmployeeName">Employee Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="previousEmployeeName" 
                        placeholder="Enter employee name" 
                        value={formData.previousEmployeeName || ''}
                        onChange={(e) => handleChange(e, "previousEmployeeName")}
                        className={errors.previousEmployeeName ? "border-red-500" : ""}
                      />
                      {errors.previousEmployeeName && <p className="text-red-500 text-sm">{errors.previousEmployeeName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previousEmployeeId">Employee ID</Label>
                      <Input 
                        id="previousEmployeeId" 
                        placeholder="Enter employee ID" 
                        value={formData.previousEmployeeId || ''}
                        onChange={(e) => handleChange(e, "previousEmployeeId")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previousEmployeeDepartment">Department</Label>
                      <Input 
                        id="previousEmployeeDepartment" 
                        placeholder="Enter department" 
                        value={formData.previousEmployeeDepartment || ''}
                        onChange={(e) => handleChange(e, "previousEmployeeDepartment")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previousEmployeeDesignation">Designation</Label>
                      <Input 
                        id="previousEmployeeDesignation" 
                        placeholder="Enter designation" 
                        value={formData.previousEmployeeDesignation || ''}
                        onChange={(e) => handleChange(e, "previousEmployeeDesignation")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previousEmployeeDOE">Date of Exit</Label>
                      <DatePicker
                        field={{ name: "previousEmployeeDOE", format: "Date" }}
                        formData={formData}
                        handleChange={(value) => handleChange(value, "previousEmployeeDOE")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previousEmployeeSalary">Salary</Label>
                      <Input 
                        id="previousEmployeeSalary" 
                        type="number" 
                        placeholder="Enter salary amount" 
                        value={formData.previousEmployeeSalary || ''}
                        onChange={(e) => handleChange(e, "previousEmployeeSalary")}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">This section is only required for replacements.</p>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActiveTab("position")}
                >
                  Previous
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setActiveTab("candidate")}
                >
                  Next
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="candidate" className="space-y-4">
              <h3 className="text-lg font-medium">Candidate Information (Optional)</h3>
              <p className="text-sm text-gray-500 mb-4">Fill this section if you already have a candidate in mind</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selectedCandidateName">Candidate Name</Label>
                  <Input 
                    id="selectedCandidateName" 
                    placeholder="Enter candidate name" 
                    value={formData.selectedCandidateName || ''}
                    onChange={(e) => handleChange(e, "selectedCandidateName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedJoiningDate">Expected Joining Date</Label>
                  <DatePicker
                    field={{ name: "expectedJoiningDate", format: "Date" }}
                    formData={formData}
                    handleChange={(value) => handleChange(value, "expectedJoiningDate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input 
                    id="designation" 
                    placeholder="Enter designation" 
                    value={formData.designation || ''}
                    onChange={(e) => handleChange(e, "designation")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proposedSalary">Proposed Salary</Label>
                  <Input 
                    id="proposedSalary" 
                    type="number" 
                    placeholder="Enter proposed salary" 
                    value={formData.proposedSalary || ''}
                    onChange={(e) => handleChange(e, "proposedSalary")}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="benefits">Benefits</Label>
                  <Textarea 
                    id="benefits" 
                    placeholder="Enter benefits details" 
                    value={formData.benefits || ''}
                    onChange={(e) => handleChange(e, "benefits")}
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Candidate Type</Label>
                <RadioGroup 
                  value={formData.candidateType} 
                  onValueChange={(value) => handleChange(value, "candidateType")}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Internal" id="internal" />
                    <Label htmlFor="internal">Internal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="External" id="external" />
                    <Label htmlFor="external">External</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Foreign Recruitment" id="foreign" />
                    <Label htmlFor="foreign">Foreign Recruitment</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea 
                  id="remarks" 
                  placeholder="Enter additional remarks" 
                  value={formData.remarks || ''}
                  onChange={(e) => handleChange(e, "remarks")}
                  rows={3}
                />
              </div>

              <div className="flex justify-between mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActiveTab("previous")}
                >
                  Previous
                </Button>
                
                <div className="space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSubmit("save")}
                    disabled={submitting}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Draft
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleSubmit("submit")}
                    disabled={submitting}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Submit for Approval
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 