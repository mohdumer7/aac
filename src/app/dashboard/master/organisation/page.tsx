"use client";

import React from 'react'
import MasterComponent from '@/components/MasterComponent/MasterComponent'
import DashboardLoader from '@/components/ui/DashboardLoader'
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
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


const page = () => {

    const { user, status, authenticated } = useUserAuthorised();
    const { data: organisationData = [], isLoading: organisationLoading }:any = useGetMasterQuery({
        db: MONGO_MODELS.ORGANISATION_MASTER,
        sort: { name: 'asc' },
    });

    const { data: locationData = [], isLoading: locationLoading }:any = useGetMasterQuery({
        db: MONGO_MODELS.LOCATION_MASTER,
        sort: { name: 'asc' },
    });

    const [createMaster, { isLoading: isCreatingMaster }]:any = useCreateMasterMutation();

    const statusData = [{ _id: true, name: 'Active' }, { _id: false, name: 'InActive' }];

    const loading = organisationLoading || locationLoading || isCreatingMaster;

    // Flatten each object in the array
   

    const flattenedData = organisationData?.data?.map((item: { [x: string]: any; location: any; }) => {
        const { location, ...rest } = item;

        return {
            _id: rest._id,
            name: rest.name,
            isActive:rest.isActive,
            location: location
                ? {
                    _id: location._id,
                    name: location.name,
                    address: location.address,
                    pincode: location.pincode,
                }
                : null,
            state: location?.state
                ? {
                    _id: location.state._id,
                    name: location.state.name,
                }
                : null,
            country: location?.state?.country
                ? {
                    _id: location.state.country._id,
                    name: location.state.country.name,
                }
                : null,
            region: location?.state?.country?.region
                ? {
                    _id: location.state.country.region._id,
                    name: location.state.country.region.name,
                }
                : null,
            continent: location?.state?.country?.region?.continent
                ? {
                    _id: location.state.country.region.continent._id,
                    name: location.state.country.region.continent.name,
                }
                : null,
        };
    });



    interface RowData {
        id: string;
        name: string;
        email: string;
        role: string;
    }


    const fields: Array<{ label: string; name: string; type: string; data?: any; readOnly?: boolean; format?: string; required?: boolean; placeholder?: string }> = [

        { label: 'Organisation Name', name: "name", type: "text", required: true, placeholder: 'Organisation Name' },
        { label: 'Location', name: "location", type: "select",required: true, data: locationData?.data, placeholder:'Select Location' },
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
    const addressFields = ["state", "pinCode", "country", "area", "location"];
    // Save function to send data to an API or database
    const saveData = async ({ formData, action }: { formData: any, action: string }) => {

        let formattedData = Object.entries(formData).reduce(
            (result:any, [key, value]) => {
                if (addressFields.includes(key)) {
                    // Add to 'address' object
                    result.address = { ...result.address, [key]: value };
                } else {
                    // Keep other fields at the top level
                    result[key] = value;
                }
                return result;
            },
            {}
        );

        formattedData = {
            db: 'ORGANISATION_MASTER',
            action: action === 'Add' ? 'create' : 'update',
            filter: { "_id": formData._id },
            data: formattedData,
        };



        const response = await createMaster(formattedData);

        return response;

    };


    const editUser = (rowData: RowData) => {
        setAction('Update');
        setInitialData(rowData);
        openDialog("organisation");
        // Your add logic for user page
    };

    const handleAdd = () => {
        setInitialData({});
        setAction('Add');
        openDialog("organisation");

    };

    const handleImport = () => {
        bulkImport({ roleData: [], continentData: [], regionData: [], countryData: [],locationData: [], categoryData: [], vendorData: [], productData: [], warehouseData: [],customerTypeData: [], customerData:[], userData:[], teamData:[], action: "Add", user, createUser: createMaster, db: "ORGANISATION_MASTER", masterName: "Organisation" });
    };

    const handleExport = () => {
        console.log('UserPage Update button clicked');
        // Your update logic for user page
    };


    const organisationColumns = [
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
                    <span>Organisation</span> {/* Label */}
                    <ArrowUpDown size={15} /> {/* Sorting Icon */}
                </button>
            ),
            cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editUser(row.original)}>{row.getValue("name")}</div>,
        },
        {
            accessorKey: "location",
            header: ({ column }: { column: any }) => (
                <button
                    className="flex items-center space-x-2"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}

                >
                    <span>Location</span> {/* Label */}
                    <ArrowUpDown size={15} /> {/* Sorting Icon */}
                </button>
            ),
            cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editUser(row.original)}>{row.getValue("location")?.name}</div>,
        },
        {
            accessorKey: "state",
            header: ({ column }: { column: any }) => (
                <button
                    className="flex items-center space-x-2"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}

                >
                    <span>State / City</span> {/* Label */}
                    <ArrowUpDown size={15} /> {/* Sorting Icon */}
                </button>
            ),
            cell: ({ row }: { row: any }) => <div className='text-blue-500' onClick={() => editUser(row.original)}>{row.getValue("state")?.name}</div>,
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

    const organisationConfig = {
        searchFields: [
            { key: "name", label: 'name', type: "text" as const, placeholder: 'Search by organisation' },

        ],
        filterFields: [
            // { key: "role", label: 'roleName', type: "select" as const, options: roleNames },

        ],
        dataTable: {
            columns: organisationColumns,
            data: flattenedData,
        },
        buttons: [

            { label: 'Import', action: handleImport, icon: Import, className: 'bg-blue-600 hover:bg-blue-700 duration-300' },
            { label: 'Export', action: handleExport, icon: Download, className: 'bg-green-600 hover:bg-green-700 duration-300' },
            { label: 'Add', action: handleAdd, icon: Plus, className: 'bg-sky-600 hover:bg-sky-700 duration-300' },
        ]
    };


    return (
        <>

            <MasterComponent config={organisationConfig} loadingState={loading} rowClassMap={undefined} summary={false} />
            <DynamicDialog
                isOpen={isDialogOpen}
                closeDialog={closeDialog}
                selectedMaster={selectedMaster}
                onSave={saveData}
                fields={fields}
                initialData={initialData}
                action={action}
                height='auto'
            />
        </>

    )
}

export default page