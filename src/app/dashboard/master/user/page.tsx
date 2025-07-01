"use client";

import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponent'
import DashboardLoader from '@/components/ui/DashboardLoader'
import { ArrowUpDown, ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react"
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
import moment from 'moment';
import UserFormDialog from '@/components/ModalComponent/UserFormDialog';

const page = () => {
  const [importing, setImporting] = useState(false);
  const [designationDataNew, setDesignationdata] = useState([]);
  const { user, status, authenticated } = useUserAuthorised();
  const { data: userData = [], isLoading: userLoading }: any = useGetMasterQuery({
    db: 'USER_MASTER',

    sort: { empId: 'asc' },
  });
console.log("userData", userData);
  const { data: departmentData = [], isLoading: departmentLoading }: any = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    filter: { isActive: true },
    sort: { name: 'asc' },
  });
  const { data: visTypeData = [], isLoading: visaTypeLoading }: any = useGetMasterQuery({
    db: 'VISA_TYPE_MASTER',
    filter: { isActive: true },
    sort: { name: 'asc' },
  });
  const { data: nationalityData = [], isLoading: nationalityLoading }: any = useGetMasterQuery({
    db: 'COUNTRY_MASTER',
    filter: { isActive: true },
    sort: { name: 'asc' },
  });
  const { data: designationData = [], isLoading: designationLoading }: any = useGetMasterQuery({
    db: 'DESIGNATION_MASTER',
  });
  const { data: roleData = [], isLoading: roleLoading }: any = useGetMasterQuery({
    db: 'ROLE_MASTER',
    sort: { name: 'asc' },
    filter: { isActive: true },
  });
  // const { data: roleData = [], isLoading: roleLoading }: any = useGetMasterQuery({ db: "ROLE_MASTER", filter: { isActive: true }, sort: { name: 'asc' } });
  const { data: employeeTypeData = [], isLoading: employeeTypeLoading }: any = useGetMasterQuery({
    db: 'EMPLOYEE_TYPE_MASTER', filter: { isActive: true },
    sort: { empId: 'asc' },
  });
  const { data: locationData = [], isLoading: locationLoading }: any = useGetMasterQuery({
    db: "LOCATION_MASTER", filter: { isActive: true },
    sort: { name: 'asc' }
  });
  const { data: organisationData = [], isLoading: organisationLoading }: any = useGetMasterQuery({
    db: "ORGANISATION_MASTER", filter: { isActive: true },
    sort: { name: 'asc' }
  });

  const [createUser, { isLoading: isCreatingUser }]: any = useUserOperationsMutation();

  const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

  const genderData = [{ _id: 'Male', name: 'Male' }, { _id: 'Female', name: 'Female' }];

  const maritalStatusData = [{ _id: 'Single', name: 'Single' }, { _id: 'Married', name: 'Married' }, { _id: 'Divorced', name: 'Divorced' }];

  const loading = userLoading || departmentLoading || designationLoading || nationalityLoading || visaTypeLoading || roleLoading || employeeTypeLoading || organisationLoading || isCreatingUser || locationLoading;

  const fieldsToAdd = [
    { fieldName: 'roleName', path: ['role', 'name'] },
    { fieldName: 'departmentName', path: ['department', 'name'] },
    { fieldName: 'organisationName', path: ['organisation', 'name'] }
  ];

  const transformedData = transformData(userData?.data, fieldsToAdd);

  const orgTransformedData = organisationTransformData(organisationData?.data);

  console.log(transformedData, "transformedData");
  const roleNames = roleData?.data
    ?.filter((role: undefined) => role !== undefined)  // Remove undefined entries
    ?.map((role: { _id: any; name: any }) => ({ _id: role.name, name: role.name }));
  // Extract only the 'name' property
  const depNames = departmentData?.data
    ?.filter((dep: undefined) => dep !== undefined)  // Remove undefined entries
    ?.map((dep: { _id: any; name: any }) => ({ _id: dep.name, name: dep.name }));


  const orgNames = organisationData?.data
    ?.filter((org: undefined) => org !== undefined)  // Remove undefined entries
    ?.map((org: { _id: any; name: any }) => ({ _id: org.name, name: org.name }));

  const reportingToData = userData?.data
    ?.filter((user: any) =>
      user &&
      user.employeeType?.name &&
      ['Manager', 'Management'].includes(user.employeeType.name)
    )
    ?.map((user: { _id: any; displayName: any }) => ({
      _id: user._id,
      name: user.displayName
    }));


  interface RowData {
    _id: string;
    id?: string;
    name?: string;
    email?: string;
    role?: string;
    department?: any;
    designation?: any;
    displayName?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    reportingTo?: string;
    mobile?: string;
  }

  const onchangeData = async ({ id, fieldName }: { id: string; fieldName: string; }) => {

    switch (fieldName) {
      case "department":
        const designation = await designationData?.data?.filter((deignation: { department: { _id: any; }; }) => deignation?.department?._id === id);

        setDesignationdata(designation);
        break;

      default:
        break;
    }

  }


  // Reorganize fields to match new database model structure
  const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string; category?: string }> = [
    // Core user fields
    { label: 'Employee ID', name: "empId", type: "number", required: true, placeholder: 'Employee ID', category: 'core' },
    { label: 'Email', name: "email", type: "email", required: false, placeholder: 'Email', category: 'core' },
    { label: 'First Name', name: "firstName", type: "text", required: true, placeholder: 'First Name', category: 'core' },
    { label: 'Last Name', name: "lastName", type: "text", placeholder: 'Last Name', category: 'core' },
    { label: 'Full Name', name: "fullName", type: "text", readOnly: true, placeholder: 'Full Name', category: 'core' },
    { label: 'Display Name', name: "displayName", type: "text", required: true, placeholder: 'Display Name', category: 'core' },
    { label: 'Status', name: "isActive", type: "select", data: statusData, placeholder: 'Select Status', category: 'core' },
    
    // Personal details fields
    { label: 'Gender', name: "gender", type: "select", data: genderData, required: false, placeholder: 'Select Gender', category: 'personal' },
    { label: 'Date Of Birth', name: "dateOfBirth", type: "date", format: 'Date', placeholder: 'Select Birth Date', category: 'personal' },
    { label: 'Marital Status', name: "maritalStatus", type: "select", data: maritalStatusData, required: false, placeholder: 'Select Marital Status', category: 'personal' },
    { label: 'Nationality', name: "nationality", type: "select", data: nationalityData?.data, format: 'ObjectId', required: true, placeholder: 'Select Nationality', category: 'personal' },
    { label: 'Personal Number', name: "personalMobileNo", type: "text", placeholder: 'Personal Number', category: 'personal' },
    
    // Employment details fields
    { label: 'Department', name: "department", type: "select", data: departmentData?.data, format: 'ObjectId', required: true, placeholder: 'Select Department', category: 'employment' },
    { label: 'Designation', name: "designation", type: "select", data: designationDataNew?.length > 0 ? designationDataNew : designationData?.data, format: 'ObjectId', required: true, placeholder: 'Select Designation', category: 'employment' },
    { label: 'Reporting To', name: "reportingTo", type: "select", data: reportingToData, required: false, placeholder: 'Select Reporting To', category: 'employment' },
    { label: 'Employee Type', name: "employeeType", type: "select", data: employeeTypeData?.data, format: 'ObjectId', required: true, placeholder: 'Select Employee Type', category: 'employment' },
    { label: 'Role', name: "role", type: "select", data: roleData?.data, format: 'ObjectId', required: true, placeholder: 'Select Role', category: 'employment' },
    { label: 'Reporting Location', name: "reportingLocation", type: "select", data: locationData?.data, format: 'ObjectId', required: true, placeholder: 'Select Location', category: 'employment' },
    { label: 'Active Location', name: "activeLocation", type: "select", data: locationData?.data, format: 'ObjectId', required: true, placeholder: 'Select Location', category: 'employment' },
    { label: 'Organisation', name: "organisation", type: "select", data: orgTransformedData, format: 'ObjectId', required: true, placeholder: 'Select Organisation', category: 'employment' },
    { label: 'Extension', name: "extension", type: "number", placeholder: 'Extension', category: 'employment' },
    { label: 'Company Number', name: "workMobile", type: "text", placeholder: 'Mobile', category: 'employment' },
    { label: 'Joining Date', name: "joiningDate", type: "date", format: 'Date', placeholder: 'Select Joining Date', category: 'employment' },
    { label: 'Leaving Date', name: "relievingDate", type: "date", format: 'Date', placeholder: 'Select Leaving Date', category: 'employment' },
    { label: 'Person Code', name: "personCode", type: "text", placeholder: 'Person Code', category: 'employment' },
    
    // Visa details fields
    { label: 'Visa Type', name: "visaType", type: "select", data: visTypeData?.data, format: 'ObjectId', required: true, placeholder: 'Select Visa Type', category: 'visa' },
    { label: 'Visa File No', name: "visaFileNo", type: "text", placeholder: 'Visa File No', category: 'visa' },
    { label: 'Visa Issue Date', name: "visaIssueDate", type: "date", format: 'Date', placeholder: 'Select Visa Issue Date', category: 'visa' },
    { label: 'Visa Expiry Date', name: "visaExpiryDate", type: "date", format: 'Date', placeholder: 'Select Visa Expiry Date', category: 'visa' },
    { label: 'Work Permit', name: "workPermit", type: "text", placeholder: 'Work Permit', category: 'visa' },
    { label: 'Labour Card Expiry Date', name: "labourCardExpiryDate", type: "date", format: 'Date', placeholder: 'Select Labour Card Expiry Date', category: 'visa' },
    { label: 'ILOE Expiry Date', name: "iloeExpiryDate", type: "date", format: 'Date', placeholder: 'Select ILOE Expiry Date', category: 'visa' },
    
    // Identification fields
    { label: 'Passport Number', name: "passportNumber", type: "text", placeholder: 'Passport Number', category: 'identification' },
    { label: 'Passport Issue Date', name: "passportIssueDate", type: "date", format: 'Date', placeholder: 'Select Passport Issue Date', category: 'identification' },
    { label: 'Passport Expiry Date', name: "passportExpiryDate", type: "date", format: 'Date', placeholder: 'Select Passport Expiry Date', category: 'identification' },
    { label: 'Emirates ID', name: "emiratesId", type: "text", placeholder: 'Emirates ID', category: 'identification' },
    { label: 'Emirates ID Issue Date', name: "emiratesIdIssueDate", type: "date", format: 'Date', placeholder: 'Select Emirates ID Issue Date', category: 'identification' },
    { label: 'Emirates ID Expiry Date', name: "emiratesIdExpiryDate", type: "date", format: 'Date', placeholder: 'Select Emirates ID Expiry Date', category: 'identification' },
    
    // Benefits fields
    { label: 'Medical Insurance', name: "medicalInsurance", type: "text", placeholder: 'Medical Insurance', category: 'benefits' },
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
    try {
      let response;

      // Group fields by subdocument keys
      const subDocFields = {
        personalDetails: [
          'gender', 'dateOfBirth', 'maritalStatus', 'nationality', 'personalMobileNo'
        ],
        employmentDetails: [
          'department', 'designation', 'reportingTo', 'employeeType', 'role', 'reportingLocation', 'activeLocation', 'organisation', 'extension', 'workMobile', 'joiningDate', 'relievingDate', 'personCode'
        ],
        visaDetails: [
          'visaType', 'visaFileNo', 'visaIssueDate', 'visaExpiryDate', 'workPermit', 'labourCardExpiryDate', 'iloeExpiryDate'
        ],
        identification: [
          'passportNumber', 'passportIssueDate', 'passportExpiryDate', 'emiratesId', 'emiratesIdIssueDate', 'emiratesIdExpiryDate'
        ],
        benefits: [
          'medicalInsurance'
        ]
      };

      // Build nested data object
      const data: any = {};
      // Copy user-level fields
      Object.keys(formData).forEach(key => {
        let found = false;
        (Object.keys(subDocFields) as Array<keyof typeof subDocFields>).forEach(subKey => {
          if (subDocFields[subKey].includes(key)) {
            // Always assign a new object to avoid mutating a frozen object
            data[subKey] = { ...(data[subKey] || {}), [key]: formData[key] };
            found = true;
          }
        });
        if (!found) {
          data[key] = formData[key];
        }
      });

      if (action === 'Add') {
        response = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update',
            filter: { _id: formData._id },
            data
          }),
        });
      }

      const result = await response.json();
      if (result.status === "success") {
        toast.success(result.message || `User ${action === 'Add' ? 'created' : 'updated'} successfully`);
        return { data: result.data };
      } else {
        toast.error(result.message || result.error || `Failed to ${action.toLowerCase()} user`);
        return { error: result.message || result.error || `Failed to ${action.toLowerCase()} user` };
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(`Failed to ${action.toLowerCase()} user`);
      return { error };
    }
  };

  // Utility to flatten user object for dialog population
  function flattenUserForDialog(user: any) {
    if (!user) return {};
    const subDocFields = [
      'personalDetails',
      'employmentDetails',
      'visaDetails',
      'identification',
      'benefits',
    ];
    // Fields that are selects and expect an _id
    const selectFields = [
      'nationality', 'gender', 'maritalStatus', 'department', 'designation', 'reportingTo', 'employeeType', 'role', 'reportingLocation', 'activeLocation', 'organisation', 'visaType'
    ];
    // Fields that are dates
    const dateFields = [
      'dateOfBirth', 'joiningDate', 'relievingDate', 'visaIssueDate', 'visaExpiryDate', 'labourCardExpiryDate', 'iloeExpiryDate', 'passportIssueDate', 'passportExpiryDate', 'emiratesIdIssueDate', 'emiratesIdExpiryDate'
    ];
    let flat: any = { ...user };
    subDocFields.forEach((key) => {
      if (user[key] && typeof user[key] === 'object') {
        Object.keys(user[key]).forEach((subKey) => {
          if (
            subKey !== '_id' &&
            subKey !== 'userId' &&
            subKey !== '__v' &&
            subKey !== 'createdAt' &&
            subKey !== 'updatedAt' &&
            flat[subKey] === undefined
          ) {
            let value = user[key][subKey];
            // Handle select fields: set to _id if object
            if (selectFields.includes(subKey) && value && typeof value === 'object' && value._id) {
              flat[subKey] = value._id;
            } else if (dateFields.includes(subKey) && value) {
              flat[subKey] = value ? new Date(value).toISOString().slice(0, 10) : '';
            } else {
              flat[subKey] = value;
            }
          }
        });
      }
    });
    // Also handle top-level select/date fields if any
    selectFields.forEach((field) => {
      if (flat[field] && typeof flat[field] === 'object' && flat[field]._id) {
        flat[field] = flat[field]._id;
      }
    });
    dateFields.forEach((field) => {
      if (flat[field]) {
        flat[field] = new Date(flat[field]).toISOString().slice(0, 10);
      }
    });
    return flat;
  }

  const editUser = (rowData: RowData) => {
    setAction('Update');
    setInitialData(flattenUserForDialog(rowData));
    openDialog("user");
    // Your add logic for user page
  };

  const handleAdd = () => {
    setInitialData({});
    setAction('Add');
    openDialog("employee");
  };

  const handleImport = () => {
    bulkImport({ 
      roleData, 
      continentData: [], 
      regionData: [], 
      countryData: [], 
      locationData, 
      categoryData: [], 
      vendorData: [], 
      productData: [], 
      warehouseData: [], 
      customerTypeData: [], 
      customerData: [], 
      userData, 
      teamData: [], 
      designationData, 
      departmentData, 
      employeeTypeData, 
      organisationData, 
      action: "Add", 
      user, 
      createUser, 
      db: 'USER_DB', 
      masterName: "User",
      onStart: () => { console.log('Import started'); }, 
      onFinish: () => { console.log('Import finished'); }
    });
  };

  const handleExport = (type: string, data: any) => {
    let formattedData: any[] = [];

    if (data?.length > 0) {
      formattedData = data?.map((data: any) => ({
        'Employee ID': data?.empId,
        'First Name': data?.firstName,
        'Last Name': data?.lastName,
        'Full Name': data?.fullName,
        'Display Name': data?.displayName,
        'Email': data?.email,
        'Department': data?.department?.name,
        'Designation': data?.designation?.name,
        'Reporting To': transformedData.find((user: any) => user.reportingTo === data?.reportingTo)?.displayName,
        'Employee Type': data?.employeeType?.name,

        'Role': data?.role?.name,
        'Organisation': data?.organisation?.name,
        'Reporting Location': data?.reportingLocation?.name,
        'Active Location': data?.activeLocation?.name,
        'Extension': data?.extension,
        'Mobile': data?.mobile,
        'Joining Date': moment(data?.joiningDate).format('DD/MM/YYYY'),
        'Personal Number': data?.personalNumber,

      }));
    } else {
      // Create a single empty row with keys only (for header export)
      formattedData = [{
        'Employee ID': '',
        'First Name': '',
        'Last Name': '',
        'Full Name': '',
        'Display Name': '',
        'Email': '',
        'Department': '',
        'Designation': '',
        'Reporting To': '',
        'Employee Type': '',

        'Role': '',
        'Organisation': '',
        'Reporting Location': '',
        'Active Location': '',
        'Extension': '',
        'Mobile': '',
        'Joining Date': '',
        'Personal Number': ''
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

  const userColumns = [
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
      accessorKey: "fullName",
      header: ({ column }: { column: any }) => (
        <button
          className="flex items-center space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Employee Name</span> {/* Label */}
          <ArrowUpDown size={15} /> {/* Sorting Icon */}
        </button>
      ),
      cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editUser(row.original)}>{row.getValue("fullName")}</div>,
    },
    {
      accessorKey: "department",
      header: ({ column }: { column: any }) => (
        <button
          className="flex items-center space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Department</span> {/* Label */}
          <ArrowUpDown size={15} /> {/* Sorting Icon */}
        </button>
      ),
      cell: ({ row }: { row: any }) => {
        const department = row.getValue("department");
        // Handle both old direct department value and new employmentDetails.department value
        if (department?.name) {
          return <div>{department.name}</div>;
        } else if (row.original.employmentDetails?.department?.name) {
          return <div>{row.original.employmentDetails.department.name}</div>;
        }
        return <div>-</div>;
      },
    },

    {
      accessorKey: "designation",
      header: ({ column }: { column: any }) => (
        <button
          className="flex items-center space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Designation</span> {/* Label */}
          <ArrowUpDown size={15} /> {/* Sorting Icon */}
        </button>
      ),
      cell: ({ row }: { row: any }) => {
        const designation = row.getValue("designation");
        // Handle both old direct designation value and new employmentDetails.designation value
        if (designation?.name) {
          return <div>{designation.name}</div>;
        } else if (row.original.employmentDetails?.designation?.name) {
          return <div>{row.original.employmentDetails.designation.name}</div>;
        }
        return <div>-</div>;
      },
    },
    {
      accessorKey: "email",
      header: ({ column }: { column: any }) => (
        <button
          className="flex items-center space-x-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span>Email</span> {/* Label */}
          <ArrowUpDown size={15} /> {/* Sorting Icon */}
        </button>
      ),
      cell: ({ row }: { row: any }) => <div>{row.getValue("email")}</div>,
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

  const userConfig = {
    searchFields: [
      { key: "name", label: 'fullName', type: "text" as const, placeholder: 'Search by name' },

    ],
    filterFields: [

      { key: "department", label: 'departmentName', type: "select" as const, data: depNames, placeholder: 'Search by Department', name: 'departmentName' },
      { key: "organisation", label: 'organisationName', type: "select" as const, data: orgNames, placeholder: 'Search by Organisation', name: 'organisationName' },
    ],
    dataTable: {
      columns: userColumns,
      data: transformedData,
    },
    buttons: [

      { label: importing ? 'Importing...' : 'Import', action: handleImport, icon: Download, className: 'bg-blue-600 hover:bg-blue-700 duration-300' },
      {
        label: 'Export', action: handleExport, icon: Upload, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
          { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },

        ]
      },
      { label: 'Add', action: handleAdd, icon: Plus, className: 'bg-sky-600 hover:bg-sky-700 duration-300' },
    ]
  };


  return (
    <>

      <MasterComponent config={userConfig} loadingState={loading} rowClassMap={undefined} summary={false} />
      {isDialogOpen && (
        <UserFormDialog
          isOpen={isDialogOpen}
          closeDialog={closeDialog}
          onSave={saveData}
          initialData={initialData}
          action={action}
          fields={fields}
          masterData={{
            departments: departmentData?.data || [],
            designations: designationDataNew?.length > 0 ? designationDataNew : designationData?.data || [],
            roles: roleData?.data || [],
            employeeTypes: employeeTypeData?.data || [],
            locations: locationData?.data || [],
            organisations: orgTransformedData || [],
            countries: nationalityData?.data || [],
            visaTypes: visTypeData?.data || [],
            reportingTo: reportingToData || [],
            statusOptions: statusData || [],
            genderOptions: genderData || [],
            maritalStatusOptions: maritalStatusData || [],
          }}
          isSubmitting={loading}
          onFieldChange={onchangeData}
        />
      )}
    </>

  )
}

export default page