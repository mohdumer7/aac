"use client"

import React, { useEffect, useState } from 'react';
import MasterComponent from '@/components/MasterComponent/MasterComponent';
import { Plus, UserPlus, RotateCcw, History, Undo2, FileClock, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetMasterQuery, useCreateMasterMutation } from '@/services/endpoints/masterApi';
import DynamicDialog from '@/components/ModalComponent/ModelComponent';
import { MONGO_MODELS } from '@/shared/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-toastify';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import { validate } from '@/shared/functions';
import { transformData } from '@/lib/utils';
import moment from 'moment';

interface AssignmentFormData {
    _id: string;
    assignedTo: string;
    assignedType: 'User' | 'Department';
    location?: string;
    remarks?: string;
    isActive: boolean;
}

interface HistoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    asset: any;
}

const HistoryDialog = ({ isOpen, onClose, asset }: HistoryDialogProps) => {
    if (!asset) return null;
    
    const getAssigneeName = (assignment: any) => {
        if (!assignment) return '';
        const assignee = assignment.assignedTo;
        if (!assignee) return '-';
        if (assignment.assignedType === 'User') {
            return `${assignee.firstName} ${assignee.lastName}`;
        }
        return assignee.name;
    };

    const getLocationName = (assignment: any) => {
        if (!assignment?.location) return '-';
        return assignment.location.name;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Asset History - {asset.serialNumber}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 flex-1 overflow-y-auto">
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Current Assignment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {asset.currentAssignment ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium">Assigned To:</span>
                                        <span>{getAssigneeName(asset.currentAssignment)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Type:</span>
                                        <Badge>{asset.currentAssignment.assignedType}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Date:</span>
                                        <span>{new Date(asset.currentAssignment.assignedDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Location:</span>
                                        <span>{getLocationName(asset.currentAssignment)}</span>
                                    </div>
                                    {asset.currentAssignment.remarks && (
                                        <div className="flex justify-between">
                                            <span className="font-medium">Remarks:</span>
                                            <span>{asset.currentAssignment.remarks}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">Not currently assigned</div>
                            )}
                        </CardContent>
                    </Card>

                    <Separator className="my-4" />

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Assignment History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {asset.assignmentHistory?.length > 0 ? (
                                    asset.assignmentHistory.map((history: any, index: number) => (
                                        <div key={`${asset._id}-history-${index}`} className="p-4 border rounded-lg">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Assigned To:</span>
                                                    <span>{getAssigneeName(history)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Type:</span>
                                                    <Badge>{history.assignedType}</Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Assigned Date:</span>
                                                    <span>{new Date(history.assignedDate).toLocaleDateString()}</span>
                                                </div>
                                                {history.returnedDate && (
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Returned Date:</span>
                                                        <span>{new Date(history.returnedDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Location:</span>
                                                    <span>{getLocationName(history)}</span>
                                                </div>
                                                {history.remarks && (
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Remarks:</span>
                                                        <span>{history.remarks}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground">No assignment history</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const AssetManagementPage = () => {
    const router = useRouter();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<"Assign" | "Return" | "Add">("Assign");
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [assignmentType, setAssignmentType] = useState<'User' | 'Department'>('User');
    const { user }: any = useUserAuthorised();

    // API hooks with proper population
    const { data: assetsResponse, isLoading: assetsLoading, refetch } = useGetMasterQuery({
        db: MONGO_MODELS.ASSET_MASTER,
        filter: { isActive: true },
        populate: [
            { path: 'product' },
            { path: 'warehouse' },
            { path: 'inventory' },
            { path: 'inventory.vendor', select: 'name' },
            { path: 'currentAssignment.assignedTo', select: 'firstName lastName name' },
            { path: 'currentAssignment.location', select: 'name' },
            { path: 'assignmentHistory.assignedTo', select: 'firstName lastName name' },
            { path: 'assignmentHistory.location', select: 'name' }
        ]
    });
    const { data: locationResponse, isLoading: locationLoading } = useGetMasterQuery({
        db: MONGO_MODELS.LOCATION_MASTER,
        filter: { isActive: true }
    });
    const { data: productsResponse, isLoading: productsLoading } = useGetMasterQuery({
        db: MONGO_MODELS.PRODUCT_MASTER,
        filter: { isActive: true },
        populate: ['category']
    });

    const { data: usersResponse } = useGetMasterQuery({
        db: MONGO_MODELS.USER_MASTER,
        filter: { isActive: true }
    });

    const { data: departmentsResponse } = useGetMasterQuery({
        db: MONGO_MODELS.DEPARTMENT_MASTER,
        filter: { isActive: true }
    });
    const fieldsToAdd = [
        { fieldName: 'productName', path: ['product', 'name'] },
        { fieldName: 'categoryName', path: ['product', 'category', 'name'] },
        { fieldName: 'warehouseName', path: ['warehouse', 'name'] },
        { fieldName: 'assigneeName', path: ['currentAssignment', 'assignedTo'], transform: (assignedTo: any) => 
            assignedTo ? (assignedTo.firstName && assignedTo.lastName ? 
                `${assignedTo.firstName} ${assignedTo.lastName}` : 
                assignedTo.name) : '-'
        }
    ];
    const transformedData = transformData(assetsResponse?.data || [], fieldsToAdd);


    const loading = productsLoading || assetsLoading || locationLoading;
    const [createMaster] = useCreateMasterMutation();

    const statusData = [
        { _id: true, name: "True" },
        { _id: false, name: "False" },
    ];

    // Form fields for assignment
    const formFields = [
        {
            name: "assignedType",
            label: "Assign To",
            placeholder: "Select assign to",
            type: "select",
            required: true,
            data: [
                { _id: "User", name: "User" },
                { _id: "Department", name: "Department" }
            ],
            onChange: (value: string) => setAssignmentType(value as 'User' | 'Department')
        },
        {
            name: "assignedTo",
            label: "Select User/Department",
            placeholder: "Select user/department",
            type: "select",
            required: true,
            data: assignmentType === 'User'
                ? usersResponse?.data?.map((user: any) => ({
                    name: `${user.firstName} ${user.lastName}`,
                    _id: user._id
                })) || []
                : departmentsResponse?.data?.map((dept: any) => ({
                    name: dept.name,
                    _id: dept._id
                })) || [],
            validate: (value: string) => {
                if (!value) return `Please select a ${assignmentType}`;
                return undefined;
            }
        },
        {
            name: "location",
            label: "Location",
            type: "select",
            required: true,
            placeholder: "Select location",
            data: locationResponse?.data?.map((location: any) => ({
                name: location.name,
                _id: location._id
            })) || [],
            validate: validate.locationSelected
        },
        {
            name: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Enter any remarks",
            validate: (value: string) => {
                if (value && value.length > 500) return "Remarks must be less than 500 characters";
                return undefined;
            }
        }
    ];

    // Form fields for asset creation/edit
    const getFormFields = () => {
        if (dialogAction === 'Add') {
            return [
                {
                    name: "serialNumber",
                    label: "Serial Number",
                    type: "text",
                    required: true,
                    placeholder: "Enter serial number",
                    validate: (value: string) => {
                        if (!value) return "Serial number is required";
                        if (value.length < 3) return "Serial number must be at least 3 characters";
                        return undefined;
                    }
                },
                {
                    name: "product",
                    label: "Product",
                    type: "select",
                    required: true,
                    placeholder: "Select product",
                    data: productsResponse?.data?.map((product: any) => ({
                        name: `${product.category.name} - ${product.model}`,
                        _id: product._id
                    })) || [],
                    validate: (value: string) => !value ? "Product is required" : undefined
                },
                {
                    name: "warehouse",
                    label: "Warehouse",
                    type: "select",
                    required: true,
                    placeholder: "Select warehouse",
                    data: locationResponse?.data?.map((location: any) => ({
                        name: location.name,
                        _id: location._id
                    })) || [],
                    validate: (value: string) => !value ? "Warehouse is required" : undefined
                },
                {
                    name: "warrantyStartDate",
                    label: "Warranty Start Date",
                    type: "date",
                    required: true,
                    validate: (value: string) => !value ? "Warranty start date is required" : undefined
                },
                {
                    name: "warrantyEndDate",
                    label: "Warranty End Date",
                    type: "date",
                    required: true,
                    validate: (value: string) => !value ? "Warranty end date is required" : undefined
                }
            ];
        }
        
        return formFields; // Return assignment fields for Assign/Return actions
    };

    // Configure table columns
    const columns = [
        {
            accessorKey: "serialNumber",
            header: ({ column }: { column: any }) => {
                return (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Serial Number
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }: any) => <div className="font-medium">{row.original.serialNumber}</div>
        },
        {
            accessorKey: "product",
            header: ({ column }: { column: any }) => {
                return (
                    <Button
                        variant="ghost"
                        className="p-0 hover:bg-transparent"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Product
                        <ChevronsUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }: any) => (
                <div>
                    <div className="font-medium">{row.original.categoryName}</div>
                    <div className="text-sm text-muted-foreground">{row.original.product?.model}</div>
                </div>
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
                <Badge variant="outline">
                    {row.original.warehouseName}
                </Badge>
            )
        },
        {
            accessorKey: "status",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();
                return (
                    <button
                        className="group flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Status</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        />
                    </button>
                );
            },
            cell: ({ row }: any) => (
                <Badge variant={
                    row.original.status === 'available' ? "default" :
                    row.original.status === 'assigned' ? "secondary" :
                    row.original.status === 'maintenance' ? "outline" :
                    "destructive"
                }>
                    {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                </Badge>
            )
        },
        {
            accessorKey: "currentAssignment",
            header: ({ column }: { column: any }) => {
                const isSorted = column.getIsSorted();
                return (
                    <button
                        className="group flex items-center space-x-2"
                        onClick={() => column.toggleSorting(isSorted === "asc")}
                    >
                        <span>Current Assignment</span>
                        <ChevronsUpDown
                            size={15}
                            className={`transition-opacity duration-150 ${isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        />
                    </button>
                );
            },
            cell: ({ row }: any) => {
                const assignment = row.original.currentAssignment;
                if (!assignment) return '-';
                const assignee = assignment.assignedTo;
                const name = assignment.assignedType === 'User'
                    ? `${assignee.firstName} ${assignee.lastName}`
                    : assignee.name;
                return (
                    <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-sm text-muted-foreground">
                            {new Date(assignment.assignedDate).toLocaleDateString()}
                        </div>
                        {assignment.location && (
                            <div className="text-sm text-muted-foreground">
                                {assignment.location.name}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: "actions",
            header: "Actions",
            cell: ({ row }: any) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAssign(row.original);
                        }}
                        disabled={actionLoading}
                        variant={row.original.status === 'available' ? "default" : "outline"}
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {row.original.status === 'available' ? 'Assign' : 'Reassign'}
                    </Button>

                    {row.original.status === 'assigned' && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReturn(row.original);
                            }}
                            disabled={actionLoading}
                        >
                            <Undo2 className="h-4 w-4 mr-2" />
                            Return
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(row.original);
                            setIsHistoryOpen(true);
                        }}
                    >
                        <FileClock className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    const handleAssign = (asset: any) => {
        setDialogAction("Assign");
        setSelectedItem({
            _id: asset._id,
            assignedType: 'User',
            currentAssignment: asset.currentAssignment
        });
        setIsDialogOpen(true);
    };

    const handleReturn = async (asset: any) => {
        try {
            setActionLoading(true);
            const currentAssignment = { ...asset.currentAssignment };
            await createMaster({
                db: MONGO_MODELS.ASSET_MASTER,
                action: 'update',
                filter: { _id: asset._id },
                data: {
                    status: 'available',
                    currentAssignment: null,
                    $push: {
                        assignmentHistory: {
                            ...currentAssignment,
                            returnedDate: new Date()
                        }
                    }
                }
            }).unwrap();
            toast.success('Asset returned successfully');
            refetch();
        } catch (error) {
            console.error('Error returning asset:', error);
            toast.error('Failed to return asset');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDialogAction = (action: "Assign" | "Return" | "Add", item?: any) => {
        setDialogAction(action);
        setSelectedItem(item || {});
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedItem({});
        setDialogAction("Assign");
    };

    const handleSave = async ({ formData, action }: { formData: AssignmentFormData; action: string }) => {
        setActionLoading(true);
        try {
            let updateData;
            
            if (action === 'Add') {
                // Create new asset
                const response = await createMaster({
                    db: MONGO_MODELS.ASSET_MASTER,
                    data: {
                        ...formData,
                        status: 'available',
                        isActive: true,
                        addedBy: user._id,
                        updatedBy: user._id
                    }
                }).unwrap();
                
                if (response) {
                    toast.success("Asset created successfully");
                    handleCloseDialog();
                    refetch();
                }
            } else if (action === 'Assign') {
                // Handle assignment
                const currentAssignment = selectedItem.currentAssignment;
                if (currentAssignment) {
                    // Add current assignment to history before updating
                    updateData = {
                        status: 'assigned',
                        currentAssignment: {
                            assignedTo: formData.assignedTo,
                            assignedType: formData.assignedType,
                            assignedDate: new Date(),
                            location: formData.location,
                            assignedBy: user._id,
                            remarks: formData.remarks
                        },
                        $push: {
                            assignmentHistory: {
                                ...currentAssignment,
                                returnedDate: new Date()
                            }
                        }
                    };
                } else {
                    updateData = {
                        status: 'assigned',
                        currentAssignment: {
                            assignedTo: formData.assignedTo,
                            assignedType: formData.assignedType,
                            assignedDate: new Date(),
                            location: formData.location,
                            assignedBy: user._id,
                            remarks: formData.remarks
                        }
                    };
                }

                const response = await createMaster({
                    db: MONGO_MODELS.ASSET_MASTER,
                    action: 'update',
                    filter: { _id: formData._id || selectedItem._id },
                    data: updateData
                }).unwrap();

                if (response) {
                    toast.success("Asset assigned successfully");
                    handleCloseDialog();
                    refetch();
                }
            }
        } catch (error: any) {
            toast.error(error?.data?.message || `Failed to ${action.toLowerCase()} asset`);
        } finally {
            setActionLoading(false);
        }
    };

    // Configure page layout
    const pageConfig = {
        searchFields: [
            { 
                name: 'serialNumber', 
                label: 'Serial Number', 
                type: 'text',
                placeholder: 'Search by serial number...'
            },
            { 
                name: 'productName', 
                label: 'Product', 
                type: 'text',
                placeholder: 'Search by product name...'
            }
        ],
        filterFields: [
            {
                name: 'status',
                label: 'Status',
                type: 'select',
                placeholder: 'Select status...',
                options: [
                    { value: 'available', label: 'Available' },
                    { value: 'assigned', label: 'Assigned' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'retired', label: 'Retired' }
                ]
            },
            {
                name: 'warehouse',
                label: 'Warehouse',
                type: 'select',
                placeholder: 'Select warehouse...',
                options: locationResponse?.data?.map((warehouse: any) => ({
                    value: warehouse._id,
                    label: warehouse.name
                })) || []
            }
        ],
        dataTable: {
            columns,
            data: transformedData,
            onRowClick: (row: any) => {
                setSelectedItem(row.original);
                setIsHistoryOpen(true);
            }
        }
    };

    return (
        <div className="container mx-auto p-4">
            <MasterComponent
                config={pageConfig}
                loadingState={loading}
                rowClassMap={{
                    'bg-muted': (row: any) => row.original.status === 'retired',
                    'bg-muted/50': (row: any) => row.original.status === 'maintenance'
                }}
                summary={false}
            />
            <DynamicDialog
                isOpen={isDialogOpen}
                closeDialog={handleCloseDialog}
                selectedMaster="Asset"
                onSave={handleSave}
                fields={getFormFields()}
                initialData={selectedItem || {}}
                action={dialogAction}
                isSubmitting={actionLoading}
                height="auto"
                onchangeData={(data) => {
                    if (data.fieldName === 'assignedType') {
                        setAssignmentType(data.id as 'User' | 'Department');
                    }
                }}
            />
            <HistoryDialog
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                asset={selectedItem}
            />
        </div>
    );
};

export default AssetManagementPage;