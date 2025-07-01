"use client";

import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponent'
import { ArrowUpDown, ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react"
import { Plus, Import, Download, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { organisationTransformData } from '@/lib/utils';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { useCreateMasterMutation, useGetMasterQuery } from '@/services/endpoints/masterApi';
import { SUCCESS } from '@/shared/constants';
import { toast } from 'react-toastify';
import { RowExpanding } from '@tanstack/react-table';
import { createMasterData } from '@/server/services/masterDataServices';
import { bulkImport } from '@/shared/functions';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import * as XLSX from "xlsx";


const page = () => {
  const [importing, setImporting] = useState(false);
  const { user, status, authenticated } = useUserAuthorised();
  const { data: departmentData = [], isLoading: departmentLoading }: any = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    sort: { name: -1 },
  });
  console.log("departmentData", departmentData);
  const [createMaster, { isLoading: isCreatingMaster }]:any = useCreateMasterMutation();

  const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

  const loading = departmentLoading;


  interface RowData {
    id: string;
    name: string;
    email: string;
    role: string;
  }


  const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string }> = [
    { label: 'Department Id', name: "depId", type: "text", required: true, placeholder: 'Department Id' },
    { label: 'Department Name', name: "name", type: "text", required: true, placeholder: 'Department Name' },
    { label: 'Status', name: "isActive", type: "select", data: statusData, placeholder: 'Select Status' },

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

    const formattedData = {
      db: 'DEPARTMENT_MASTER',
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
    openDialog("department");
    // Your add logic for user page
  };

  const handleAdd = () => {
    setInitialData({});
    setAction('Add');
    openDialog("department");

  };


  const handleImport = () => {
    bulkImport({
      roleData: [], continentData: [], regionData: [], countryData: [], locationData: [], categoryData: [], vendorData: [], productData: [], warehouseData: [], customerTypeData: [], customerData: [], userData: [], teamData: [], designationData: [], departmentData: [], employeeTypeData: [], organisationData: [], action: "Add", user, createUser: createMaster, db: "DEPARTMENT_MASTER", masterName: "Department", onStart: () => setImporting(true),
      onFinish: () => setImporting(false)
    });
  };


  const handleExport = (type: string, data: any) => {
    let formattedData: any[] = [];

    if (departmentData?.data?.length > 0) {
      formattedData = departmentData.data.map((data: any) => ({
        'Department Id': data?.depId,
        'Department': data?.name,
      }));
    } else {
      // Create a single empty row with keys only (for header export)
      formattedData = [{
        'Department Id': '',
        'Department': '',
      }];
    }

    type === 'excel' && exportToExcel(formattedData);

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

  const handleDelete = () => {
    console.log('UserPage Delete button clicked');
    // Your delete logic for user page
  };



  const departmentColumns = [
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
      accessorKey: "depId",
      header: ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();

        return (
          <button
            className="group  flex items-center space-x-2"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            <span>Department Id</span>
            <ChevronsUpDown
              size={15}
              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            />
          </button>
        );
      },
      cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editUser(row.original)}>{row.getValue("depId")}</div>,
    },
    {
      accessorKey: "name",
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
      cell: ({ row }: { row: any }) => <div>{row.getValue("name")}</div>,
    },

    {
      accessorKey: "isActive",
      header: ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();

        return (
          <button
            className="group  flex items-center space-x-2 w-[100px]"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            <span>Status</span>
            <ChevronsUpDown
              size={15}
              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            />
          </button>
        );
      },
      cell: ({ row }: { row: any }) => <div>{statusData.find(status => status._id === row.getValue("isActive"))?.name}</div>,
    },



  ];

  const departmentConfig = {
    searchFields: [
      { key: "name", label: 'name', type: "text" as const, placeholder: 'Search by department' },

    ],
    filterFields: [
    ],
    dataTable: {
      columns: departmentColumns,
      data: departmentData?.data,
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

      <MasterComponent config={departmentConfig} loadingState={loading} rowClassMap={undefined} summary={false} />
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