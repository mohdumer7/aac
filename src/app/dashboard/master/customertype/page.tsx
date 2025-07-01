"use client";

import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponent'
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { Plus, Import, Download, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { useGetUsersQuery } from '@/services/endpoints/usersApi';
import { organisationTransformData } from '@/lib/utils';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { useCreateMasterMutation, useGetMasterQuery } from '@/services/endpoints/masterApi';
import { MONGO_MODELS,SUCCESS } from '@/shared/constants';
import { toast } from 'react-toastify';
import { RowExpanding } from '@tanstack/react-table';
import { createMasterData } from '@/server/services/masterDataServices';
import { bulkImport } from '@/shared/functions';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import * as XLSX from "xlsx";

const page = () => {
   const [importing, setImporting] = useState(false);
const { user, status, authenticated } = useUserAuthorised();
  const { data: customerTypeData = [], isLoading: customerTypeLoading }:any = useGetMasterQuery({
    db: MONGO_MODELS.CUSTOMER_TYPE_MASTER,
    sort: { name: 'asc' },
  });

  const [createMaster, { isLoading: isCreatingMaster }]:any = useCreateMasterMutation();

  const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

  const loading = customerTypeLoading|| isCreatingMaster;


  interface RowData {
    id: string;
    name: string;
    email: string;
    role: string;
  }


  const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string }> = [
    
    { label: 'Customer Type', name: "name", type: "text", required: true, placeholder: 'Customer Type' },
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
        db: MONGO_MODELS.CUSTOMER_TYPE_MASTER,
      action: action === 'Add' ? 'create' : 'update',
      filter: { "_id": formData._id },
      data: formData,
    };



    const response = await createMaster(formattedData);


    return response;
  };


  const editUser = (rowData: RowData) => {
    setAction('Update');
    setInitialData(rowData);
    openDialog("customer type");
    // Your add logic for user page
  };

  const handleAdd = () => {
    setInitialData({});
    setAction('Add');
    openDialog("customer type");

  };

 
  const handleImport = async() => {
     
      await bulkImport({ roleData: [], continentData: [], regionData: [], countryData: [], locationData: [], categoryData: [], vendorData: [], productData: [], warehouseData: [], customerTypeData: [], customerData: [], userData: [], teamData: [], designationData: [], departmentData: [], employeeTypeData: [], organisationData: [], action: "Add", user, createUser: createMaster, db: MONGO_MODELS.CUSTOMER_TYPE_MASTER, masterName: "CustomerType",onStart: () => setImporting(true),
        onFinish: () => setImporting(false) });
      
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
      console.log('data', data, data?.length);
      if (data?.length > 0) {
        formattedData = data?.map((data: any) => ({
          'Customer Type': data?.name,
  
        }));
      } else {
        // Create a single empty row with keys only (for header export)
        formattedData = [{
          'Customer Type': '',
  
        }];
      }
  
      type === 'excel' && exportToExcel(formattedData);
  
    };
  const handleDelete = () => {
    console.log('UserPage Delete button clicked');
    // Your delete logic for user page
  };



  const customerTypeColumns = [
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
      header: ({ column }: { column: any }) => (
        <button
          className="flex items-center space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}

        >
          <span>Customer Type</span> {/* Label */}
          <ArrowUpDown size={15} /> {/* Sorting Icon */}
        </button>
      ),
      cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editUser(row.original)}>{row.getValue("name")}</div>,
    },

     {
          accessorKey: "isActive",
          header: ({ column }: { column: any }) => (
            <button
              className="flex items-center space-x-2"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    
            >
              <span>Status</span> {/* Label */}
              <ArrowUpDown size={15} /> {/* Sorting Icon */}
            </button>
          ),
          cell: ({ row }: { row: any }) => <div>{statusData.find(status => status._id === row.getValue("isActive"))?.name}</div>,
        },



  ];

  const customerTypeConfig = {
    searchFields: [
      { key: "name", label: 'name', type: "text" as const, placeholder: 'Search by customer type' },

    ],
    filterFields: [
    ],
    dataTable: {
      columns: customerTypeColumns,
      data: customerTypeData?.data,
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

      <MasterComponent config={customerTypeConfig} loadingState={loading} rowClassMap={undefined} summary={false} />
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