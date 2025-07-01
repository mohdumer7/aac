"use client"

import React, { useEffect, useState } from 'react';
import MasterComponent from '@/components/MasterComponent/MasterComponent';
import { Box, ChevronsUpDown, Download, Import, Plus, Upload, Trash2, Edit2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetMasterQuery, useCreateMasterMutation } from '@/services/endpoints/masterApi';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { MONGO_MODELS } from '@/shared/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bulkImport, validate } from '@/shared/functions';
import BulkAddDialog from '@/components/ModalComponent/BulkAddDialog';
import { Input } from '@/components/ui/input';
import { transformData } from '@/lib/utils';
import * as XLSX from "xlsx";
import useUserAuthorised from '@/hooks/useUserAuthorised';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AssetFormData {
    _id?: string;
    serialNumber: string;
    product: string;
    warehouse: string;
    status: 'available' | 'assigned' | 'maintenance' | 'retired';
    warrantyStartDate: string;
    warrantyEndDate: string;
    specifications: Record<string, any>;
    isActive: boolean;
}

interface InvoiceFormData {
    _id?: string;
    invoiceNumber: string;
    vendor: string;
    poNumber: string;
    prNumber?: string;
    warehouse: string;
    purchaseDate: string;
    assets: string[]; // Array of asset IDs
    isActive: boolean;
}

interface SpecificationsComponentProps {
    accessData: Record<string, any>;
    handleChange: (e: { target: { value: Record<string, any> } }, fieldName: string) => void;
    selectedItem: any;
}

const SpecificationsComponent = ({ accessData, handleChange, selectedItem: selectedProduct }: SpecificationsComponentProps) => {
    const [specs, setSpecs] = useState<Record<string, any>>(accessData || {});

    useEffect(() => {
        setSpecs(accessData || {});
    }, [accessData]);

    if (!selectedProduct?.product?.category?.specsRequired) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                        Please select a product first
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-6 space-y-4">
                {Object.entries(selectedProduct?.product?.category?.specsRequired || {}).map(([key, value]) => (
                    <div key={key} className="flex gap-2 items-center">
                        <label className="w-1/3 font-medium">{key}:</label>
                        {(value as { type: string }).type === "boolean" ? (
                            <Select
                                value={String(specs[key]?.value || "false")}
                                onValueChange={(val) => {
                                    const newSpecs = {
                                        ...specs,
                                        [key]: { type: (value as { type: string }).type, value: val === "true" }
                                    };
                                    setSpecs(newSpecs);
                                    handleChange({ target: { value: newSpecs } }, "specifications");
                                }}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select value" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                type={(value as { type: string }).type === "number" ? "number" : "text"}
                                value={String(specs[key]?.value || "")}
                                onChange={(e) => {
                                    const newSpecs = {
                                        ...specs,
                                        [key]: { type: (value as { type: string }).type, value: (value as { type: string }).type === "number" ? Number(e.target.value) : e.target.value }
                                    };
                                    setSpecs(newSpecs);
                                    handleChange({ target: { value: newSpecs } }, "specifications");
                                }}
                                className="flex-1"
                            />
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

const InventoryPage = () => {
    const [importing, setImporting] = useState(false);
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<"Add" | "Update">("Add");
    const [selectedItem, setSelectedItem] = useState<InvoiceFormData | null>(null);
    const { user }: any = useUserAuthorised();
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [editingAsset, setEditingAsset] = useState<AssetFormData | null>(null);
    const [selectedProductForSpecs, setSelectedProductForSpecs] = useState<any>(null);

    // API hooks
    const { data: inventoryResponse, isLoading: inventoryLoading, refetch } = useGetMasterQuery({
        db: MONGO_MODELS.INVENTORY_MASTER,
        filter: { isActive: true },
        populate: ['vendor', 'warehouse', 'assets', 'assets.product', 'assets.product.category']
    });
console.log(inventoryResponse, 'inventorydata')
    const { data: vendorsResponse, isLoading: vendorLoading } = useGetMasterQuery({
        db: MONGO_MODELS.VENDOR_MASTER,
        filter: { isActive: true }
    });

    const { data: warehousesResponse, isLoading: warehouseLoading } = useGetMasterQuery({
        db: MONGO_MODELS.WAREHOUSE_MASTER,
        filter: { isActive: true }
    });

    const { data: productsResponse, isLoading: productLoading } = useGetMasterQuery({
        db: MONGO_MODELS.PRODUCT_MASTER,
        filter: { isActive: true }
    });

    const loading = inventoryLoading || vendorLoading || warehouseLoading || productLoading;

    const [createMaster] = useCreateMasterMutation();

    const handleEdit = (row: any) => {

        setDialogAction("Update");

        // Use Set to ensure unique asset IDs and prevent duplicates
        const uniqueAssets = Array.from(
            new Map(row.original.assets.map((asset: any) => [asset._id, asset])).values()
        );

        const invoiceData: any = {
            _id: row.original._id,
            invoiceNumber: row.original.invoiceNumber,
            vendor: row.original.vendor?._id,
            poNumber: row.original.poNumber,
            prNumber: row.original.prNumber,
            warehouse: row.original.warehouse?._id,
            purchaseDate: moment(row.original.purchaseDate).format('YYYY-MM-DD'),
            assets: uniqueAssets,
            isActive: row.original.isActive
        };

        setSelectedItem(invoiceData);
        setIsDialogOpen(true);
    };

    const handleSave = async ({ formData, action }: { formData: InvoiceFormData; action: string }) => {
        try {

            // Validate required fields
            const requiredFields = ['invoiceNumber', 'poNumber', 'vendor', 'purchaseDate', 'warehouse'];
            const missingFields = requiredFields.filter(field => !formData[field as keyof InvoiceFormData]);

            if (missingFields.length > 0) {
                toast.error(`Missing required fields: ${missingFields.join(', ')}`);
                return { error: 'Validation error' };
            }


            // Prepare the payload - only include fields that are valid for Inventory
            const payload: any = {
                invoiceNumber: formData.invoiceNumber,
                poNumber: formData.poNumber,
                prNumber: formData.prNumber,
                vendor: formData.vendor,
                warehouse: formData.warehouse,
                purchaseDate: formData.purchaseDate,
                // Make sure assets is an array of IDs
                assets: Array.isArray(formData.assets)
                    ? formData.assets.map((asset: any) => typeof asset === 'string' ? asset : asset._id)
                    : [],
                isActive: formData.isActive ?? true,
                addedBy: user?._id || '',
                updatedBy: user?._id || ''
            };

            // Do not include status field for Inventory records
            // status is only for Asset records


            const response = await createMaster({
                db: MONGO_MODELS.INVENTORY_MASTER,
                action: action === 'Add' ? 'create' : 'update',
                filter: formData._id ? { _id: formData._id } : undefined,
                data: payload
            }).unwrap();

            if (response) {
                toast.success(`Inventory ${action === 'Add' ? 'created' : 'updated'} successfully`);
                setIsDialogOpen(false);
                setIsBulkDialogOpen(false);
                setSelectedItem(null);
                refetch();
            }
            return response;
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || 'An unknown error occurred';
            console.error('Error saving invoice:', error);
            toast.error(`Failed to ${action.toLowerCase()} inventory: ${errorMessage}`);
            return { error };
        }
    };

    const handleImport = async () => {
        await bulkImport({
            roleData: [], continentData: [], regionData: [], countryData: [], locationData: [], categoryData: [], vendorData: vendorsResponse, productData: productsResponse, warehouseData: warehousesResponse, customerTypeData: [], customerData: [], userData: [], teamData: [], designationData: [], departmentData: [], employeeTypeData: [], organisationData: [], action: "Add", user, createUser: createMaster, db: MONGO_MODELS.INVENTORY_MASTER, masterName: "Asset", onStart: () => setImporting(true),
            onFinish: () => setImporting(false)
        });
    };

    const handleExport = (type: string, data: any) => {
        let formattedData: any[] = [];

        if (data?.length > 0) {


            data.forEach((record: any) => {
                console.log('Processing record:', record); // Debug log
                const commonFields = {
                    'Vendor Name': record.vendor?.name || '',
                    'Invoice No': record?.invoiceNumber || '',
                    'PO Number': record?.poNumber || '',
                    'PR Number': record?.prNumber || '',
                    'Purchase Date': record?.purchaseDate ? moment(record.purchaseDate).format("DD-MM-YYYY") : '',
                    'Warehouse': record?.warehouse?.name || '',
                };

                if (record?.assets?.length > 0) {
                    record.assets.forEach((asset: any) => {
                        formattedData.push({
                            ...commonFields,
                            'Serial Number': asset?.serialNumber || '',
                            'Category': asset?.product?.category?.name || '',
                            'Brand': asset?.product?.brand || '',
                            'Model': asset?.product?.model || '',
                            'Warranty Start Date': asset?.warrantyStartDate ? moment(asset?.warrantyStartDate).format("DD-MM-YYYY") : '',
                            'Warranty End Date': asset?.warrantyEndDate ? moment(asset?.warrantyEndDate).format("DD-MM-YYYY") : '',
                            'Specifications': asset?.specifications ? JSON.stringify(asset.specifications) : ''

                        });
                    });
                } else {
                    // Still add the record if no assets are present
                    formattedData.push({
                        ...commonFields,
                        'Serial Number': '',
                        'Category': '',
                        'Brand': '',
                        'Model': '',
                        'Warranty Start Date': '',
                        'Warranty End Date': '',
                        'Specifications': ''

                    });
                }
            });


        }
        else {
            formattedData.push({
                'Vendor Name': '',
                'Invoice No': '',
                'PO Number': '',
                'PR Number': '',
                'Purchase Date': '',
                'Warehouse': '',
                'Serial Number': '',
                'Category': '',
                'Brand': '',
                'Model': '',
                'Warranty Start Date': '',
                'Warranty End Date': '',
                'Specifications': ''
            });
        }

        type === 'excel' && exportToExcel(formattedData);
    };

    const exportToExcel = (data: any[]) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, 'inventory_export.xlsx');
    };

    const handleAddProduct = () => {
        setEditingAsset({
            serialNumber: '',
            product: '',
            warehouse: selectedItem?.warehouse || '',
            status: 'available',
            warrantyStartDate: moment().format('YYYY-MM-DD'),
            warrantyEndDate: moment().add(1, 'year').format('YYYY-MM-DD'),
            specifications: {},
            isActive: true
        });
        setSelectedProductForSpecs(null);
        setIsProductDialogOpen(true);
    };

    const handleEditProduct = (asset: any) => {
        setEditingAsset({
            _id: asset._id,
            serialNumber: asset.serialNumber,
            product: asset.product?._id,
            warehouse: asset.warehouse?._id || selectedItem?.warehouse,
            status: asset.status || 'available',
            warrantyStartDate: moment(asset.warrantyStartDate).format('YYYY-MM-DD'),
            warrantyEndDate: moment(asset.warrantyEndDate).format('YYYY-MM-DD'),
            specifications: asset.specifications || {},
            isActive: asset.isActive
        });

        // Find the product to populate specifications
        const productDetails = productsResponse?.data?.find((p: any) => p._id === asset.product?._id);
        setSelectedProductForSpecs(productDetails ? { product: productDetails } : null);

        setIsProductDialogOpen(true);
    };

    const handleProductChange = (productId: string) => {
        if (!productId) {
            setSelectedProductForSpecs(null);
            return;
        }

        const productDetails = productsResponse?.data?.find((p: any) => p._id === productId);
        if (productDetails) {
            setSelectedProductForSpecs({ product: productDetails });
            setEditingAsset(prev => prev ? {
                ...prev,
                product: productId,
                specifications: {} // Reset specifications when product changes
            } : null);
        }
    };

    const handleSpecificationsChange = (e: { target: { value: Record<string, any> } }, fieldName: string) => {
        setEditingAsset(prev => prev ? {
            ...prev,
            [fieldName]: e.target.value
        } : null);
    };

    const handleSaveProduct = async (formData: AssetFormData) => {
        try {
            // Validation - ensure product is selected
            if (!formData.product) {
                toast.error('Please select a product');
                return;
            }

            if (!formData.serialNumber) {
                toast.error('Serial number is required');
                return;
            }

            console.log('Saving asset with data:', JSON.stringify(formData, null, 2));

            // For new products in edit mode, associate with current invoice
            const payload = {
                ...formData,
                warehouse: formData.warehouse || selectedItem?.warehouse,
                inventory: selectedItem?._id, // Link to current invoice
                status: 'available', // Set default status
                isActive: true,
                addedBy: user?._id || '',
                updatedBy: user?._id || ''
            };

            console.log('Final asset payload:', JSON.stringify(payload, null, 2));

            const response = await createMaster({
                db: MONGO_MODELS.ASSET_MASTER,
                action: formData?._id ? 'update' : 'create',
                filter: formData?._id ? { "_id": formData._id } : undefined,
                data: payload
            }).unwrap();

            if (response) {
                toast.success(`Asset ${formData._id ? 'updated' : 'added'} successfully`);
                setIsProductDialogOpen(false);

                // Update the local state to reflect changes immediately
                if (formData._id && selectedItem) {
                    // Find and update the existing asset in the selectedItem assets array
                    const updatedAssets = selectedItem.assets.map((asset: any) =>
                        asset._id === formData._id ? {
                            ...asset,
                            serialNumber: formData.serialNumber,
                            product: { _id: formData.product },
                            warrantyStartDate: formData.warrantyStartDate,
                            warrantyEndDate: formData.warrantyEndDate,
                            specifications: formData.specifications
                        } : asset
                    );
                    setSelectedItem({ ...selectedItem, assets: updatedAssets });
                } else if (selectedItem && response.data) {
                    // Add new asset to the list if it's newly created
                    const newAsset = response.data;
                    // Fetch complete product details for the new asset
                    const productDetails = productsResponse?.data?.find((p: any) => p._id === formData.product);
                    const enhancedAsset = {
                        ...newAsset,
                        product: productDetails ? {
                            _id: productDetails._id,
                            model: productDetails.model,
                            category: productDetails.category
                        } : { _id: formData.product }
                    };

                    setSelectedItem({
                        ...selectedItem,
                        assets: [...(selectedItem.assets || []), enhancedAsset]
                    });
                }

                // Also refresh the data from API
                refetch();
            }
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || 'An unknown error occurred';
            console.error('Error saving asset:', error);
            toast.error(`Failed to ${formData._id ? 'update' : 'add'} asset: ${errorMessage}`);
        }
    };

    const handleDeleteProduct = async (assetId: string) => {
        try {
            await createMaster({
                db: MONGO_MODELS.ASSET_MASTER,
                action: 'update',
                filter: { "_id": assetId },
                data: { isActive: false }
            }).unwrap();

            toast.success('Product removed successfully');

            // Update the local state to remove the deleted asset
            if (selectedItem) {
                const updatedAssets = selectedItem.assets.filter((asset: any) => asset._id !== assetId);
                setSelectedItem({ ...selectedItem, assets: updatedAssets });
            }

            // Also refresh the data
            refetch();
        } catch (error) {
            console.error('Error removing product:', error);
            toast.error('Failed to remove product');
        }
    };

    // Function to handle saving assets from BulkAddDialog
    const saveAsset = async ({ formData, action }: { formData: AssetFormData; action: string }) => {
        try {
            // Validation - ensure required fields are present
            if (!formData.product) {
                return { error: { message: 'Product is required' } };
            }

            if (!formData.serialNumber) {
                return { error: { message: 'Serial number is required' } };
            }

            if (!formData.warehouse) {
                return { error: { message: 'Warehouse is required' } };
            }

            console.log('Saving asset with data:', JSON.stringify(formData, null, 2));

            const payload = {
                ...formData,
                status: 'available', // Set default status for new assets
                isActive: true
            };

            const response = await createMaster({
                db: MONGO_MODELS.ASSET_MASTER,
                action: action === 'Add' ? 'create' : 'update',
                filter: formData._id ? { "_id": formData._id } : undefined,
                data: payload
            }).unwrap();

            return response;
        } catch (error: any) {
            console.error('Error saving asset:', error);
            return { error: { message: error?.data?.message || error?.message || 'Validation error' } };
        }
    };

    const columns = [
        {
            accessorKey: "invoiceNumber",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();
                return (
                    <button
                        className="group flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Invoice No</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        />
                    </button>
                );
            },
            cell: ({ row }: any) => (
                <div
                    className='text-red-700 cursor-pointer hover:underline'
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row);
                    }}
                >
                    {row.original.invoiceNumber}
                </div>
            )
        },
        {
            accessorKey: "vendor",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();
                return (
                    <button
                        className="group flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Vendor</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        />
                    </button>
                );
            },
            cell: ({ row }: any) => (
                <Badge variant="outline">
                    {row.original.vendor?.name || ''}
                </Badge>
            )
        },
        {
            accessorKey: "warehouse",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();
                return (
                    <button
                        className="group flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Warehouse</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        />
                    </button>
                );
            },
            cell: ({ row }: any) => (
                <Badge variant="secondary">
                    {row.original.warehouse?.name || ''}
                </Badge>
            )
        },
        {
            accessorKey: "purchaseDate",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();
                return (
                    <button
                        className="group flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Purchase Date</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        />
                    </button>
                );
            },
            cell: ({ row }: any) => (
                <div>
                    {moment(row.original.purchaseDate).format("DD-MMM-YYYY")}
                </div>
            )
        },
        {
            accessorKey: "assets",
            header: "Assets",
            cell: ({ row }: any) => (
                <div className="flex items-center justify-between">
                    <Badge variant="outline">
                        {row.original.assets?.length || 0} items
                    </Badge>
                    <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                            <span>View Details</span>
                            <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 transition-all duration-200 ease-in-out data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                            <Card className="mt-2">
                                <CardContent className="pt-4">
                                    <div className="space-y-2">
                                        {row.original.assets?.map((asset: any, index: number) => (
                                            <div key={`${row.original._id}-${asset._id}-${index}`} className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors duration-200">
                                                <div>
                                                    <div className="font-medium">
                                                        {asset.product?.category?.name} ({asset.product?.model})
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        S/N: {asset.serialNumber}
                                                    </div>
                                                </div>
                                                <Badge variant={asset.status === 'available' ? 'default' : 'secondary'}>
                                                    {asset.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            )
        },

    ];

    // Configure page layout
    const pageConfig = {
        searchFields: [
            {
                key: "invoiceNumber",
                label: "invoiceNumber",
                type: "text" as const,
                placeholder: "Search by invoice number..."
            }
        ],
        filterFields: [
            {
                key: "vendor",
                label: "vendor",
                type: "select" as const,
                placeholder: "Filter by vendor",
                data: vendorsResponse?.data?.map((vendor: any) => ({
                    _id: vendor._id,
                    name: vendor.name
                })),
                name: "vendor",
            },
            {
                key: "warehouse",
                label: "warehouse",
                type: "select" as const,
                placeholder: "Filter by warehouse",
                data: warehousesResponse?.data?.map((wh: any) => ({
                    _id: wh._id,
                    name: wh.name
                })),
                name: "warehouse",
            },
        ],
        dataTable: {
            columns: columns,
            data: inventoryResponse?.data || [],
            onRowClick: handleEdit,
            enableRowClick: true
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
                    setSelectedItem(null);
                    setIsBulkDialogOpen(true);
                },
                icon: Plus,
            }
        ]
    };

    return (
        <div className="h-full">
            <MasterComponent
                config={pageConfig}
                loadingState={loading}
                rowClassMap={undefined}
                summary={false}
            />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogAction === 'Add' ? 'Add Invoice' : 'Edit Invoice'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Invoice Number</label>
                                <Input
                                    value={selectedItem?.invoiceNumber || ''}
                                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, invoiceNumber: e.target.value } : null)}
                                    placeholder="Enter invoice number"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Vendor</label>
                                <Select
                                    value={selectedItem?.vendor}
                                    onValueChange={(value) => setSelectedItem(prev => prev ? { ...prev, vendor: value } : null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendorsResponse?.data?.map((vendor: any) => (
                                            <SelectItem key={vendor._id} value={vendor._id}>
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">PO Number</label>
                                <Input
                                    value={selectedItem?.poNumber || ''}
                                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, poNumber: e.target.value } : null)}
                                    placeholder="Enter PO number"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">PR Number</label>
                                <Input
                                    value={selectedItem?.prNumber || ''}
                                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, prNumber: e.target.value } : null)}
                                    placeholder="Enter PR number"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Warehouse</label>
                                <Select
                                    value={selectedItem?.warehouse}
                                    onValueChange={(value) => setSelectedItem(prev => prev ? { ...prev, warehouse: value } : null)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select warehouse" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehousesResponse?.data?.map((wh: any) => (
                                            <SelectItem key={wh._id} value={wh._id}>
                                                {wh.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Purchase Date</label>
                                <Input
                                    type="date"
                                    value={selectedItem?.purchaseDate || ''}
                                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, purchaseDate: e.target.value } : null)}
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Products</h3>
                                <Button onClick={handleAddProduct} size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Product
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {selectedItem && selectedItem?.assets?.length > 0 ? (
                                    selectedItem.assets.map((asset: any, index: number) => (
                                        <div key={`${asset._id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className="font-medium">
                                                    {asset.product?.category?.name} ({asset.product?.model})
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    S/N: {asset.serialNumber}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditProduct(asset)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteProduct(asset._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-4">
                                        No products added yet
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => handleSave({ formData: selectedItem!, action: dialogAction })}
                            >
                                {dialogAction === 'Add' ? 'Add' : 'Update'} Invoice
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAsset?._id ? 'Edit Product' : 'Add Product'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Product</label>
                                <Select
                                    value={editingAsset?.product}
                                    onValueChange={(value) => handleProductChange(value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {productsResponse?.data?.map((product: any) => (
                                            <SelectItem key={product._id} value={product._id}>
                                                {product.category.name} - {product.model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Serial Number</label>
                                <Input
                                    value={editingAsset?.serialNumber}
                                    onChange={(e) => setEditingAsset(prev => prev ? { ...prev, serialNumber: e.target.value } : null)}
                                    placeholder="Enter serial number"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Warranty Start Date</label>
                                <Input
                                    type="date"
                                    value={editingAsset?.warrantyStartDate}
                                    onChange={(e) => setEditingAsset(prev => prev ? { ...prev, warrantyStartDate: e.target.value } : null)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Warranty End Date</label>
                                <Input
                                    type="date"
                                    value={editingAsset?.warrantyEndDate}
                                    onChange={(e) => setEditingAsset(prev => prev ? { ...prev, warrantyEndDate: e.target.value } : null)}
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-md font-medium mb-2">Product Specifications</h3>
                            {editingAsset?.product ? (
                                <SpecificationsComponent
                                    accessData={editingAsset?.specifications || {}}
                                    handleChange={handleSpecificationsChange}
                                    selectedItem={selectedProductForSpecs}
                                />
                            ) : (
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-center text-muted-foreground">
                                            Please select a product first to see specifications
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsProductDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    if (editingAsset) {
                                        handleSaveProduct(editingAsset);
                                    }
                                }}
                            >
                                {editingAsset?._id ? 'Update' : 'Add'} Product
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <BulkAddDialog
                isOpen={isBulkDialogOpen}
                closeDialog={() => {
                    setIsBulkDialogOpen(false);
                    setSelectedItem(null);
                }}
                onSave={saveAsset}
                products={productsResponse?.data || []}
                warehouses={warehousesResponse?.data || []}
                vendors={vendorsResponse?.data || []}
                initialData={{}}
            />
        </div>
    );
};

export default InventoryPage;