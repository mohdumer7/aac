"use client"

import React, { useEffect, useState } from 'react';
import MasterComponent from '@/components/MasterComponent/MasterComponent';
import { ChevronsUpDown, Download, Import, Plus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetMasterQuery, useCreateMasterMutation } from '@/services/endpoints/masterApi';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { MONGO_MODELS } from '@/shared/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { bulkImport, validate } from '@/shared/functions';
import { transformData } from '@/lib/utils';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import * as XLSX from "xlsx";

interface ProductFormData {
    _id?: string;
    category: string;
    brand: string;
    model: string;
    unitOfMeasure?: string;
    isActive: boolean;
    vendor?: string;
}

const ProductsPage = () => {
    const [importing, setImporting] = useState(false);
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<"Add" | "Update">("Add");
    const [selectedItem, setSelectedItem] = useState<ProductFormData | null>(null);
    const { user, status, authenticated } = useUserAuthorised();
    // API hooks
    const { data: productsResponse, isLoading: productsLoading } = useGetMasterQuery({
        db: MONGO_MODELS.PRODUCT_MASTER,
        filter: { isActive: true },
        populate: ['category']
    });

    const { data: categoriesResponse, isLoading: categoryLoading } = useGetMasterQuery({
        db: MONGO_MODELS.PRODUCT_CATEGORY_MASTER,
        filter: { isActive: true }
    });

    const loading = productsLoading || categoryLoading;

    const fieldsToAdd = [
        { fieldName: 'categoryName', path: ['category', 'name'] }
    ];
    const transformedData = transformData(productsResponse?.data, fieldsToAdd);

    const [createMaster] = useCreateMasterMutation();
    const statusData = [
        { _id: true, name: "True" },
        { _id: false, name: "False" },
    ];
    // Form fields configuration with validation
    const formFields = [

        {
            name: "category",
            label: "Category",
            type: "select",
            placeholder: "Select category",
            required: true,
            data: categoriesResponse?.data?.map((cat: any) => ({
                name: cat.name,
                _id: cat._id
            })) || []
        },
        {
            name: "brand",
            label: "Brand",
            type: "text",
            required: false,
            placeholder: "Enter brand name",
            validate: validate.textSmall
        },
        {
            name: "model",
            label: "Model",
            type: "text",
            required: false,
            placeholder: "Enter model number",
            validate: validate.textSmall
        },
        {
            name: "isActive",
            label: "Status",
            type: "select",
            placeholder: "Enter the status ",
            data: statusData,
            required: true
        }
    ];

    const editProducts = (data: any) => {
        setSelectedItem(data)
        setDialogAction("Update");
        setIsDialogOpen(true);
    }

    // Configure table columns
    const columns = [
        {
            accessorKey: "category",
            header: ({ column }: { column: any }) => {
                                        const isSorted = column.getIsSorted();
                                
                                        return (
                                          <button
                                            className="group  flex items-center space-x-2"
                                            onClick={() => column.toggleSorting(isSorted === "asc")}
                                          >
                                            <span>Category</span>
                                            <ChevronsUpDown
                                              size={15}
                                              className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                }`}
                                            />
                                          </button>
                                        );
                                      },
            cell: ({ row }: any) => (
                <Badge variant="default"  onClick={() => editProducts(row.original)}>
                    {row.original.category?.name || ''}
                </Badge>
            )
        },
        {
            accessorKey: "brand",
            header: ({ column }: { column: any }) => {
                                        const isSorted = column.getIsSorted();
                                
                                        return (
                                          <button
                                            className="group  flex items-center space-x-2"
                                            onClick={() => column.toggleSorting(isSorted === "asc")}
                                          >
                                            <span>Brand</span>
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
            accessorKey: "model",
            header: ({ column }: { column: any }) => {
                                        const isSorted = column.getIsSorted();
                                
                                        return (
                                          <button
                                            className="group  flex items-center space-x-2"
                                            onClick={() => column.toggleSorting(isSorted === "asc")}
                                          >
                                            <span>Model</span>
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
    const handleSave = async ({ formData, action }: { formData: ProductFormData; action: string }) => {
        try {
            const response = await createMaster({
                db: MONGO_MODELS.PRODUCT_MASTER,
                action: action === 'Add' ? 'create' : 'update',
                filter: formData._id ? { _id: formData._id } : undefined,
                data: {
                    ...formData,
                    isActive: formData.isActive ?? true
                }
            });

            return response;
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };


    const handleImport = async () => {
        await bulkImport({
            roleData: [], continentData: [], regionData: [], countryData: [], locationData: [], categoryData: categoriesResponse, vendorData: [], productData: [], warehouseData: [], customerTypeData: [], customerData: [], userData: [], teamData: [], designationData: [], departmentData: [], employeeTypeData: [], organisationData: [], action: "Add", user, createUser: createMaster, db: MONGO_MODELS.PRODUCT_MASTER, masterName: "Product", onStart: () => setImporting(true),
            onFinish: () => setImporting(false)
        });
    };

    const handleExport = (type: string, data: any) => {
        let formattedData: any[] = [];

        if (data?.length > 0) {
            formattedData = data?.map((data: any) => ({

                'Category': data?.category?.name,
                'Brand': data?.brand,
                'Model': data?.model
            }));
        } else {
            // Create a single empty row with keys only (for header export)
            formattedData = [{
                'Category': '',
                'Brand': '',
                'Model': ''
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
        filterFields: [
            {
                key: "category",
                label: "categoryName",
                type: "select" as const,
                placeholder: "Filter by category",
                data: categoriesResponse?.data?.map((cat: any) => ({
                    _id: cat?.name,
                    name: cat?.name
                })),
                name: "categoryName",
            },

        ],
        dataTable: {
            columns: columns,
            data: transformedData,
            onRowClick: (row: any) => {
                setDialogAction("Update");
                setSelectedItem({
                    ...row.original,
                    category: row.original.category?._id,
                    vendor: row.original.vendor?._id,
                    alternateVendors: row.original.alternateVendors?.map((v: any) => v._id),
                    isActive: row.original.isActive ? "Active" : "Inactive"
                });
                setIsDialogOpen(true);
            }
        },
        buttons: [
            { label: importing ? 'Importing...' : 'Import', action: handleImport, icon: Download, className: 'bg-blue-600 hover:bg-blue-700 duration-300' },
            {
                label: 'Export', action: handleExport, icon: Upload, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                    { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },

                ]
            },

            {
                label: "Add",
                action: () => {
                    setDialogAction("Add");
                    setSelectedItem({
                     
                        category: '',
                        brand: '',
                        model: '',
                        unitOfMeasure: '',
                        vendor: '',
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

            <DynamicDialog<ProductFormData>
                isOpen={isDialogOpen}
                closeDialog={() => {
                    setSelectedItem(null)
                    setIsDialogOpen(false)
                }}
                selectedMaster="Product"
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

export default ProductsPage;