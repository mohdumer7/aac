"use client"

import React, { useEffect, useState } from 'react';
import MasterComponent from '@/components/MasterComponent/MasterComponent';
import { ChevronsUpDown, Download, Import, Plus, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetMasterQuery, useCreateMasterMutation } from '@/services/endpoints/masterApi';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { MONGO_MODELS } from '@/shared/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { bulkImport, validate } from '@/shared/functions';
import { transformData } from '@/lib/utils';
import * as XLSX from "xlsx";
import useUserAuthorised from '@/hooks/useUserAuthorised';

interface ContactPerson {
    name: string;
    designation: string;
    email: string;
    phone: string;
}

interface VendorFormData {
    _id?: string;
    name: string;
    email: string;
    phone: string;
    website?: string;
    location: string;
    contactPersons: ContactPerson[];
    isActive: boolean
}

const ContactPersonsComponent = ({ accessData, handleChange }: { accessData: ContactPerson[]; handleChange: (e: { target: { value: any } }, fieldName: string) => void }) => {
    const [contacts, setContacts] = useState<ContactPerson[]>(accessData || []);

    useEffect(() => {
        setContacts(accessData || []);
    }, [accessData]);

    const updateContacts = (newContacts: ContactPerson[]) => {
        setContacts(newContacts);
        handleChange({ target: { value: newContacts } }, "contactPersons");
    };

    return (
        <div className="space-y-2">
            {contacts.map((contact, index) => (
                <div key={index} className="p-2 border rounded space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="text"
                            value={contact.name}
                            onChange={(e) => {
                                const newContacts = [...contacts];
                                newContacts[index] = { ...contact, name: e.target.value };
                                updateContacts(newContacts);
                            }}
                            placeholder="Contact Name"
                        />
                        <Input
                            type="text"
                            value={contact.designation}
                            onChange={(e) => {
                                const newContacts = [...contacts];
                                newContacts[index] = { ...contact, designation: e.target.value };
                                updateContacts(newContacts);
                            }}
                            placeholder="Designation"
                        />
                        <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => {
                                const newContacts = [...contacts];
                                newContacts[index] = { ...contact, email: e.target.value };
                                updateContacts(newContacts);
                            }}
                            placeholder="Email"
                        />
                        <Input
                            type="number"
                            value={contact.phone}
                            onChange={(e) => {
                                const newContacts = [...contacts];
                                newContacts[index] = { ...contact, phone: e.target.value };
                                updateContacts(newContacts);
                            }}
                            placeholder="Phone"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            const newContacts = contacts.filter((_, i) => i !== index);
                            updateContacts(newContacts);
                        }}
                    >
                        Remove Contact
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                onClick={() => {
                    updateContacts([
                        ...contacts,
                        {
                            name: '',
                            designation: '',
                            email: '',
                            phone: ''
                        }
                    ]);
                }}
                className="w-full"
            >
                Add Contact Person
            </Button>
        </div>
    );
};

const VendorsPage = () => {
    const [importing, setImporting] = useState(false);
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<"Add" | "Update">("Add");
    const [selectedItem, setSelectedItem] = useState<VendorFormData | null>(null);
    const { user, status, authenticated } = useUserAuthorised();
    // API hooks
    const { data: vendorsResponse, isLoading: vendorsLoading } = useGetMasterQuery({
        db: MONGO_MODELS.VENDOR_MASTER,
        filter: { isActive: true },
        populate: ['city']
    });

    const { data: cityResponse, isLoading: cityLoading } = useGetMasterQuery({
        db: MONGO_MODELS.STATE_MASTER,
        filter: { isActive: true }
    });

    const city = cityResponse?.data?.filter((city: undefined) => city !== undefined)  // Remove undefined entries
        ?.map((city: any) => ({
            _id: city?.name,
            name: city?.name
        }));

    const fieldsToAdd = [
        { fieldName: 'cityName', path: ['city', 'name'] }
    ];
    const transformedData = transformData(vendorsResponse?.data, fieldsToAdd);

    const loading = vendorsLoading || cityLoading;

    const [createMaster] = useCreateMasterMutation();
    const statusData = [
        { _id: true, name: "True" },
        { _id: false, name: "False" },
    ];
    // Form fields configuration
    const formFields = [
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
            placeholder: "Enter vendor name",
            validate: validate.text
        },
        {
            name: "email",
            label: "Email",
            type: "email",
            required: false,
            placeholder: "Enter email address",
            validate: validate.email
        },
        {
            name: "phone",
            label: "Phone",
            type: "number",
            required: false,
            placeholder: "Enter phone number",
            validate: validate.phone
        },
        {
            name: "website",
            label: "Website",
            type: "text",
            placeholder: "Enter website URL"
        },
        {
            name: "city",
            label: "City",
            type: "select",
            required: false,
            placeholder: "Select city",
            data: cityResponse?.data?.map((city: any) => ({
                name: city.name,
                _id: city._id
            })) || []
        },
        {
            name: "contactPersons",
            label: "Contact Persons",
            type: "custom",
            CustomComponent: ContactPersonsComponent
        },
        {
            name: "isActive",
            label: "Status",
            type: "select",
            placeholder: "Select Status",
            data: statusData,
            required: true
        }
    ];
    const editVendors = (data: any) => {
        setSelectedItem(data)
        setDialogAction("Update");
        setIsDialogOpen(true);
    }

    // Configure table columns
    const columns = [
        {
            accessorKey: "name",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Name</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: any) => (
                <div className='text-red-700' onClick={() => editVendors(row.original)}>
                    {row.original.name}
                </div>
            )
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
        },
        {
            accessorKey: "phone",
            header: "Phone",
        },
        {
            accessorKey: "city",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();

                return (
                    <button
                        className="group  flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>City</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                }`}
                        />
                    </button>
                );
            },
            cell: ({ row }: any) => row.original.city?.name || ''
        },
        {
            accessorKey: "contactPersons",
            header: "Contact Persons",
            cell: ({ row }: any) => {
                const contacts = row.original.contactPersons || [];
                if (contacts.length === 0) return '-';
                return (
                    <div className="max-w-[300px] overflow-hidden text-ellipsis">
                        {contacts?.map((contact: ContactPerson) =>
                            `${contact?.name ?? " "} ${contact?.designation ? `(${contact?.designation})` : ""}`
                        ).join(", ") ?? '-'}
                    </div>
                );
            }
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }: any) => (
                <div className={`px-2 py-1 rounded-full text-center ${row.original.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.original.isActive ? 'Active' : 'Inactive'}
                </div>
            )
        }
    ];

    // Handle dialog save
    const handleSave = async ({ formData, action }: { formData: VendorFormData; action: string }): Promise<void> => {
        try {

            const reponse: any = await createMaster({
                db: MONGO_MODELS.VENDOR_MASTER,
                action: action === 'Add' ? 'create' : 'update',
                filter: formData._id ? { _id: formData._id } : undefined,
                data: formData
            });

            return reponse;

        } catch (error) {
            console.error('Error saving vendor:', error);
        }
    };

    const handleImport = async () => {
        await bulkImport({
            roleData: [], continentData: [], regionData: [], countryData: [], locationData: cityResponse, categoryData: [], vendorData: [], productData: [], warehouseData: [], customerTypeData: [], customerData: [], userData: [], teamData: [], designationData: [], departmentData: [], employeeTypeData: [], organisationData: [], action: "Add", user, createUser: createMaster, db: MONGO_MODELS.VENDOR_MASTER, masterName: "Vendor", onStart: () => setImporting(true),
            onFinish: () => setImporting(false)
        });
    };

    const handleExport = (type: string, data: any) => {
        let formattedData: any[] = [];
        console.log('data', data, data?.length);
        if (data?.length > 0) {
            formattedData = data?.map((data: any) => ({
                Name: data.name,
                Email: data?.email,
                'Contact Number': data?.phone,
                City: data?.location?.name,
                'Contact Person': data?.contactPersons[0]?.name,
                Designation: data?.contactPersons[0]?.designation,
                'Contact Email': data?.contactPersons[0]?.email,
                'Phone': data?.contactPersons[0]?.phone,

            }));
        } else {
            // Create a single empty row with keys only (for header export)
            formattedData = [{
                Name: '',
                Email: '',
                'Contact Number': '',
                City: '',
                'Contact Person': '',
                Designation: '',
                'Contact Email': '',
                'Phone': '',
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

    // Configure page layout
    const pageConfig = {
        searchFields: [
            {
                key: "name",
                label: "name",
                type: "text" as const,
                placeholder: "Search by name..."
            }
        ],
        filterFields: [
            {
                key: "city",
                label: "cityName",
                type: "select" as const,
                placeholder: "Filter by city",
                data: city,
                name: "cityName"
            },

        ],
        dataTable: {
            columns: columns,
            data: transformedData,
            onRowClick: (row: any) => {
                setDialogAction("Update");
                setSelectedItem({
                    ...row.original,
                    location: row.original.location?._id,
                    isActive: row.original.isActive ? "Active" : "Inactive"
                });
                setIsDialogOpen(true);
            }
        },
        buttons: [
            { label: importing ? 'Importing...' : 'Import', action: handleImport, icon: Import, className: 'bg-blue-600 hover:bg-blue-700 duration-300' },
            {
                label: 'Export', action: handleExport, icon: Download, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                    { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },
                    { label: "Export to PDF", value: "pdf", action: (type: string, data: any) => handleExport(type, data) },
                ]
            },
            {
                label: "Add",
                action: () => {
                    setDialogAction("Add");
                    setSelectedItem({
                        name: '',
                        email: '',
                        phone: '',
                        location: '',
                        contactPersons: [],
                        isActive: true
                    });
                    setIsDialogOpen(true);
                },
                icon: Plus,
                className: "bg-primary text-white hover:bg-primary/90"
            }
        ]
    };


    return (
        <div className="h-full w-full">
            <MasterComponent config={pageConfig} loadingState={loading} rowClassMap={undefined} summary={false} />

            <DynamicDialog<VendorFormData>
                isOpen={isDialogOpen}
                closeDialog={() => {
                    setSelectedItem(null)
                    setIsDialogOpen(false)
                }}
                selectedMaster="Vendor"
                onSave={handleSave}
                fields={formFields}
                initialData={selectedItem || {}}
                action={dialogAction}
                height="auto"
                onchangeData={() => { }}
            />
        </div>
    );
};

export default VendorsPage;