import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "../ui/ComboBoxWrapper";
import { DatePicker } from "../ui/date-picker";
import useUserAuthorised from "@/hooks/useUserAuthorised";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronLeft, ChevronRight, Plus, Trash, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateMasterMutation } from "@/services/endpoints/masterApi";
import { MONGO_MODELS } from "@/shared/constants";

interface Field {
  name: string;
  label?: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  readOnly?: boolean;
  format?: string;
  data?: any[];
  options?: string[];
  onChange?: (value: string) => void;
  validate?: (value: any, formData?: any) => string | undefined;
  CustomComponent?: React.ComponentType<{
    accessData: any;
    handleChange: (e: { target: { value: any } }, fieldName: string) => void;
    selectedItem?: any;
  }>;
}

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
  addedBy: string;
  updatedBy: string;
}

interface ProductItem {
  _id?: string;
  product: string;
  productName?: string;
  quantity: number;
  serialNumbers: string[];
  specifications: Record<string, any>;
  warrantyStartDate: string;
  warrantyEndDate: string;
  isNew?: boolean;
}

interface CommonData {
  _id?: string;
  invoiceNumber: string;
  vendor: string;
  poNumber: string;
  prNumber?: string;
  warehouse: string;
  purchaseDate: string;
  isActive: boolean;
}

interface SaveResult {
  id: string;
  item: AssetFormData;
  success: boolean;
  message?: string;
}

interface BulkAddDialogProps {
  isOpen: boolean;
  closeDialog: () => void;
  onSave: (data: { formData: AssetFormData; action: string }) => Promise<any>;
  products: any[];
  warehouses: any[];
  vendors: any[];
  initialData?: any;
}

const BulkAddDialog: React.FC<BulkAddDialogProps> = ({
  isOpen,
  closeDialog,
  onSave,
  products,
  warehouses,
  vendors,
  initialData
}) => {
  const { user }:any = useUserAuthorised();
  const [createMaster] = useCreateMasterMutation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveResults, setSaveResults] = useState<SaveResult[]>([]);

  const [countCalls,setCountCalls] = useState(0);
  
  // Common data for all items
  const [commonData, setCommonData]:any = useState<CommonData>({
    warehouse: '',
  });
  
  // Product items
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [currentProductItem, setCurrentProductItem] = useState<ProductItem>({
    product: '',
    quantity: 1,
    serialNumbers: [''],
    specifications: {},
    warrantyStartDate: new Date().toISOString().split('T')[0],
    warrantyEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });
  
  // Selected product for specifications
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCommonData({
        warehouse: '',
      });
      setProductItems([]);
      setCurrentProductItem({
        product: '',
        quantity: 1,
        serialNumbers: [''],
        specifications: {},
        purchasePrice: 0,
        warrantyStartDate: new Date().toISOString().split('T')[0],
        warrantyEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        warrantyDetails: '',
      });
      setSelectedProduct(null);
      setErrors({});
      setSaveResults([]);
    }
    setCommonData(initialData);
  }, [isOpen]);

  // Handle common data changes
  const handleCommonDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, 
    field: keyof CommonData
  ) => {
    setCommonData({
      ...commonData,
      [field]: e.target.value,
    });
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

 
  // Handle product selection
  const handleProductChange = (productId: string) => {
    const product = products.find((p: any) => p._id === productId);
    if (product) {
      setSelectedProduct(product);
      setCurrentProductItem({
        ...currentProductItem,
        product: productId,
        productName: `${product.category.name} (${product.name}-${product.model})`,
        specifications: {},
      });
    }
  };

  // Handle product item changes
  const handleProductItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, 
    field: keyof ProductItem
  ) => {
    setCurrentProductItem({
      ...currentProductItem,
      [field]: e.target.value,
    });
    
    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value) || 1;
    const serialNumbers = Array(quantity).fill('').map((_, i) => 
      currentProductItem.serialNumbers[i] || ''
    );
    
    setCurrentProductItem({
      ...currentProductItem,
      quantity,
      serialNumbers,
    });
  };

  // Handle serial number change
  const handleSerialNumberChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newSerialNumbers = [...currentProductItem.serialNumbers];
    newSerialNumbers[index] = e.target.value;
    
    setCurrentProductItem({
      ...currentProductItem,
      serialNumbers: newSerialNumbers,
    });
    
    // Clear error for this serial number
    if (errors[`serialNumber${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`serialNumber${index}`];
        return newErrors;
      });
    }
  };

  // Handle specification change
  const handleSpecificationChange = (key: string, value: any, type: string) => {
    const newSpecs = {
      ...currentProductItem.specifications,
      [key]: { type, value }
    };
    
    setCurrentProductItem({
      ...currentProductItem,
      specifications: newSpecs,
    });
    
    // Clear specification error
    if (errors.specifications) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.specifications;
        return newErrors;
      });
    }
  };

  // Validate product item
  const validateProductItem = () => {
    const newErrors: Record<string, string> = {};
    
    if (!currentProductItem.product) {
      newErrors.product = "Product is required";
    }
    
    if (currentProductItem.quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }
    
    // if (currentProductItem.purchasePrice <= 0) {
    //   newErrors.purchasePrice = "Purchase price must be greater than 0";
    // }
    
    // Validate warranty dates
    if (!currentProductItem.warrantyStartDate) {
      newErrors.warrantyStartDate = "Warranty start date is required";
    }
    
    if (!currentProductItem.warrantyEndDate) {
      newErrors.warrantyEndDate = "Warranty end date is required";
    }
    
    const purchaseDate = new Date(commonData.purchaseDate);
    const warrantyStartDate = new Date(currentProductItem.warrantyStartDate);
    const warrantyEndDate = new Date(currentProductItem.warrantyEndDate);
    
    if (warrantyStartDate < purchaseDate) {
      newErrors.warrantyStartDate = "Warranty start date cannot be before purchase date";
    }
    
    if (warrantyEndDate <= warrantyStartDate) {
      newErrors.warrantyEndDate = "Warranty end date must be after warranty start date";
    }
    
    // Validate specifications
    if (selectedProduct?.category?.specsRequired) {
      const missingSpecs = Object.keys(selectedProduct.category.specsRequired)
        .filter(key => !currentProductItem.specifications[key]);
      
      if (missingSpecs.length > 0) {
        newErrors.specifications = `Missing specifications: ${missingSpecs.join(", ")}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate serial numbers
  const validateSerialNumbers = () => {
    const newErrors: Record<string, string> = {};
    
    let isValid = true;
    // Validate serial numbers
    const emptySerialIndex = currentProductItem.serialNumbers.findIndex(sn => !sn);
    if (emptySerialIndex >= 0) {
      newErrors[`serialNumber${emptySerialIndex}`] = "Serial number is required";
    }
    
    // Check for duplicate serial numbers
    const uniqueSerials = new Set(currentProductItem.serialNumbers);
    if (uniqueSerials.size !== currentProductItem.serialNumbers.length) {
      newErrors.serialNumbers = "Duplicate serial numbers are not allowed";
    }
    
    // Validate all product items' serial numbers
    productItems.forEach((item, productIndex) => {
      const emptySerialIndex = item.serialNumbers.findIndex(sn => !sn);
      if (emptySerialIndex >= 0) {
        newErrors[`product${productIndex}_serialNumber${emptySerialIndex}`] = "Serial number is required";
        isValid = false;
      }
      
      // Check for duplicate serial numbers within this product
      const uniqueSerials = new Set(item.serialNumbers);
      if (uniqueSerials.size !== item.serialNumbers.length) {
        newErrors[`product${productIndex}_serialNumbers`] = "Duplicate serial numbers are not allowed";
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    if (currentProductItem.product) {
      return Object.keys(newErrors).length === 0;
    }
    return isValid;
  };

  // Check for duplicate serial numbers across all products
  const checkForDuplicateSerialNumbers = () => {
    const allSerialNumbers: string[] = [];
    const duplicates: string[] = [];
    
    productItems.forEach(item => {
      item.serialNumbers.forEach(sn => {
        if (allSerialNumbers.includes(sn)) {
          duplicates.push(sn);
        } else {
          allSerialNumbers.push(sn);
        }
      });
    });
    
    if (duplicates.length > 0) {
      toast.error(`Duplicate serial numbers found across products: ${duplicates.join(', ')}`);
      return false;
    }
    return true;
  };

  // Add current product item to list
  const addProductItem = () => {
    if (!validateProductItem()) {
      
      return;
    }
    
    // Add to product items
    setProductItems([...productItems, currentProductItem]);
    
    // Reset current product item
    setCurrentProductItem({
      product: '',
      quantity: 1,
      serialNumbers: [''],
      specifications: {},
      purchasePrice: 0,
      warrantyStartDate: new Date().toISOString().split('T')[0],
      warrantyEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      warrantyDetails: '',
    });
    setSelectedProduct(null);
  };

  // Remove product item
  const removeProductItem = (index: number) => {
    const newItems = [...productItems];
    newItems.splice(index, 1);
    setProductItems(newItems);
  };

  // Validate step 1
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!commonData.vendor) {
      newErrors.vendor = "Vendor is required";
    }
    
    if (!commonData.poNumber) {
      newErrors.poNumber = "PO Number is required";
    }
    
    if (!commonData.invoiceNumber) {
      newErrors.invoiceNumber = "Invoice Number is required";
    }
    
    if (!commonData.warehouse) {
      newErrors.warehouse = "Warehouse is required";
    }
    
    if (!commonData.purchaseDate) {
      newErrors.purchaseDate = "Purchase Date is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next step
  const nextStep = () => {
    if (step === 1 && !validateStep1()) {
      return;
    }
    
    if (step === 2 && currentProductItem.product) {
      if (!validateProductItem()) {
        return;
      }
      
      // If there's a product selected but not added, ask user if they want to add it
      if (window.confirm("You have a product selected but not added. Do you want to add it before proceeding?")) {
        addProductItem();
      }
    }
    
    if (step === 2 && productItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }
    
    if (step === 3 && !validateSerialNumbers()) {
      return;
    }
    
    setStep(step + 1);
  };

  // Update serial numbers for a product
  const updateSerialNumbers = (productIndex: number, serialIndex: number, value: string) => {
    const updatedItems = [...productItems];
    updatedItems[productIndex].serialNumbers[serialIndex] = value;
    setProductItems(updatedItems);
    
    // Clear error for this serial number
    if (errors[`product${productIndex}_serialNumber${serialIndex}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`product${productIndex}_serialNumber${serialIndex}`];
        return newErrors;
      });
    }
    if (errors[`product${productIndex}_serialNumbers`]) {
      setErrors(prev => ({ ...prev, [`product${productIndex}_serialNumbers`]: "" }));
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    setStep(step - 1);
  };

  // Retry failed items
  const retryFailedItems = async () => {
    setIsSubmitting(true);
    const failedItems = saveResults.filter(r => !r.success).map(r => r.item);
    const newResults = [...saveResults.filter(r => r.success)];
    
    for (const item of failedItems) {
      try {
        const updatedData = { ...item, updatedBy: user._id, addedBy: user._id };
        const response = await onSave({ formData: updatedData as AssetFormData, action: "Add" });
        newResults.push({ 
          id: Math.random().toString(36).substring(7),
          item, 
          success: !response?.error, 
          message: response?.error?.message 
        });
      } catch (error: any) {
        newResults.push({ 
          id: Math.random().toString(36).substring(7),
          item, 
          success: false, 
          message: error.message || "Error saving item" 
        });
      }
    }
    
    setSaveResults(newResults);
    setIsSubmitting(false);
    
    const successCount = newResults.filter(r => r.success).length;
    toast.info(`Retry complete: ${successCount} of ${newResults.length} items successful`);
  };

const handleSubmit = async (e:any) => {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  
  if (isSubmitting) {
    return;
  }
  
  setIsSubmitting(true);

  if (!checkForDuplicateSerialNumbers()) {
    setIsSubmitting(false);
    return;
  }

  const results: SaveResult[] = [];
  
  try {
    // Validate required inventory fields
    const requiredFields = ['invoiceNumber', 'vendor', 'poNumber', 'warehouse', 'purchaseDate'];
    const missingFields = requiredFields.filter(field => 
      !commonData[field as keyof CommonData]
    );
    
    if (missingFields.length > 0) {
      toast.error(`Missing required fields: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    console.log('Creating inventory with data:', JSON.stringify(commonData, null, 2));

    // First create/update the inventory record
    let inventoryId = commonData._id;
    if (!inventoryId) {
      const inventoryData = {
        invoiceNumber: commonData.invoiceNumber,
        vendor: commonData.vendor,
        poNumber: commonData.poNumber,
        prNumber: commonData.prNumber || undefined, // Only include if not empty
        warehouse: commonData.warehouse,
        purchaseDate: commonData.purchaseDate,
        assets: [], // Will be populated with asset IDs
        isActive: true,
        addedBy: user._id,
        updatedBy: user._id
      };

      try {
        const inventoryResponse = await createMaster({
          db: MONGO_MODELS.INVENTORY_MASTER,
          action: 'create',
          data: inventoryData
        }).unwrap();

        if (!inventoryResponse || inventoryResponse.error) {
          const errorMsg = inventoryResponse?.error?.message || 'Failed to create inventory record';
          console.error('Inventory creation error:', errorMsg);
          toast.error(errorMsg);
          setIsSubmitting(false);
          return;
        }

        inventoryId = inventoryResponse.data._id;
        console.log('Successfully created inventory with ID:', inventoryId);
      } catch (error: any) {
        const errorMsg = error?.data?.message || error?.message || 'An unknown error occurred creating inventory';
        console.error('Error creating inventory:', error);
        toast.error(errorMsg);
        setIsSubmitting(false);
        return;
      }
    }

    // Create asset items from product items
    const assetItems: AssetFormData[] = [];
    
    for (const item of productItems) {
      for (const serialNumber of item.serialNumbers) {
        if (!serialNumber.trim()) {
          continue; // Skip empty serial numbers
        }
        
        const assetData = {
          serialNumber,
          product: item.product,
          warehouse: commonData.warehouse,
          inventory: inventoryId, // Add inventory reference
          status: 'available',
          warrantyStartDate: item.warrantyStartDate,
          warrantyEndDate: item.warrantyEndDate,
          specifications: item.specifications,
          isActive: true,
          addedBy: user._id,
          updatedBy: user._id,
        };
console.log(assetData,'assetData');
        // If editing an existing asset
        if (item._id) {
          assetData._id = item._id;
        }

        assetItems.push(assetData);
      }
    }
    
    if (assetItems.length === 0) {
      toast.error('No valid assets to create');
      setIsSubmitting(false);
      return;
    }
    
    // Move to results step before starting save operations
    setStep(5);
    
    // Initialize results array
    for (const item of assetItems) {
      const tempId = Math.random().toString(36).substring(7);
      results.push({ id: tempId, item, success: false, message: "Waiting..." });
    }
    setSaveResults([...results]);

    const newAssetIds: string[] = [];

    // Save items one by one
    for (let i = 0; i < assetItems.length; i++) {
      const item = assetItems[i];
      
      results[i].message = "Saving...";
      setSaveResults([...results]);
      
      try {
        console.log(`Saving asset ${i+1}/${assetItems.length}:`, JSON.stringify(item, null, 2));
        
        const response = await onSave({ 
          formData: item as AssetFormData, 
          action: item._id ? "Update" : "Add" 
        });
        
        if (!response || response.error) {
          results[i].success = false;
          results[i].message = response?.error?.message || "Failed to save";
          console.error(`Failed to save asset ${i+1}:`, response?.error);
        } else {
          results[i].success = true;
          results[i].message = "";
          if (!item._id) {
            newAssetIds.push(response.data._id);
          }
        }
      } catch (error:any) {
        results[i].success = false;
        results[i].message = error.message || "Error saving item";
        console.error(`Error saving asset ${i+1}:`, error);
      }
      
      setSaveResults([...results]);
    }

    // Update inventory with new asset IDs
    if (newAssetIds.length > 0) {
      try {
        console.log('Updating inventory with new asset IDs:', newAssetIds);
        
        await createMaster({
          db: MONGO_MODELS.INVENTORY_MASTER,
          action: 'update',
          filter: { _id: inventoryId },
          data: {
            $push: { assets: { $each: newAssetIds } }
          }
        });
      } catch (error) {
        console.error('Error updating inventory:', error);
        toast.error('Failed to update inventory with new assets');
      }
    }

    const successCount = results.filter(r => r.success).length;
    if (successCount === assetItems.length) {
      toast.success(`Successfully ${commonData._id ? 'updated' : 'added'} ${successCount} items`);
    } else {
      toast.warning(`${commonData._id ? 'Updated' : 'Added'} ${successCount} of ${assetItems.length} items`);
    }
  } catch (error) {
    console.error("Error saving data:", error);
    toast.error("Error adding items");
  } finally {
    setIsSubmitting(false);
  }
};

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 1: Common Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Vendor</Label>
                <Combobox
                  field={{
                    name: "vendor",
                    type: "select",
                    data: vendors?.map((vendor: any) => ({
                      name: vendor.name,
                      _id: vendor._id
                    })) || []
                  }}
                  formData={commonData}
                  handleChange={(value: any) => {
                    console.log("Vendor selected:", value);
                    setCommonData({
                      ...commonData,
                      vendor: value
                    });
                    if (errors.vendor) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.vendor;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Select vendor"
                  initialValue={commonData?.vendor?._id || ""}
                />
                {errors.vendor && <span className="text-sm text-destructive">{errors.vendor}</span>}
              </div>
              
              <div>
                <Label>Warehouse</Label>
                <Combobox
                  field={{
                    name: "warehouse",
                    type: "select",
                    data: warehouses?.map((wh: any) => ({
                      name: wh.name,
                      _id: wh._id
                    })) || []
                  }}
                  formData={commonData}
                  handleChange={(value: any) => {
                    console.log("Warehouse selected:", initialData);
                    setCommonData({
                      ...commonData,
                      warehouse: value
                    });
                    if (errors.warehouse) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.warehouse;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Select warehouse"
                />
                {errors.warehouse && <span className="text-sm text-destructive">{errors.warehouse}</span>}
              </div>
              
              <div>
                <Label>PO Number</Label>
                <Input
                  type="text"
                  value={commonData?.poNumber}
                  onChange={(e) => handleCommonDataChange(e, "poNumber")}
                  placeholder="Enter PO number"
                  className={errors.poNumber ? "border-destructive" : ""}
                />
                {errors.poNumber && <span className="text-sm text-destructive">{errors.poNumber}</span>}
              </div>
              
              <div>
                <Label>PR Number</Label>
                <Input
                  type="text"
                  value={commonData?.prNumber}
                  onChange={(e) => handleCommonDataChange(e, "prNumber")}
                  placeholder="Enter PR number"
                />
              </div>
              
              <div>
                <Label>Invoice Number</Label>
                <Input
                  type="text"
                  value={commonData?.invoiceNumber}
                  onChange={(e) => handleCommonDataChange(e, "invoiceNumber")}
                  placeholder="Enter invoice number"
                  className={errors.invoiceNumber ? "border-destructive" : ""}
                />
                {errors.invoiceNumber && <span className="text-sm text-destructive">{errors.invoiceNumber}</span>}
              </div>
              
              <div>
                <Label>Purchase Date</Label>
                <DatePicker
                  currentDate={commonData?.purchaseDate}
                  handleChange={(selectedDate: Date | null) => {
                    setCommonData({
                      ...commonData,
                      purchaseDate: selectedDate?.toISOString().split('T')[0] || ''
                    });
                    if (errors.purchaseDate) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.purchaseDate;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Select purchase date"
                />
                {errors.purchaseDate && <span className="text-sm text-destructive">{errors.purchaseDate}</span>}
              </div>
            </div>
          </div>
        );
        
      case 2:
        console.log(currentProductItem)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 2: Product Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Product</Label>
                <Combobox
                  field={{
                    name: "product",
                    type: "select",
                    data: products?.map((prod: any) => ({
                      name: `${prod.category.name} (${prod.brand}-${prod.model})`,
                      _id: prod._id
                    })) || []
                  }}
                  formData={currentProductItem}
                  handleChange={handleProductChange}
                  placeholder="Select product"
                />
                {errors.product && <span className="text-sm text-destructive">{errors.product}</span>}
              </div>
              
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={currentProductItem.quantity}
                  onChange={handleQuantityChange}
                  placeholder="Enter quantity"
                  className={errors.quantity ? "border-destructive" : ""}
                />
                {errors.quantity && <span className="text-sm text-destructive">{errors.quantity}</span>}
              </div>
              
              {/* <div>
                <Label>Purchase Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentProductItem.purchasePrice}
                  onChange={(e) => handleProductItemChange(e, "purchasePrice")}
                  placeholder="Enter purchase price"
                  className={errors.purchasePrice ? "border-destructive" : ""}
                />
                {errors.purchasePrice && <span className="text-sm text-destructive">{errors.purchasePrice}</span>}
              </div> */}
              
              <div>
                <Label>Warranty Start Date</Label>
                <DatePicker
                  currentDate={currentProductItem.warrantyStartDate}
                  handleChange={(selectedDate: Date | null) => {
                    setCurrentProductItem({
                      ...currentProductItem,
                      warrantyStartDate: selectedDate?.toISOString().split('T')[0] || ''
                    });
                    if (errors.warrantyStartDate) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.warrantyStartDate;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Select warranty start date"
                />
                {errors.warrantyStartDate && <span className="text-sm text-destructive">{errors.warrantyStartDate}</span>}
              </div>
              
              <div>
                <Label>Warranty End Date</Label>
                <DatePicker
                  currentDate={currentProductItem.warrantyEndDate}
                  handleChange={(selectedDate: Date | null) => {
                    setCurrentProductItem({
                      ...currentProductItem,
                      warrantyEndDate: selectedDate?.toISOString().split('T')[0] || ''
                    });
                    if (errors.warrantyEndDate) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.warrantyEndDate;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Select warranty end date"
                />
                {errors.warrantyEndDate && <span className="text-sm text-destructive">{errors.warrantyEndDate}</span>}
              </div>
              
              <div className="col-span-2">
                <Label>Warranty Details</Label>
                <textarea
                  rows={3}
                  value={currentProductItem.warrantyDetails}
                  onChange={(e) => handleProductItemChange(e, "warrantyDetails")}
                  placeholder="Enter warranty details"
                  className="w-full outline-1 outline-red-900 rounded-lg shadow-md p-4 outline-double bg-gray-100"
                />
              </div>
            </div>
            
            {selectedProduct && (
              <div className="mt-4">
                <Label>Specifications</Label>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {Object.entries(selectedProduct?.category?.specsRequired || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex gap-2 items-center">
                        <label className="w-1/3 font-medium">{key}:</label>
                        {value.type === "boolean" ? (
                          <select
                            value={String(currentProductItem.specifications[key]?.value || "false")}
                            onChange={(e) => handleSpecificationChange(key, e.target.value === "true", value.type)}
                            className="flex-1 p-2 border rounded"
                          >
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        ) : (
                          <Input
                            type={value.type === "number" ? "number" : "text"}
                            value={String(currentProductItem.specifications[key]?.value || "")}
                            onChange={(e) => handleSpecificationChange(
                              key, 
                              value.type === "number" ? Number(e.target.value) : e.target.value,
                              value.type
                            )}
                            className="flex-1"
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                {errors.specifications && <span className="text-sm text-destructive">{errors.specifications}</span>}
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <Button onClick={addProductItem} disabled={!selectedProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
            
            {productItems.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Added Products</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {productItems.map((item, index) => {
                      const product = products.find((p: any) => p._id === item.product);
                      return (
                        <Card key={index} className="p-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{product?.name || "Product"}</div>
                              <div className="text-sm text-muted-foreground">
                                Quantity: {item.quantity} | Price: {item.purchasePrice}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProductItem(index)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 3: Serial Numbers</h3>
            
            <ScrollArea className="h-[400px]">
              {productItems.length > 0 ? (
                <div className="space-y-6">
                  {productItems.map((item, productIndex) => {
                    const product = products.find((p: any) => p._id === item.product);
                    return (
                      <Card key={productIndex} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                {product?.name || "Product"}
                              </h4>
                              <Badge>Quantity: {item.quantity}</Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {item.serialNumbers.map((serialNumber, serialIndex) => (
                              <div key={serialIndex} className="flex gap-2 items-center">
                                <Label className="w-24">Serial #{serialIndex + 1}</Label>
                                <Input
                                  type="text"
                                  value={serialNumber}
                                  onChange={(e) => updateSerialNumbers(productIndex, serialIndex, e.target.value)}
                                  placeholder={`Enter serial number ${serialIndex + 1}`}
                                  className={errors[`product${productIndex}_serialNumber${serialIndex}`] ? "border-destructive" : ""}
                                />
                                {errors[`product${productIndex}_serialNumber${serialIndex}`] && (
                                  <span className="text-sm text-destructive">{errors[`product${productIndex}_serialNumber${serialIndex}`]}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {errors[`product${productIndex}_serialNumbers`] && (
                            <div className="text-sm text-destructive">{errors[`product${productIndex}_serialNumbers`]}</div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No products added. Go back to Step 2 to add products.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 4: Review</h3>
            
            <Card>
              <CardHeader>
                <CardTitle>Common Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Vendor:</span>{" "}
                    {vendors.find((v: any) => v._id === commonData.vendor)?.name || ""}
                  </div>
                  <div>
                    <span className="font-medium">Warehouse:</span>{" "}
                    {warehouses.find((w: any) => w._id === commonData.warehouse)?.name || ""}
                  </div>
                  <div>
                    <span className="font-medium">PO Number:</span> {commonData.poNumber}
                  </div>
                  <div>
                    <span className="font-medium">PR Number:</span> {commonData.prNumber || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Invoice Number:</span> {commonData.invoiceNumber}
                  </div>
                  <div>
                    <span className="font-medium">Purchase Date:</span>{" "}
                    {new Date(commonData.purchaseDate).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {productItems.map((item, index) => {
                      const product = products.find((p: any) => p._id === item.product);
                      return (
                        <Card key={index} className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{product?.name || "Product"}</h4>
                              <Badge>Quantity: {item.quantity}</Badge>
                            </div>
                            
                            {/* <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium">Purchase Price:</span> {item.purchasePrice}
                              </div>
                              <div>
                                <span className="font-medium">Warranty:</span>{" "}
                                {new Date(item.warrantyStartDate).toLocaleDateString()} to{" "}
                                {new Date(item.warrantyEndDate).toLocaleDateString()}
                              </div>
                            </div> */}
                            
                            <Separator />
                            
                            <div>
                              <h5 className="font-medium mb-1">Specifications:</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(item.specifications).map(([key, value]: [string, any]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span>{" "}
                                    {typeof value.value === "boolean" ? (value.value ? "Yes" : "No") : value.value}
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium mb-1">Serial Numbers:</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {item.serialNumbers.map((sn, i) => (
                                  <div key={i}>
                                    <span className="font-medium">#{i + 1}:</span> {sn}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <div className="text-right text-sm text-muted-foreground">
              Total items to add: {productItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Step 5: Results</h3>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {saveResults.map((result) => (
                  <Card key={result.id} className="p-2">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <div className="font-medium">
                          {products.find((p: any) => p._id === result.item.product)?.name || "Product"} - 
                          {result.item.serialNumber}
                        </div>
                        {!result.success && (
                          <div className="text-sm text-destructive">{result.message}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex justify-between items-center mt-4">
              <div>
                <Badge variant="outline" className="mr-2">
                  Total: {saveResults.length}
                </Badge>
                <Badge variant="default" className="mr-2">
                  Success: {saveResults.filter(r => r.success).length}
                </Badge>
                <Badge variant="destructive">
                  Failed: {saveResults.filter(r => !r.success).length}
                </Badge>
              </div>
              <div className="flex gap-2">
                {saveResults.some(r => !r.success) && (
                  <Button onClick={retryFailedItems} disabled={isSubmitting} variant="secondary">
                    {isSubmitting ? "Retrying..." : "Retry Failed"}
                  </Button>
                )}
                <Button onClick={closeDialog}>Close</Button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`flex items-center ${s < 5 ? "flex-1" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s === step
                  ? "bg-primary text-white"
                  : s < step
                  ? "bg-primary/20 text-primary"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s}
            </div>
            {s < 5 && (
              <div
                className={`h-1 flex-1 ${
                  s < step ? "bg-primary/20" : "bg-gray-200"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="max-w-4xl max-h-[90%] pointer-events-auto mx-2 h-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Assets</DialogTitle>
        </DialogHeader>
        
        {renderStepIndicator()}
        
        <div className="bg-white h-full max-h-[450px] overflow-y-auto p-2 rounded-md">
          {renderStepContent()}
        </div>
        
        <DialogFooter>
          {step > 1 && step < 5 && (
            <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          {step < 4 && (
            <Button onClick={nextStep} disabled={isSubmitting}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          
          {step === 4 && (
  <Button 
    type="button" 
    onClick={(e) => {
      e.stopPropagation(); // Prevent event bubbling
      handleSubmit(e);
    }} 
    disabled={isSubmitting}
  >
    {isSubmitting ? "Saving..." : "Save All"}
  </Button>
)}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAddDialog;
