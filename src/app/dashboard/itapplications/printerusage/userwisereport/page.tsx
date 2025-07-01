"use client";

import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponentReports'
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
import { set } from 'lodash';

const page = () => {
    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);

    const [selectedMonth, setSelectedMonth] = useState(prevMonthDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(prevMonthDate.getFullYear());
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

    const { data: departmentData = [], isLoading: departmentLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.DEPARTMENT_MASTER,
        filter: { isActive: true },
        sort: { name: 'asc' },
    });


    const [createMaster, { isLoading: isCreatingMaster }] = useCreateMasterMutation();

    const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

    const loading = printerUsageLoading || printerLoading || accountLoading || departmentLoading;

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

    // printerUsageData = your array from the backend
    // 🔧 Selected month/year (June = 5, because 0-indexed)


    // 📆 Calculate previous month and year
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    console.log('Selected Month:', prevMonth, 'Selected Year:', prevYear);
    // 🧠 Grouped data
    const groupedCurrent: any = {};
    const groupedPrevious: any = {};

    transformedData?.forEach(entry => {
        const department = entry.jobAccount?.employee?.department?.name;
        const employeeName = entry.jobAccount?.employee?.displayName?.toProperCase() || '';
        const employeeAccountId = entry.jobAccount?.name;
        const key = `${employeeAccountId}-${employeeName}`;

        const entryDate = new Date(entry.date); // or the correct date field from your data

        const entryMonth = entryDate.getMonth();
        const entryYear = entryDate.getFullYear();

        const bwCopy = entry.copyBw || 0;
        const colorCopy = entry.copyColor || 0;
        const bwPrint = entry.printBw || 0;
        const colorPrint = entry.printColor || 0;

        const isCurrent = entryMonth === selectedMonth && entryYear === selectedYear;
        const isPrevious = entryMonth === prevMonth && entryYear === prevYear;

        const targetGroup = isCurrent ? groupedCurrent : isPrevious ? groupedPrevious : null;

        if (targetGroup) {

            if (!targetGroup[department]) targetGroup[department] = {};
            if (!targetGroup[department][key]) {
                targetGroup[department][key] = {
                    id: employeeAccountId,
                    name: employeeName,
                    bwCopy: 0,
                    colorCopy: 0,
                    bwPrint: 0,
                    colorPrint: 0,
                };
            }

            targetGroup[department][key].bwCopy += bwCopy;
            targetGroup[department][key].colorCopy += colorCopy;
            targetGroup[department][key].bwPrint += bwPrint;
            targetGroup[department][key].colorPrint += colorPrint;
        }
    });


    const formattedData: any[] = [];
    let serial = 1;

    Object.entries(groupedCurrent).forEach(([dept, employees]: [string, any]) => {
        const entries = Object.entries(employees);

        // Initialize department totals
        let deptNetBwCopy = 0;
        let deptNetColorCopy = 0;
        let deptNetBwPrint = 0;
        let deptNetColorPrint = 0;

        entries.forEach(([key, current]: [string, any], index) => {
            const previous = groupedPrevious?.[dept]?.[key] || {
                bwCopy: 0,
                colorCopy: 0,
                bwPrint: 0,
                colorPrint: 0,
            };

            const netBwCopy = Math.max(0, current.bwCopy - previous.bwCopy);
            const netColorCopy = Math.max(0, current.colorCopy - previous.colorCopy);
            const netBwPrint = Math.max(0, current.bwPrint - previous.bwPrint);
            const netColorPrint = Math.max(0, current.colorPrint - previous.colorPrint);
            const netBw = netBwCopy + netBwPrint;
            const netColor = netColorCopy + netColorPrint;
            const total = netBw + netColor;

            // Accumulate department totals
            deptNetBwCopy += netBwCopy;
            deptNetColorCopy += netColorCopy;
            deptNetBwPrint += netBwPrint;
            deptNetColorPrint += netColorPrint;

            formattedData.push({
                serial: serial++,
                department: index === 0 ? dept : "",
                departmentName: dept,
                id: current.id,
                userName: current.name,
                netCopyBw: netBwCopy,
                netCopyColor: netColorCopy,
                netPrintBw: netBwPrint,
                netPrintColor: netColorPrint,
                bw: netBw,
                color: netColor,
                total: total,
            });
        });

        // Insert department total row
        formattedData.push({
            serial: "", // Or something like 'Total'
            department: '',
            departmentName: dept,
            id: "",
            userName: "",
            netCopyBw: deptNetBwCopy,
            netCopyColor: deptNetColorCopy,
            netPrintBw: deptNetBwPrint,
            netPrintColor: deptNetColorPrint,
            bw: deptNetBwCopy + deptNetBwPrint,
            color: deptNetColorCopy + deptNetColorPrint,
            total: deptNetBwCopy + deptNetColorCopy + deptNetBwPrint + deptNetColorPrint,
            isTotalRow: true // optional: helps if you want to style it differently
        });
    });

    console.log('Formatted Data:', formattedData);

    const accountIds = accountData?.data
        ?.filter((acc: undefined) => acc !== undefined)  // Remove undefined entries
        ?.map((acc: { _id: any; name: any }) => ({ _id: acc.name, name: acc.name }));

    const departments = departmentData?.data
        ?.filter((acc: undefined) => acc !== undefined)  // Remove undefined entries
        ?.map((acc: { _id: any; name: any }) => ({ _id: acc.name, name: acc.name }));

    const monthData = [
        { _id: 1, name: "January" },
        { _id: 2, name: "February" },
        { _id: 3, name: "March" },
        { _id: 4, name: "April" },
        { _id: 5, name: "May" },
        { _id: 6, name: "June" },
        { _id: 7, name: "July" },
        { _id: 8, name: "August" },
        { _id: 9, name: "September" },
        { _id: 10, name: "October" },
        { _id: 11, name: "November" },
        { _id: 12, name: "December" }
    ];

    const years = [];

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (currentMonth === 12) {
        for (let year = 2020; year <= currentYear + 1; year++) {
            years.push(year);
        }
    }
    else {
        for (let year = 2020; year <= currentYear; year++) {
            years.push(year);
        }
    };

    const yearData = years.map((year) => ({
        _id: year,
        name: year
    }));

    const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string }> = [

        { label: 'Account Id', name: "jobAccount", type: "select", required: true, placeholder: 'Select Account Id', format: 'ObjectId', data: accountData?.data },
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
            roleData: [], continentData: [], regionData: [], countryData: [], locationData: [], categoryData: [], vendorData: [], productData: [], warehouseData: [], customerTypeData: [], customerData: [], userData: [], teamData: [], designationData: [], departmentData: [], employeeTypeData: [], organisationData: [], action: "Add", user, createUser: createMaster, db: MONGO_MODELS.PRINTER_USAGE, masterName: "PrinterUsage", onStart: () => setImporting(true),
            onFinish: () => setImporting(false)
        });
    };

    const exportPrinterReportToPDF = (data, selectedMonth, selectedYear) => {
        const month = monthData.find((m) => m._id === selectedMonth)?.name;

        const doc = new jsPDF();
        const title = `User Wise Summary Report Of B&W - Color Printing For ${month} ${selectedYear}`;
        doc.setFontSize(12); // Set a smaller font size (adjust as needed)
        doc.setFont("helvetica", "bold"); // Set font to bold
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = doc.getTextWidth(title);
        const x = (pageWidth - textWidth) / 2; // Centered X position

        doc.text(title, x, 15);
        console.log('Formatted Data for PDF:', data);
        const rows = data.map((data: any) => ([
            data?.serial || '',
            data?.department || '',
            data?.id || '',
            data?.employee || '',
            data?.bw ?? '',
            data?.color ?? '',
            data?.total ?? '',

        ]));

        autoTable(doc, {
            startY: 20,
            head: [['SN#', 'Department', 'Account ID', 'Employee', 'B&W', 'Color', 'Total']],
            body: rows,
            columnStyles: {
                4: { halign: 'right' }, // B&W
                5: { halign: 'right' }, // Color
                6: { halign: 'right' }, // Total
            },
            didParseCell: function (cellData) {
                const rowIndex = cellData.row.index;
                const rowData = data[rowIndex];
                if (rowData?.isTotalRow) {
                    cellData.cell.styles.fontStyle = 'bold';
                    cellData.cell.styles.fillColor = [243, 244, 246]; // Light gray background
                } else {
                    if (cellData.section !== 'head') {
                        cellData.cell.styles.fillColor = [255, 255, 255];
                    }
                }

                // Align numeric headers right
                if (cellData.section === 'head' && [4, 5, 6].includes(cellData.column.index)) {
                    cellData.cell.styles.halign = 'right';
                }
            },
        });

        doc.save(`Printer_Usage_Report_${month}_${selectedYear}.pdf`);
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
        console.log('Exporting data:', data);
        if (data?.length > 0) {
            formattedData = data?.map((data: any) => ({
                "No#": data?.serial,
                "Department": data?.department || '',
                "Account Id": data?.id || '',
                "Employee": data?.userName || '',
                "B & W": data?.bw ?? '0',
                "Color": data?.color ?? '0',
                "Total": data?.total ?? '0',

            }));
        } else {
            // Create a single empty row with keys only (for header export)
            formattedData = [{
                "No#": '',
                "Department": '',
                "Account Id": '',
                "Employee": '',
                "B & W": '',
                "Color": '',
                "Total": '',

            }];
        }

        type === 'excel' && exportToExcel(formattedData);
        type === 'pdf' && exportPrinterReportToPDF(data, selectedMonth, selectedYear);

    };


    const handleDelete = () => {
        console.log('UserPage Delete button clicked');
        // Your delete logic for user page
    };

    console.log('printerUsageData', printerUsageData);

    const columns = [
        {
            accessorKey: "serial",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>No#</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("serial")}</div>,
        },
        {
            accessorKey: "department",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Department</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => <div >{row.getValue("department")}</div>,
        },

        {
            accessorKey: "id",
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
            cell: ({ row }: { row: any }) => <div >{row.getValue("id")}</div>,
        },

        {
            accessorKey: "userName",
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
            cell: ({ row }: { row: any }) => <div >{row.getValue("userName")}</div>,
        },
        {
            accessorKey: "bw",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>B & W</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => {
                const isTotal = row.original.isTotalRow;
                return <div className={isTotal ? 'font-bold text-black' : ''}>{row.getValue("bw")}</div>;
            }
        },
        {
            accessorKey: "color",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Color</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => {
                const isTotal = row.original.isTotalRow;
                return <div className={isTotal ? 'font-bold text-black' : ''}>{row.getValue("color")}</div>;
            }
        },
        {
            accessorKey: "total",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Total</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: { row: any }) => {
                const isTotal = row.original.isTotalRow;
                return <div className={isTotal ? 'font-bold text-black' : ''}>{row.getValue("total")}</div>;
            }
        },

    ];

    const onchangeData = async ({ id, fieldName, name, parentId, position, email, phone, location }: { id: number; fieldName: string; name: string; parentId?: string; position?: string; email?: string; phone?: string; location?: string }) => {

        switch (fieldName) {
            case "currentMonth":
                setSelectedMonth(id);
                break;

            case "currentYear":
                setSelectedYear(id);
                break;

            default:
                break;
        }


    }

    const accountConfig = {
        searchFields: [

        ],
        filterFields: [
            { key: "currentMonth", label: 'currentMonth', type: "select" as const, data: monthData, placeholder: 'Search by month', name: 'currentMonth' },
            { key: "currentYear", label: 'currentYear', type: "select" as const, data: yearData, placeholder: 'Search by year', name: 'currentYear' },

            { key: "jobAccount", label: 'id', type: "select" as const, data: accountIds, placeholder: 'Search by Account Id', name: 'id' },
            { key: "department", label: 'departmentName', type: "select" as const, data: departments, placeholder: 'Search by department', name: 'departmentName' },
        ],
        dataTable: {
            columns: columns,
            data: Array.isArray(formattedData) ? formattedData : formattedData,
        },
        buttons: [


            {
                label: 'Export', action: handleExport, icon: Upload, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                    { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },
                    { label: "Export to PDF", value: "pdf", action: (type: string, data: any) => handleExport(type, data) },
                ]
            },

        ]
    };

    const rowClassMap = (row: any) => {
        if (row?.isTotalRow) return "bg-gray-100 font-bold";
        if (row?.status) return {
            approved: "bg-green-100",
            pending: "bg-yellow-100",
            rejected: "bg-red-100",
        }[row.status] || "";
        return "";
    };


    return (
        <>

            <MasterComponent config={accountConfig} loadingState={loading} rowClassMap={rowClassMap} summary={false} onchangeData={onchangeData} />
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