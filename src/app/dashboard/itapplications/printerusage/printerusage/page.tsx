"use client";

import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponent'
import { ArrowUpDown, ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react"
import { Plus, Import, Download, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { useGetUsersQuery } from '@/services/endpoints/usersApi';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const page = () => {

    const [importing, setImporting] = useState(false);
    const { user, status, authenticated } = useUserAuthorised();
    const { data: printerUsageData = [], isLoading: printerUsageLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.PRINTER_USAGE,
        sort: { name: 'asc' },
    });

    const { data: printerData = [], isLoading: printerLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.PRINTER_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });

    const { data: accountData = [], isLoading: accountLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.JOB_ACCOUNT,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });


    const [createMaster, { isLoading: isCreatingMaster }] = useCreateMasterMutation();

    const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

    const loading = printerUsageLoading || printerLoading || accountLoading;

    interface RowData {
        id: string;
        name: string;
        email: string;
        role: string;
    }


    const fieldsToAdd = [
        { fieldName: 'accountId', path: ['jobAccount', 'name'] },

    ];

    const transformedData: any = transformData(printerUsageData?.data, fieldsToAdd);

    const reformattedData = accountData?.data?.map((item: any) => ({
        _id: item._id,
        name: `${item.name} - ${item?.employee?.displayName}`
    }));


    const accountIds = accountData?.data
        ?.filter((acc: undefined) => acc !== undefined)  // Remove undefined entries
        ?.map((acc: { _id: any; name: any; employee: any }) => ({ _id: acc.name, name: `${acc.name} - ${acc.employee?.displayName || ''}` }));

    const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string }> = [

        { label: 'Account Id', name: "jobAccount", type: "select", required: true, placeholder: 'Select Account Id', format: 'ObjectId', data: reformattedData },
        { label: 'Printer', name: "printer", type: "select", required: true, placeholder: 'Select Printer', format: 'ObjectId', data: printerData?.data },
        { label: 'Copy Color', name: "copyColor", type: "number", required: false, placeholder: 'Copy Color' },
        { label: 'Print Color', name: "printColor", type: "number", required: false, placeholder: 'Print Color' },
        { label: 'Copy BW', name: "copyBw", type: "number", required: false, placeholder: 'Copy BW' },
        { label: 'Print BW', name: "printBw", type: "number", required: false, placeholder: 'Print BW' },
        { label: 'Month End Date', name: "date", type: "date", format: 'Date', placeholder: 'Select Month End Date' },

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

        const inputDate = moment(formData.date);
        const inputMonth = inputDate.month();
        const inputYear = inputDate.year();

        const isDuplicate = printerUsageData?.data?.some((entry: any) => {
            const entryDate = moment(entry.date);

            return (
                entryDate.month() === inputMonth &&
                entryDate.year() === inputYear &&
                entry.printer?._id === formData?.printer &&
                entry.jobAccount?._id === formData?.jobAccount
            );

        });
        if (isDuplicate && action === 'Add') {
            toast.error("Duplicate entry found for the same month, printer, and account.");
            return;
        }

        const formattedData = {
            db: MONGO_MODELS.PRINTER_USAGE,
            action: action === 'Add' ? 'create' : 'update',
            filter: { "_id": formData._id },
            data: formData,
        };

        const response: any = await createMaster(formattedData);

        return response;

    };


    const editUser = (rowData: RowData) => {
        setAction('Update');
        setInitialData(rowData);
        openDialog("printer usage");
        // Your add logic for user page
    };

    const handleAdd = () => {
        setInitialData({});
        setAction('Add');
        openDialog("printer usage");

    };


    const handleImport = () => {
        bulkImport({
            roleData: [], continentData: [], regionData: [], countryData: [], locationData: [], categoryData: [], vendorData: [], productData: [], warehouseData: [], customerTypeData: [], customerData: [], userData: accountData, teamData: printerData, designationData: [], departmentData: [], employeeTypeData: [], organisationData: [], action: "Add", user, createUser: createMaster, db: MONGO_MODELS.PRINTER_USAGE, masterName: "PrinterUsage", onStart: () => setImporting(true),
            onFinish: () => setImporting(false)
        });
    };

    const exportPrinterReportToPDF = () => {
        const doc = new jsPDF();
        const title = `User Wise Summary Report Of B&W - Color Printing For March 2024`;
        doc.text(title, 14, 15);

        doc.save(`Printer_Usage_Report.pdf`);
    };

    const exportToExcel = (data: any[]) => {

        // Convert JSON data to a worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
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
            formattedData = data?.map((data: any) => ({
                "Account Id": data?.jobAccount?.name,
                "Employee": data?.jobAccount?.employee?.displayName?.toProperCase() || '',
                "Printer": data?.printer?.name || '',
                "Date": data?.date ? moment(data.date).format('DD-MM-YYYY') : '',
                "Copy Color": data?.copyColor || '0',
                "Copy BW": data?.copyBw || '0',
                "Print Color": data?.printColor || '0',
                "Print BW": data?.printBw || '0',


            }));
        } else {
            // Create a single empty row with keys only (for header export)
            formattedData = [{
                "Account Id": '',
                "Employee": '',
                "Printer": '',
                "Date": '',
                "Copy Color": '',
                "Copy BW": '',
                "Print Color": '',
                "Print BW": '',

            }];
        }

        type === 'excel' && exportToExcel(formattedData);
        type === 'pdf' && exportPrinterReportToPDF();

    };


    const handleDelete = () => {
        console.log('UserPage Delete button clicked');
        // Your delete logic for user page
    };

    const accountColumns = [
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
            accessorKey: "jobAccount",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Account Id</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editUser(row.original)}>{row.getValue("jobAccount")?.name}</div>,
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
            cell: ({ row }: { row: any }) => <div >{row.getValue("jobAccount")?.employee?.displayName?.toProperCase()}</div>,
        },
        {
            accessorKey: "printer",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Printer</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("printer")?.name}</div>,
        },
        {
            accessorKey: "date",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Date</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("date") && moment(row.getValue("date")).format("DD-MMM-YYYY")}</div>,
        },
        {
            accessorKey: "copyColor",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Copy Color</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("copyColor")}</div>,
        },
        {
            accessorKey: "copyBw",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Copy BW</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("copyBw")}</div>,
        },
        {
            accessorKey: "printColor",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Print Color</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("printColor")}</div>,
        },
        {
            accessorKey: "printBw",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Print BW</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("printBw")}</div>,
        },


    ];

    const accountConfig = {
        searchFields: [

        ],
        filterFields: [
            { key: "jobAccount", label: 'accountId', type: "select" as const, data: accountIds, placeholder: 'Search by Account Id', name: 'accountId' },
        ],
        dataTable: {
            columns: accountColumns,
            data: Array.isArray(transformedData) ? transformedData : transformedData,
        },
        buttons: [

            { label: importing ? 'Importing...' : 'Import', action: handleImport, icon: Download, className: 'bg-blue-600 hover:bg-blue-700 duration-300' },
            {
                label: 'Export', action: handleExport, icon: Upload, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                    { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },
                    { label: "Export to PDF", value: "pdf", action: (type: string, data: any) => handleExport(type, data) },
                ]
            },
            { label: 'Add', action: handleAdd, icon: Plus, className: 'bg-sky-600 hover:bg-sky-700 duration-300' },
        ]
    };


    return (
        <>


            <MasterComponent config={accountConfig} loadingState={loading} rowClassMap={undefined} summary={false} />
            <DynamicDialog
                isOpen={isDialogOpen}
                closeDialog={closeDialog}
                selectedMaster={selectedMaster}
                onSave={saveData}
                fields={fields}
                initialData={initialData}
                action={action}
                height='auto'
                onchangeData={() => { }}
            />
        </>

    )
}

export default page