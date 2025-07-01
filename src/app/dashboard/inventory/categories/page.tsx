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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bulkImport, validate } from '@/shared/functions';
import * as XLSX from "xlsx";
import useUserAuthorised from '@/hooks/useUserAuthorised';

interface CategoryFormData {
    _id?: string;
    name: string;
    description?: string;
    productType: string;
    specsRequired: Record<string, "string" | "number" | "boolean">;
    isActive: boolean;
}


const SpecificationsComponent = ({ accessData, handleChange }: { accessData: Record<string, "string" | "number" | "boolean">; handleChange: (e: { target: { value: any } }, fieldName: string) => void }) => {
    const [specs, setSpecs]: any = useState<Record<string, "string" | "number" | "boolean">>(accessData || {});
    const [newSpecName, setNewSpecName] = useState('');
    const [newSpecType, setNewSpecType] = useState<"string" | "number" | "boolean">("string");
    const [unitMeasurement, setUnitMeasurement] = useState<string>('');



    const { data: unitMeasurementData = [], isLoading: unitMeasurementLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.UNIT_MEASUREMENT_MASTER,
        filter: { isActive: true }
    });


    useEffect(() => {
        setSpecs(accessData || {});
    }, [accessData]);
    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                    {Object.entries(specs).map(([key, value], index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <span className="flex-1 font-medium">{key}</span>
                            <Badge variant="secondary">{String(unitMeasurementData?.data?.find((unit: { _id: any; }) => unit._id === (value as { unit: string }).unit)?.name)}</Badge>
                            <Badge variant="default">{String((value as { type: string }).type)}</Badge>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    const newSpecs = { ...specs };
                                    delete newSpecs[key];
                                    setSpecs(newSpecs);
                                    handleChange({ target: { value: newSpecs } }, "specsRequired");
                                }}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input
                        type="text"
                        value={newSpecName}
                        onChange={(e) => setNewSpecName(e.target.value)}
                        placeholder="Specification name"
                        className="flex-1"
                    />

                    <Select
                        value={unitMeasurement}
                        onValueChange={(value) => setUnitMeasurement(value as any)}
                    >

                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="unit" />
                        </SelectTrigger>
                        <SelectContent>
                            {unitMeasurementData && unitMeasurementData?.data?.map((unitData: { _id: string; name: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined; }) => {
                                return <SelectItem value={unitData._id}>{unitData.name}</SelectItem>
                            })}
                        </SelectContent>
                    </Select>

                    <Select
                        value={newSpecType}
                        onValueChange={(value) => setNewSpecType(value as "string" | "number" | "boolean")}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="string">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Yes/No</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        onClick={() => {
                            if (newSpecName.trim()) {
                                const newSpecs = {
                                    ...specs,
                                    [newSpecName]: { type: newSpecType, unit: unitMeasurement }
                                };
                                setSpecs(newSpecs);
                                handleChange({ target: { value: newSpecs } }, "specsRequired");
                                setNewSpecName('');
                                setUnitMeasurement('');
                                setNewSpecType("string");
                            }
                        }}
                        disabled={!newSpecName.trim()}
                    >
                        Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const ProductCategoriesPage = () => {
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<"Add" | "Update">("Add");
    const [selectedItem, setSelectedItem] = useState<CategoryFormData | null>(null);
    const { user, status, authenticated } = useUserAuthorised();
    const { data: productTypeData = [], isLoading: productTypeLoading }: any = useGetMasterQuery({
        db: MONGO_MODELS.PRODUCT_TYPE_MASTER,
        filter: { isActive: true }
    });

    // API hooks
    const { data: categoriesResponse, isLoading } = useGetMasterQuery({
        db: MONGO_MODELS.PRODUCT_CATEGORY_MASTER,
        filter: { isActive: true }
    });
    console.log(productTypeData, categoriesResponse)

    const [createMaster] = useCreateMasterMutation();

    const statusData = [
        { _id: true, name: "True" },
        { _id: false, name: "False" },
    ];

    const loading = isLoading;

    // Form fields configuration with validation
    const formFields = [
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
            placeholder: "Enter category name",
            validate: validate.text
        },
        {
            name: "description",
            label: "Description",
            type: "textarea",
            placeholder: "Enter category description",
            validate: validate.desription
        },
        {
            name: "specsRequired",
            label: "Required Specifications",
            type: "custom",
            CustomComponent: SpecificationsComponent,
            validate: validate.specification
        },
        {
            name: "productType",
            label: "Product Type",
            placeholder: "Select product type",
            type: "select",
            data: productTypeData?.data || [],
            required: true
        },
        {
            name: "isActive",
            label: "Status",
            placeholder: "Select the status",
            type: "select",
            data: statusData,
            required: true
        }
    ];

    const editCategories = (data: any) => {
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
                <div className='text-red-700' onClick={() => editCategories(row.original)}>
                    {row.original.name}
                </div>
            )
        },
        {
            accessorKey: "productType",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();
        
                return (
                  <button
                    className="group  flex items-center space-x-2"
                    onClick={() => column.toggleSorting(isSorted === "asc")}
                  >
                    <span>Product Type</span>
                    <ChevronsUpDown
                      size={15}
                      className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                    />
                  </button>
                );
              },
            cell: ({ row }: any) => (
                <Badge variant="outline">{row?.original?.productType?.name || "N/A"}</Badge>
            )
        },
        {
            accessorKey: "description",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();
        
                return (
                  <button
                    className="group  flex items-center space-x-2"
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
        },
        {
            accessorKey: "specsRequired",
            header: "Required Specifications",
            cell: ({ row }: any) => {
                const specs = row.original.specsRequired as Record<string, Object>;
                if (!specs) return null;
                return (
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {Object.entries(specs).map(([key, value], index) => (
                            <Badge key={index} variant="outline">
                                {key}: {String((value as { type: string }).type || "")}
                            </Badge>
                        ))}
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
    const handleSave = async ({ formData, action }: { formData: CategoryFormData; action: string }): Promise<any> => {
        try {

            const response = await createMaster({
                db: MONGO_MODELS.PRODUCT_CATEGORY_MASTER,
                action: action === 'Add' ? 'create' : 'update',
                filter: formData._id ? { _id: formData._id } : undefined,
                data: {
                    ...formData,
                    isActive: formData.isActive ?? true
                }
            });

            return response;
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };


    const handleExport = (type: string, data: any) => {
        let formattedData: any[] = [];

        if (data?.length > 0) {
            formattedData = data?.map((data: any) => ({
                Name: data.name,
                Description: data.description,
                'Product Type': data.productType?.name,
                "Required Specification": Object.keys(data.specsRequired || {}).join(', ')

            }));
        } else {
            // Create a single empty row with keys only (for header export)
            formattedData = [{
                Name: '',
                Description: '',
                'Product Type': '',
                "Required Specification": ''
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

        ],
        dataTable: {
            columns: columns,
            data: (categoriesResponse?.data || []) as any[],
            onRowClick: (row: any) => {
                setDialogAction("Update");
                setSelectedItem({
                    ...row.original,
                    isActive: row.original.isActive ? "Active" : "Inactive"
                });
                setIsDialogOpen(true);
            }
        },
        buttons: [
            // { label: 'Import', action: handleImport, icon: Import, className: 'bg-blue-600 hover:bg-blue-700 duration-300' },

            {
                label: 'Export', action: handleExport, icon: Upload, className: 'bg-green-600 hover:bg-green-700 duration-300', dropdownOptions: [
                    { label: "Export to Excel", value: "excel", action: (type: string, data: any) => handleExport(type, data) },

                ]
            },
            {
                label: "Add",
                action: () => {
                    setDialogAction("Add");

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

            <DynamicDialog<CategoryFormData>
                isOpen={isDialogOpen}
                closeDialog={() => {
                    setSelectedItem(null)
                    setIsDialogOpen(false)
                }}
                selectedMaster="Product Category"
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

export default ProductCategoriesPage;