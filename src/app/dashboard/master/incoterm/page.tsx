"use client";

import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponent'
import DashboardLoader from '@/components/ui/DashboardLoader'
import { ArrowUpDown, ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react"
import { DataTable } from '@/components/TableComponent/TableComponent'
import { Plus, Import, Download, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { useGetUsersQuery } from '@/services/endpoints/usersApi';
import { organisationTransformData } from '@/lib/utils';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { useCreateMasterMutation, useGetMasterQuery } from '@/services/endpoints/masterApi';
import { MONGO_MODELS, SUCCESS } from '@/shared/constants';
import { toast } from 'react-toastify';
import { RowExpanding } from '@tanstack/react-table';
import { createMasterData } from '@/server/services/masterDataServices';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import { bulkImport } from '@/shared/functions';
import * as XLSX from "xlsx";

const page = () => {
  const [importing, setImporting] = useState(false);
  const { user, status, authenticated } = useUserAuthorised();
  const { data: incotermData = [], isLoading: incotermLoading }: any = useGetMasterQuery({
    db: MONGO_MODELS.INCOTERM_MASTER,
    sort: { name: -1 },
  });


  const [createMaster, { isLoading: isCreatingMaster }]: any = useCreateMasterMutation();

  const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

  const loading = incotermLoading;


  interface RowData {
    id: string;
    name: string;
    email: string;
    role: string;
  }


  const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string }> = [

    { label: 'Incoterm', name: "name", type: "text", required: true, placeholder: 'Incoterm' },
    { label: 'Description', name: "description", type: "text", placeholder: 'Description' },
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
      db: MONGO_MODELS.INCOTERM_MASTER,
      action: action === 'Add' ? 'create' : 'update',
      filter: { "_id": formData._id },
      data: formData,
    };



    const response = await createMaster(formattedData);


    if (response.data?.status === SUCCESS && action === 'Add') {
      toast.success('Incoterm added successfully');

    }
    else {
      if (response.data?.status === SUCCESS && action === 'Update') {
        toast.success('Incoterm updated successfully');
      }
    }

    if (response?.error?.data?.message?.message) {
      toast.error(`Error encountered: ${response?.error?.data?.message?.message}`);
    }

  };


  const editUser = (rowData: RowData) => {
    setAction('Update');
    setInitialData(rowData);
    openDialog("incoterm");
    // Your add logic for user page
  };

  const handleAdd = () => {
    setInitialData({});
    setAction('Add');
    openDialog("incoterm");

  };


  const handleImport = async () => {
    await bulkImport({
      roleData: [], continentData: [], regionData: [], countryData: [], locationData: [], categoryData: [], vendorData: [], productData: [], warehouseData: [], customerTypeData: [], customerData: [], userData: [], teamData: [], designationData: [], departmentData: [], employeeTypeData: [], organisationData: [], action: "Add", user, createUser: createMaster, db: MONGO_MODELS.INCOTERM_MASTER, masterName: "Incoterm", onStart: () => setImporting(true),
      onFinish: () => setImporting(false)
    });
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
        'Name': data?.name,
        'Description': data?.description,

      }));
    } else {
      // Create a single empty row with keys only (for header export)
      formattedData = [{
        'Name': '',
        'Description': '',

      }];
    }

    type === 'excel' && exportToExcel(formattedData);

  };


  const handleDelete = () => {
    console.log('UserPage Delete button clicked');
    // Your delete logic for user page
  };



  const incotermColumns = [
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
      accessorKey: "name",
      header: ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();

        return (
          <button
            className="group  flex items-center space-x-2 w-[100px]"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            <span>Incoterm</span>
            <ChevronsUpDown
              size={15}
              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            />
          </button>
        );
      },
      cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editUser(row.original)}>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();

        return (
          <button
            className="group  flex items-center space-x-2 w-[100px]"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            <span>Description</span>
            <ChevronsUpDown
              size={15}
              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            />
          </button>
        );
      },
      cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editUser(row.original)}>{row.getValue("description")}</div>,
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

  const incotermConfig = {
    searchFields: [
      { key: "name", label: 'name', type: "text" as const, placeholder: 'Search by incoterm' },

    ],
    filterFields: [
      // { key: "role", label: 'roleName', type: "select" as const, options: roleNames },

    ],
    dataTable: {
      columns: incotermColumns,
      data: incotermData?.data,
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

      <MasterComponent config={incotermConfig} loadingState={loading} rowClassMap={undefined} summary={false} />
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