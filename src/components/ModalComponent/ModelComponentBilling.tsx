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
import { DismissableLayer } from '@radix-ui/react-dismissable-layer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Check, X } from 'lucide-react';

import {
    Trash2Icon, SendHorizontal
} from "lucide-react";

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
    deductions: any;
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
    deductionData?: any;
    accountData?: any;
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
    deductionData,
    accountData,
    action,
    height,
    width,
    isSubmitting = false,
    quoteStatusData,
    onchangeData
}: DynamicDialogProps<T>) {
    const { user }: any = useUserAuthorised();
    const [formData, setFormData]: any = useState<Partial<T>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedStatus, setSelectedStatus] = useState('');
    const [deductionField, setDeductionField] = useState([]);
    const [packageDetail, setPackageDetail]: any = useState([]);

    useEffect(() => {
        if (!initialData) {
            setFormData({
                oneTimeCharge: 0,
                outstandingAmount: 0,
                waivedAmount: 0
            });

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

        const extraDeductionFields = {};
        formattedData.deductions?.forEach(deduction => {
            if (deduction?.deductionType?._id) {
                const key = `deduction_${deduction?.deductionType?._id}`;
                extraDeductionFields[key] = deduction?.amount;
            }
        });

        // Merge original data with extra deduction fields
        const updatedFormData = {
            ...formattedData,
            ...extraDeductionFields,
        };
        console.log(updatedFormData);
        setFormData(updatedFormData as Partial<T>);
        setErrors({});
        console.log(accountData?.data)
        console.log(initialData?._id)
        const accountData1 = accountData?.data?.filter(
            (item: any) => item._id === initialData?.account?._id
        );
        console.log(accountData1);
        setPackageDetail(accountData1);

        const filteredDeductions = deductionData?.data?.filter(
            (item: any) => item?.provider?._id === initialData?.account?.provider?._id
        );

        const deductionFields = filteredDeductions?.map((item: any) => ({
            label: item.name,
            name: `deduction_${item._id}`, // unique name for each field
            type: 'number',
            required: false,
            placeholder: `${item.name}`,
            deductionId: item._id, // keep original ID for later
        }));
        initialData?.account?._id ? setDeductionField(deductionFields) : setDeductionField([]);


    }, [initialData]);


    const onChangeAccount = (accountId: any, data: any) => {

        const accountData = data?.filter(
            (item: any) => item._id === accountId
        );
        setPackageDetail(accountData);
        const filteredDeductions = deductionData?.data?.filter(
            (item: any) => item?.provider?._id === accountData[0]?.provider?._id
        );

        const deductionFields = filteredDeductions?.map((item: any) => ({
            label: item.name,
            name: `deduction_${item._id}`, // unique name for each field
            type: 'number',
            required: false,
            placeholder: `${item.name}`,
            deductionId: item._id, // keep original ID for later
        }));
        accountId ? setDeductionField(deductionFields) : setDeductionField([]);
        if (accountId) {
            const now = new Date();

            // Set first day of current month at midnight UTC
            const firstOfMonth = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                1,
                0, 0, 0
            ));
            formData['billingPeriodStart'] = firstOfMonth?.toISOString();
            formData['grossBillAmount'] = parseFloat(accountData[0]?.package?.amount);
            formData['vat'] = Number(Number(accountData[0]?.package?.amount) * 0.05).toFixed(2);
            formData['netBillAmount'] = Number(parseFloat(accountData[0]?.package?.amount) + parseFloat(((Number(accountData[0]?.package?.amount)) * 0.05).toFixed(2))).toFixed(2);
            formData['totalAmountDue'] = Number(parseFloat(accountData[0]?.package?.amount) + parseFloat(((Number(accountData[0]?.package?.amount)) * 0.05).toFixed(2))).toFixed(2);
        }


    }

    const extractDeductions = (formData: Record<string, any>) => {
        const deductions: Array<{ deductionType: any; amount: number }> = [];

        for (const key in formData) {
            if (key.startsWith('deduction_')) {
                const id = key.replace('deduction_', '');
                const amount = parseFloat(formData[key]);

                if (!isNaN(amount)) {
                    deductions.push({
                        deductionType: new mongoose.Types.ObjectId(id), // ✅ convert to ObjectId
                        amount,
                    });
                }
            }
        }

        return deductions;
    };

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
        (fieldName === "account") && onChangeAccount(value, data);

        setFormData((prev: any) => {
            let formattedValue = value;
            if (format === "ObjectId") {
                formattedValue = mongoose.Types.ObjectId.isValid(value || "") ? value : null;
            } else if (format === "Date") {
                formattedValue = value ? new Date(value).toISOString() : null;
            }

            const updatedFormData: any = {
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

            if (['grossBillAmount', 'oneTimeCharge', 'outstandingAmount', 'waivedAmount', 'vat'].includes(fieldName)) {
                const vatAmount = fieldName === 'vat' ? formattedValue : prev.vat || 0;
                const waivedAmount = fieldName === 'waivedAmount' ? formattedValue : prev.waivedAmount || 0;
                const outstandingAmount = fieldName === 'outstandingAmount' ? formattedValue : prev.outstandingAmount || 0;
                const gross = fieldName === 'grossBillAmount' ? formattedValue : prev.grossBillAmount || 0;
                const oneTime = fieldName === 'oneTimeCharge' ? formattedValue : prev.oneTimeCharge || 0;
                const vatValue = ((Number(gross) + Number(oneTime)) * 0.05).toFixed(2);

                updatedFormData['netBillAmount'] = parseFloat(vatAmount) + parseFloat(gross) + parseFloat(oneTime);
                updatedFormData['totalAmountDue'] = parseFloat(vatAmount) + parseFloat(gross) + parseFloat(oneTime) + parseFloat(outstandingAmount);
                updatedFormData['totalDeduction'] = parseFloat(gross) - packageDetail[0]?.package?.amount;
                updatedFormData['finalDeduction'] = parseFloat(gross) - packageDetail[0]?.package?.amount - parseFloat(waivedAmount);
            }

            if (fieldName === "billingPeriodStart") {
                const startDate = new Date(value);
                const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
                // Optional: keep same time (if needed)
                endOfMonth.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());

                updatedFormData.billingPeriodEnd = endOfMonth.toISOString(); // "YYYY-MM-DDTHH:mm:ss.sssZ"
            }


            customFunction(updatedFormData[fieldName])
            if (fieldName === 'quoteStatus' && quoteStatusData?.find((data: any) => data._id === formattedValue)?.name === 'L - Lost') {
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
    const handleSubmit = async (status: string) => {
        if (!validateForm()) {
            toast.error("Please fix the form errors before submitting");
            return;
        }

        try {

            const deductions = extractDeductions(formData);

            const updatedData = {
                ...formData,
                deductions: deductions,
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
                className={` bg-gray-100 max-w-full max-h-[90%] pointer-events-auto mx-2 ${height === "auto" ? "h-auto" : "h-[78%]"
                    } ${width === "full" ? "w-[95%] h-[90%]" : "w-[70%] h-[77%]"}`}
            >
                <DialogTitle className="pl-1">
                    <div className="flex justify-between items-center">
                        <div>
                            {`${action} ${selectedMaster?.toProperCase()}`}
                        </div>
                        <div className="flex justify-between gap-1 pr-3">
                            {action === 'Update' && <Button effect="expandIcon"
                                icon={Trash2Icon}
                                iconPlacement="right"
                                className="w-28"
                                onClick={() => handleSubmit('delete')} disabled={isSubmitting}>
                                {isSubmitting ? "Deleting..." : "Delete"}
                            </Button>}
                            <Button effect="expandIcon"
                                icon={Save}
                                iconPlacement="right"
                                onClick={() => handleSubmit('update')} disabled={isSubmitting} className={` ${action === 'Update' && 'bg-blue-800 hover:bg-blue-700 duration-300'} w-28`}>
                                {action === 'Add' ? isSubmitting ? "Saving..." : "Save" : isSubmitting ? "Updating..." : "Update"}
                            </Button>

                        </div>
                    </div>


                </DialogTitle>
                <div className="bg-white h-full overflow-y-auto p-2 rounded-md">
                    <div className="h-[50%] flex flex-col pr-2 pl-1 my-1">
                        <form className="h-[50%] flex flex-col">
                            <Tabs defaultValue="Billing" className="h-[50%]">
                                <TabsList width="full" className="bg-slate-300 text-slate-800 mb-2">
                                    <TabsTrigger value="Billing" width="full" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
                                        Billing Details
                                    </TabsTrigger>
                                    <TabsTrigger value="Deduction" width="full" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
                                        Deduction Details
                                    </TabsTrigger>
                                    <TabsTrigger value="Account" width="full" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
                                        Account Details
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="Billing" className="h-full min-h-[400px]">

                                    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4`}>
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
                                                                const now = new Date();

                                                                // Set first day of previous month at midnight UTC
                                                                const firstOfPrevMonth = new Date(Date.UTC(
                                                                    now.getUTCFullYear(),
                                                                    now.getUTCMonth() - 1,
                                                                    1,
                                                                    0, 0, 0
                                                                ));
                                                                return (
                                                                    <div>

                                                                        <DatePicker
                                                                            currentDate={formData[field.name] || firstOfPrevMonth?.toISOString() || undefined}
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

                                </TabsContent>

                                <TabsContent value="Deduction" className="h-full min-h-[400px]">
                                    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4`}>
                                        {deductionField?.map((field, index) => (
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
                                </TabsContent>
                                <TabsContent value="Account" className="h-full min-h-[400px]">
                                    <div className="h-full">
                                        <div className="">
                                            {packageDetail?.map((item: any, index: any) => (
                                                <div key={index} className="text-sm border border-slate-300 rounded-md p-1">
                                                    <p className="p-1 flex flex-col"><span className=" font-semibold">Account No</span> {item?.name}</p>
                                                    <p className="p-1 flex flex-col"><span className="font-semibold">Package Amount</span> {Number(item?.package?.amount).toFixed(2)} Dhs</p>
                                                    <p className="p-1 flex flex-col"><span className="font-semibold">Provider</span> {item?.provider?.name}</p>
                                                    <p className="p-1 flex flex-col"><span className="font-semibold">Department</span> {item?.employee ? item?.employee?.department?.name : item?.others?.department?.name}</p>
                                                    <p className="p-1 flex flex-col"><span className="font-semibold">Employee</span> {item?.employee?.displayName?.toProperCase()}</p>
                                                    <p className="p-1 flex flex-col"><span className="font-semibold">Others</span> {item?.others?.name}</p>
                                                    <p className="p-1 flex flex-col"><span className="font-semibold">Company</span> {item?.company?.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>


                        </form>
                    </div>
                </div>


            </DialogContent>
        </Dialog>
    );
}

export default DynamicDialog;
