"use client";

import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponent'
import { ArrowUpDown, ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react"
import { Plus, Import, Download, Upload, SendHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { useGetUsersQuery } from '@/services/endpoints/usersApi';
import DynamicDialog from '@/components/ModalComponent/ModelComponentBilling';
import { useCreateMasterMutation, useGetMasterQuery } from '@/services/endpoints/masterApi';
import { MONGO_MODELS, SUCCESS } from '@/shared/constants';
import { toast } from 'react-toastify';
import { RowExpanding } from '@tanstack/react-table';
import { createMasterData } from '@/server/services/masterDataServices';
import { bulkImport } from '@/shared/functions';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import * as XLSX from "xlsx";
import moment from 'moment';
import { transformData } from '@/lib/utils';
import { title } from 'process';

const page = () => {
    const [importing, setImporting] = useState(false);
    const { user, status, authenticated } = useUserAuthorised();

    const { data: usageData = [], isLoading: usageLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.USAGE_DETAIL,
        sort: { account: 'asc' },
    });

    const { data: deductionTypeData = [], isLoading: deductionTypeLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.DEDUCTION_TYPE_MASTER,
        sort: { name: 'asc' },
    });



    const mergedUsageData = usageData?.data?.map(usage => {
        const actualDeductions = usage?.deductions || [];

        const mergedDeductions = deductionTypeData?.data?.map(dt => {
            const match = actualDeductions?.find(d => d.deductionType?._id === dt._id);
            return {
                deductionType: {
                    _id: dt._id,
                    name: dt.name,
                    description: dt.description,
                    provider: dt.provider
                },
                amount: match ? match.amount : 0
            };
        });

        return {
            ...usage,
            deductions: mergedDeductions
        };
    });

    console.log(mergedUsageData);

    const { data: thresholdData = [], isLoading: thresholdLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.THRESHOLD_AMOUNT,
        sort: { account: 'asc' },
    });
    const { data: accountData = [], isLoading: accountLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.ACCOUNT_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: departmentData = [], isLoading: departmentLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.DEPARTMENT_MASTER,
        sort: { name: 'asc' },
    });

    const { data: employeeData = [], isLoading: employeeLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.USER_MASTER,
        sort: { name: 'asc' },
    });

    const { data: companyData = [], isLoading: companyLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.ORGANISATION_MASTER,
        sort: { name: 'asc' },
    });

    const { data: deductionData = [], isLoading: deductionLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.DEDUCTION_TYPE_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const departmentNames = departmentData?.data
        ?.filter((dep: undefined) => dep !== undefined)  // Remove undefined entries
        ?.map((dep: { _id: any; name: any }) => ({ _id: dep?.name, name: dep?.name }));


    const filteredData = usageData?.data?.filter((item: any) => item?.finalDeduction > thresholdData?.data?.[0]?.amount);

    const fieldsToAdd1 = [
        { fieldName: 'accountNumber', path: ['account', 'name'] },
        { fieldName: 'employee', path: ['account', 'employee'] },
        { fieldName: 'company', path: ['account', 'company'] },

    ];

    const transformedData1: any = transformData(filteredData, fieldsToAdd1);
    const fieldToAdd2 = [

        { fieldName: 'employeeName', path: ['employee', '_id'] },
        { fieldName: 'department', path: ['employee', 'department'] },
        { fieldName: 'companyName', path: ['company', 'name'] },

    ];

    const transformedData2: any = transformData(transformedData1, fieldToAdd2);

    const fieldToAdd = [

        { fieldName: 'departmentName', path: ['department', 'name'] },

    ];

    const transformedData: any = transformData(transformedData2, fieldToAdd);


    const [createMaster, { isLoading: isCreatingMaster }] = useCreateMasterMutation();

    const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

    const loading = usageLoading || accountLoading || employeeLoading || companyLoading || deductionLoading || thresholdLoading || deductionTypeLoading;

    interface RowData {
        id: string;
        name: string;
        email: string;
        role: string;
    }
    const accountNames = accountData?.data
        ?.filter((acc: undefined) => acc !== undefined)  // Remove undefined entries
        ?.map((acc: { _id: any; name: any }) => ({ _id: acc.name, name: acc.name }));

    const employeeNames = employeeData?.data
        ?.filter((emp: undefined) => emp !== undefined)  // Remove undefined entries
        ?.map((emp: { _id: any; displayName: any }) => ({ _id: emp?._id, name: emp?.displayName }));

    const companyNames = companyData?.data
        ?.filter((comp: undefined) => comp !== undefined)  // Remove undefined entries
        ?.map((comp: { _id: any; name: any }) => ({ _id: comp?.name, name: comp?.name }));

    console.log(accountNames);
    const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string }> = [

        { label: 'Account Number', name: "account", type: "select", required: true, placeholder: 'Select Account', format: 'ObjectId', data: accountData?.data },
        { label: 'Billing Start Date', name: "billingPeriodStart", type: "date", format: 'Date', placeholder: 'Select Bill Start Date' },
        { label: 'Gross Bill Amount', name: "grossBillAmount", type: "number", required: true, placeholder: 'Gross Bill Amount' },
        { label: 'One Time Charge', name: "oneTimeCharge", type: "number", required: false, placeholder: 'One Time Charge' },
        { label: 'Vat', name: "vat", type: "number", required: true, readOnly: true, placeholder: 'Vat' },
        { label: 'Net Bill Amount', name: "netBillAmount", type: "number", required: false, readOnly: true, placeholder: 'Net Bill Amount' },
        { label: 'Outstanding Amount', name: "outstandingAmount", type: "number", required: false, placeholder: 'Net Bill Amount' },
        { label: 'Total Amount Due', name: "totalAmountDue", type: "number", required: false, readOnly: true, placeholder: 'Net Bill Amount' },
        { label: 'Total Deduction', name: "totalDeduction", type: "number", required: false, readOnly: true, placeholder: 'Net Bill Amount' },
        { label: 'Waived Amount', name: "waivedAmount", type: "number", required: false, placeholder: 'Net Bill Amount' },
        { label: 'Final Deduction Amount', name: "finalDeduction", type: "number", required: false, readOnly: true, placeholder: 'Net Bill Amount' },
        { label: 'Remarks', name: "remarks", type: "text", required: false, placeholder: 'Net Bill Amount' },
    ]

    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedMaster, setSelectedMaster] = useState(""); // This will track the master type (department, role, etc.)
    const [initialData, setInitialData] = useState({});
    const [action, setAction] = useState('Add');

    // Open the dialog and set selected master type
    const openDialog = (masterType: React.SetStateAction<string>) => {
        setSelectedMaster(masterType);

        setDialogOpen(true);
    };

    // Close dialog
    const closeDialog = () => {
        setDialogOpen(false);
        setSelectedMaster("");
    };

    // Save function to send data to an API or database
    const saveData = async ({ formData, action }: { formData: any; action: string }) => {
        console.log(formData);
        console.log(usageData?.data);
        function formatDate(dateString) {
            const d = new Date(dateString);
            return d.toLocaleDateString('en-GB'); // "dd/MM/yyyy"
        };
        const exists = usageData?.data?.some(item =>
            item.account?._id === formData?.account &&
            formatDate(item?.billingPeriodStart) === formatDate(formData?.billingPeriodStart)
        );

        if (exists) {
            toast.error("Data entry for this account for the selected month is already exists.");
            return;
        }
        else {
            const formattedData = {
                db: MONGO_MODELS.USAGE_DETAIL,
                action: action === 'Add' ? 'create' : 'update',
                filter: { "_id": formData._id },
                data: formData,
            };

            const response: any = await createMaster(formattedData);

            return response;
        }


    };


    const editUser = (rowData: RowData) => {
        setAction('Update');
        setInitialData(rowData);
        openDialog("usage detail");
        // Your add logic for user page
    };

    const handleAdd = () => {
        setInitialData({});
        setAction('Add');
        openDialog("usage detail");

    };


    const handleImport = () => {
        bulkImport({
            roleData: [], continentData: [], regionData: [], countryData: [], locationData: [], categoryData: [], vendorData: [], productData: [], warehouseData: [], customerTypeData: [], customerData: [], userData: [], teamData: [], designationData: [], departmentData: [], employeeTypeData: [], organisationData: [], action: "Add", user, createUser: createMaster, db: MONGO_MODELS.USAGE_DETAIL, masterName: "UsageDetail", onStart: () => setImporting(true),
            onFinish: () => setImporting(false)
        });
    };

    const exportToExcel = (data: any[]) => {

        // Convert JSON data to a worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        const targetColumns = ['D', 'E', 'F', 'G', 'H', 'I'];

        // Apply format to each cell in columns D to I
        Object.keys(worksheet).forEach(cell => {
            if (!cell.startsWith('!')) {
                const match = cell.match(/[A-Z]+/); // safely check match result
                if (match) {
                    const col = match[0];
                    if (['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'].includes(col)) {
                        worksheet[cell].z = '0.00';
                    }
                }
            }
        });
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        // Write the workbook and trigger a download
        XLSX.writeFile(workbook, 'exported_data.xlsx');
    };

    const handleExport = (type: string, data: any) => {
        let formattedData: any[] = [];
        if (data?.length > 0) {
            formattedData = data.map((dataItem: any) => {
                const baseData = {
                    "Account Number": dataItem?.account?.name,
                    "Employee": dataItem?.employee?.displayName?.toProperCase(),
                    "Department": dataItem?.employee?.department?.name,

                };

                // Map dynamic deduction columns
                const deductionColumns = {};
                deductionTypeData?.data?.forEach((deductionType: any) => {
                    const match = dataItem?.deductions?.find(
                        (d: any) => d?.deductionType?._id === deductionType._id
                    );

                    deductionColumns[deductionType?.name.trim()] = match
                        ? Number(parseFloat(match.amount).toFixed(2))
                        : 0.0;
                });

                return {
                    ...baseData,
                    ...deductionColumns,
                    "Total Deduction Amount": Number(parseFloat(dataItem?.totalDeduction)?.toFixed(2)),
                };
            });
        } else {
            // Create an empty row with all possible keys
            const staticHeaders = {
                "Account Number": '',
                "Employee": '',
                "Department": '',

            };

            const dynamicHeaders = deductionTypeData?.data?.reduce((acc: any, dt: any) => {
                acc[dt.name.trim()] = '';
                return acc;
            }, {}) || {};

            formattedData = [{
                ...staticHeaders,
                ...dynamicHeaders,
                "Total Deduction Amount": '',
            }];
        }


        type === 'excel' && exportToExcel(formattedData);

    };

    const handleEmail = () => {
        console.log('UserPage Delete button clicked');

        // Your delete logic for user page
    };

    const handleDelete = () => {
        console.log('UserPage Delete button clicked');
        // Your delete logic for user page
    };



    const usageColumns1 = [
        {
            id: "select",
            header: ({ table }: { table: any }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }: { row: any }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },

        {
            accessorKey: "account",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Account No</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("account")?.name}</div>,
        },

        {
            accessorKey: "employee",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Employee</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("account")?.employee?.displayName?.toProperCase()}</div>,
        },



    ];

    // Assuming `deductionTypes` is the array you provided.
    const dynamicDeductionColumns = (deductionTypeData?.data ?? [])?.map((deduction) => ({
        accessorKey: deduction._id, // Or use a unique key related to the data
        header: ({ column }: { column: any }) => {
            const isSorted = column.getIsSorted();

            return (
                <button
                    className="group flex items-center space-x-2"
                    onClick={() => column.toggleSorting(isSorted === "asc")}
                >
                    <span>{deduction.name.trim()}</span>
                    <ChevronsUpDown
                        size={15}
                        className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    />
                </button>
            );
        },
        cell: ({ row }: { row: any }) => {
            // Assuming data in row is like: { deductions: { [deductionId]: number } }
            const match = row.original.deductions?.find(
                (d: any) => d.deductionType?._id === deduction._id
            );
            console.log(match, 'match')
            const value = match?.amount || 0;

            console.log(value);
            // const value = row.original.deductions?.[deduction._id];
            return <div>{value ? parseFloat(value).toFixed(2) : "0.00"}</div>;
        },
    }));

    // Combine static and dynamic columns
    const usageColumns = [
        ...usageColumns1,
        ...dynamicDeductionColumns,
        {
            accessorKey: "totalDeduction", // ✅ fixed spelling
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Total Deduction</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => (
                <div>{parseFloat(row.getValue("totalDeduction")).toFixed(2)}</div>
            ),
        },
    ];



    const usageConfig = {
        title: 'Deduction Summary',
        searchFields: [
            // { key: "name", label: 'name', type: "text" as const, placeholder: 'Search by account' },
            { key: "billMonth", label: 'billingPeriodStart', type: "date" as const, data: accountNames, placeholder: 'Search by Bill Start Date' },
        ],
        filterFields: [
            { key: "account", label: 'accountNumber', type: "select" as const, data: accountNames, placeholder: 'Search by Account', name: 'accountNumber' },
            { key: "employee", label: 'employeeName', type: "select" as const, data: employeeNames, placeholder: 'Search by Employee', name: 'employeeName' },
            { key: "department", label: 'departmentName', type: "select" as const, data: departmentNames, placeholder: 'Search by Department', name: 'departmentName' },
            { key: "company", label: 'companyName', type: "select" as const, data: companyNames, placeholder: 'Search by Company', name: 'companyName' },

        ],
        dataTable: {
            columns: usageColumns,
            data: Array.isArray(transformedData) ? transformedData : transformedData?.data,
        },
        buttons: [

            { label: importing ? 'Sending...' : 'Email', action: handleEmail, icon: SendHorizontal, className: 'bg-blue-600 hover:bg-blue-700 duration-300', },
            {
                label: 'Export', action: handleExport, icon: Upload, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                    { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },
                    { label: "Export to PDF", value: "pdf", action: (type: string, data: any) => handleExport(type, data) },
                ]
            },
            // { label: 'Add', action: handleAdd, icon: Plus, className: 'bg-sky-600 hover:bg-sky-700 duration-300' },
        ]
    };


    return (
        <>

            <MasterComponent config={usageConfig} loadingState={loading} rowClassMap={undefined} summary={true} />
            <DynamicDialog
                isOpen={isDialogOpen}
                closeDialog={closeDialog}
                selectedMaster={selectedMaster}
                onSave={saveData}
                fields={fields}
                initialData={initialData}
                deductionData={deductionData}
                accountData={accountData}
                action={action}
                height='auto'
                onchangeData={() => { }}
            />
        </>

    )
}

export default page