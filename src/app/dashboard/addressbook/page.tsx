"use client";

import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponent'
import DashboardLoader from '@/components/ui/DashboardLoader'
import { ArrowUpDown, ChevronDown, MoreHorizontal, ChevronsUpDown } from "lucide-react"
import { DataTable } from '@/components/TableComponent/TableComponent'
import { Plus, Import, Download, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect } from 'react';
import { useUserOperationsMutation, useGetUsersQuery } from '@/services/endpoints/usersApi';
import { organisationTransformData, transformData } from '@/lib/utils';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import { SUCCESS } from '@/shared/constants';
import { toast } from 'react-toastify';
import { RowExpanding } from '@tanstack/react-table';
import * as XLSX from "xlsx";
import useUserAuthorised from '@/hooks/useUserAuthorised';
import { bulkImport } from '@/shared/functions';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const page = () => {

  const { user, status, authenticated }: any = useUserAuthorised();
  const { data: userData = [], isLoading: userLoading }: any = useGetMasterQuery({
    db: 'USER_MASTER',
    filter: { isActive: true },
    sort: { displayName: 'asc' },
  });
  const { data: departmentData = [], isLoading: departmentLoading }: any = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    filter: { isActive: true },
    sort: { name: 'asc' },
  });

 const uniqueActiveLocations = [
  ...new Map(
    userData?.data
      ?.map((user: { activeLocation?: { _id?: string; name?: string } }) =>
        user.activeLocation?._id
          ? [user.activeLocation._id, {
              _id: user.activeLocation.name,
              name: user.activeLocation.name
            }]
          : null
      )
      .filter(Boolean) // remove null entries
  ).values()
].sort((a:any, b:any) => a.name.localeCompare(b.name));


  const { data: locationData = [], isLoading: locationLoading }: any = useGetMasterQuery({
    db: "LOCATION_MASTER", filter: { isActive: true },
    sort: { name: 'asc' }
  });
  const { data: designationData = [], isLoading: designationLoading }: any = useGetMasterQuery({
    db: "DESIGNATION_MASTER", filter: { isActive: true },
    sort: { name: 'asc' }
  });
  const { data: roleData = [], isLoading: roleLoading }: any = useGetMasterQuery({ db: "ROLE_MASTER" });
  const { data: employeeTypeData = [], isLoading: employeeTypeLoading }: any = useGetMasterQuery({ db: 'EMPLOYEE_TYPE_MASTER' });
  const { data: organisationData = [], isLoading: organisationLoading }: any = useGetMasterQuery({ db: "ORGANISATION_MASTER" });
  const [createUser, { isLoading: isCreatingUser }]: any = useUserOperationsMutation();

  const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

  const loading = userLoading || departmentLoading || designationLoading || roleLoading || employeeTypeLoading || organisationLoading || isCreatingUser || locationLoading;

  const fieldsToAdd = [
    { fieldName: 'departmentName', path: ['department', 'name'] },
    { fieldName: 'locationName', path: ['activeLocation', 'name'] }
  ];
  const transformedData1 = transformData(userData?.data, fieldsToAdd);
  const transformedData = transformedData1?.filter((item: any) => {
    const emailMissing = !item.email || String(item.email).trim() === "";
    const extensionMissing = !item.extension || String(item.extension).trim() === "";
    const mobileMissing = !item.mobile || String(item.mobile).trim() === "";
    const isManagement = item?.department?.name === "Management";

    return (!emailMissing || !extensionMissing || !mobileMissing) && !isManagement;
  });
  const orgTransformedData = organisationTransformData(organisationData?.data);

  const sortedData = transformedData?.sort((a: any, b: any) => {
    const nameA = a?.department?.name?.toLowerCase();
    const nameB = b?.department?.name?.toLowerCase();

    return nameA?.localeCompare(nameB);
  });

  const depNames = departmentData?.data
    ?.filter((dep: undefined) => dep !== undefined)  // Remove undefined entries
    ?.map((dep: { _id: any; name: any }) => ({ _id: dep.name, name: dep.name }));


  const orgNames = organisationData?.data
    ?.filter((org: undefined) => org !== undefined)  // Remove undefined entries
    ?.map((org: { _id: any; name: any }) => ({ _id: org.name, name: org.name }));

  const locNames = locationData?.data
    ?.filter((org: undefined) => org !== undefined)  // Remove undefined entries
    ?.map((org: { _id: any; name: any }) => ({ _id: org.name, name: org.name }));

  interface RowData {
    id: string;
    name: string;
    email: string;
    role: string;
  }

  const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string }> = [
    { label: 'Employee ID', name: "empId", type: "text", required: true, placeholder: 'Employee ID' },
    { label: 'First Name', name: "firstName", type: "text", required: true, placeholder: 'First Name' },
    { label: 'Last Name', name: "lastName", type: "text", placeholder: 'Last Name' },
    { label: 'Full Name', name: "fullName", type: "text", readOnly: true, placeholder: 'Full Name' },
    { label: 'Display Name', name: "displayName", type: "text", required: true, placeholder: 'Display Name' },
    { label: 'Designation', name: "designation", type: "select", data: designationData?.data, format: 'ObjectId', required: true, placeholder: 'Select Designation' },
    { label: 'Department', name: "department", type: "select", data: departmentData?.data, format: 'ObjectId', required: true, placeholder: 'Select Department' },
    { label: 'Email', name: "email", type: "text", required: true, placeholder: 'Email' },
    { label: 'Reporting To', name: "reportingTo", type: "select", data: userData?.data, required: true, placeholder: 'Select Reporting To' },
    { label: 'Role', name: "role", type: "select", data: roleData?.data, format: 'ObjectId', required: true, placeholder: 'Select Role' },
    { label: 'Location', name: "organisation", type: "select", data: orgTransformedData, format: 'ObjectId', required: true, placeholder: 'Select Location' },
    { label: 'Extension', name: "extension", type: "text", placeholder: 'Extension' },
    { label: 'Mobile', name: "mobile", type: "text", placeholder: 'Mobile' },
    { label: 'Status', name: "isActive", type: "select", data: statusData, placeholder: 'Select Status' },
    { label: 'Employee Type', name: "employeeType", type: "select", data: employeeTypeData?.data, format: 'ObjectId', required: true, placeholder: 'Select Employee Type' },
    { label: 'Joining Date', name: "joiningDate", type: "date", format: 'Date', placeholder: 'Pick Joining Date' },
    { label: 'Leaving Date', name: "relievingDate", type: "date", format: 'Date', placeholder: 'Pick Leaving Date' },
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
      action: action === 'Add' ? 'create' : 'update',
      filter: { "_id": formData._id },
      data: formData,
    };
    const response = await createUser(formattedData);


    return response;

  };

  const editUser = (rowData: RowData) => {
    setAction('Update');
    setInitialData(rowData);
    openDialog("employee");
    // Your add logic for user page
  };

  const handleAdd = () => {
    setInitialData({});
    setAction('Add');
    openDialog("employee");
  };

  // const handleImport = () => {
  //   bulkImport({ roleData, continentData: [], regionData: [], countryData: [], locationData: [], categoryData: [], vendorData: [], productData: [], warehouseData: [], customerTypeData: [], customerData:[], userData:[], teamData:[], action: "Add", user, createUser, db: 'USER_DB', masterName: "User" });
  // };

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

  const exportToPDF = (data: any[]) => {
    const doc = new jsPDF();
    doc.text('Exported Data', 14, 10);

    const tableColumns = Object.keys(data[0] || {});
    const tableRows = data.map((item) => tableColumns.map((key) => item[key]));

    doc.save('exported_data.pdf');
  };

  const handleExport = (type: string) => {
    type === 'excel' && exportToExcel(userData?.data);

  };

  const handleDelete = () => {
    console.log('UserPage Delete button clicked');
    // Your delete logic for user page
  };

  const userColumns = [

    {
      accessorKey: "displayName",
      header: ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();
    
        return (
          <button
            className="group flex items-center space-x-2 pl-3"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            <span className="truncate">Employee Name</span>
            <ChevronsUpDown
              size={15}
              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            />
          </button>
        );
      },
      cell: ({ row }: { row: any }) => {
        const firstName = row.getValue("displayName");
        const designation = row.original?.designation?.name || "";
    
        return (
          <div className="pl-3">
            <div className="font-medium ">{firstName}</div>
            <div className="text-sm text-gray-500 ">{designation}</div>
          </div>
        );
      },
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
      cell: ({ row }: { row: any }) => <div>{row.getValue("department")?.name}</div>,
    },
    {
      accessorKey: "activeLocation",
      header: ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();

        return (
          <button
            className="group  flex items-center space-x-2"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            <span>Location</span>
            <ChevronsUpDown
              size={15}
              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            />
          </button>
        );
      },
      cell: ({ row }: { row: any }) => <div>{row.getValue("activeLocation")?.name}</div>,
    },
    {
      accessorKey: "email",
      header: ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();

        return (
          <button
            className="group  flex items-center space-x-2"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            <span>Email</span>
            <ChevronsUpDown
              size={15}
              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            />
          </button>
        );
      },
      cell: ({ row }: { row: any }) => {
        const email = row.getValue("email");
        return (
          <a
            href={`mailto:${email}`}
            className="text-blue-600 hover:text-blue-800 "
          >
            {email}
          </a>
        );
      },
    },
    {
      accessorKey: "extension",
      header: ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();

        return (
          <button
            className="group  flex items-center space-x-2"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            <span>Extension</span>
            <ChevronsUpDown
              size={15}
              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            />
          </button>
        );
      },
      cell: ({ row }: { row: any }) => {
        const extension = row.getValue("extension");
        return (
          <a
            href={`tel:${extension}`}
            className="text-blue-600 hover:text-blue-800 no-underline"
          >
            {extension}
          </a>
        );
      },
    },
    {
      accessorKey: "mobile",
      header: ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();

        return (
          <button
            className="group  flex items-center space-x-2"
            onClick={() => column.toggleSorting(isSorted === "asc")}
          >
            <span>Mobile</span>
            <ChevronsUpDown
              size={15}
              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
            />
          </button>
        );
      },
      cell: ({ row }: { row: any }) => {
        const original = row.original;
        const mobile = original.mobile;
        const personal = original.personalNumber;
        const department = original?.department?.name?.toLowerCase();
        const userDepartment = user?.department?.name?.toLowerCase();
        const userRole = user?.role?.name?.toLowerCase();

        let displayNumber: string | null = null;

        if (mobile) {
          displayNumber = mobile;
        } else if (userRole === 'admin' || userDepartment === 'hr & admin') {
          displayNumber = personal;
        } else if (department === userDepartment) {
          displayNumber = personal;
        }

        return displayNumber ? (
          <a
            href={`tel:${displayNumber}`}
            className="text-blue-600 hover:text-blue-800 no-underline"
          >
            {displayNumber}
          </a>
        ) : (
          <span className="text-gray-500 italic"></span>
        );
      },
    },
  ];

  const userConfig = {
    searchFields: [
      { key: "name", label: 'fullName', type: "text" as const, placeholder: 'Search by Name' },

    ],
    filterFields: [

      { key: "department", label: 'departmentName', type: "select" as const, data: depNames, placeholder: 'Search by Department', name: 'departmentName' },
      { key: "activeLocation", label: 'locationName', type: "select" as const, data: uniqueActiveLocations, placeholder: 'Search by Location', name: 'locationName' },

    ],
    dataTable: {
      columns: userColumns,
      data: sortedData,
    },
    buttons: [

    ]
  };


  return (
    <>

      <MasterComponent config={userConfig} loadingState={loading} rowClassMap={undefined} summary={false} />

    </>

  )
}

export default page