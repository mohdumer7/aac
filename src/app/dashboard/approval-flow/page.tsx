"use client";

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    useGetApprovalFlowsQuery,
    useCreateApprovalFlowMutation,
    useUpdateApprovalFlowMutation,
    useDeleteApprovalFlowMutation,
    CreateApprovalFlowPayload,
    UpdateApprovalFlowPayload
} from '@/services/endpoints/approvalFlowApi';
import { IApprovalFlow } from '@/models/approvals/ApprovalFlow.model';

// Type for approval flow with a required _id
interface ApprovalFlowWithId extends IApprovalFlow {
  _id: string;
}
import { useGetMasterQuery } from '@/services/endpoints/masterApi'; // Added for fetching departments
import { department } from '@/types/master/department.types'; // Import department type

import { Button } from '@/components/ui/button'; // Keep this if MasterComponent doesn't provide it or for other uses
import { Plus } from 'lucide-react';

// Import the actual components
import ApprovalFlowList from './components/ApprovalFlowList';
import ApprovalFlowForm from './components/ApprovalFlowForm';

// Import Dialog components from shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  // DialogDescription, // Uncomment if you add a description
} from "@/components/ui/dialog";

const ApprovalFlowPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Partial<ApprovalFlowWithId> | null>(null);
  const [formKey, setFormKey] = useState<number>(0);
  const { data: session } = useSession();

  const { data: approvalFlowsData, isLoading: isLoadingFlows, error, refetch } = useGetApprovalFlowsQuery();
  
  // Transform the API response to match our domain model
  const approvalFlows = React.useMemo(() => {
    if (!approvalFlowsData) return [];
    
    // Safely cast the API response to our domain model type
    const flows = (approvalFlowsData as unknown as any)?.data || [];
    
    // Transform each item to ensure proper typing
    return flows.map((flow: any) => {
      // Handle departmentId - preserve the object structure if it exists
      const departmentId = flow.departmentId
        ? typeof flow.departmentId === 'object'
          ? flow.departmentId // Keep the object as is
          : { _id: flow.departmentId?.toString() || '' } // Convert to object with _id
        : null;
      
      return {
        ...flow,
        _id: flow._id?.toString() || '',
        createdBy: flow.createdBy?.toString() || '',
        departmentId, // Use the processed departmentId
        // Ensure flowDefinition is properly typed
        flowDefinition: flow.flowDefinition 
          ? typeof flow.flowDefinition === 'string' 
            ? JSON.parse(flow.flowDefinition) 
            : flow.flowDefinition
          : { nodes: [], edges: [] },
      };
    }) as ApprovalFlowWithId[];
  }, [approvalFlowsData]);
  const [createApprovalFlow, { isLoading: isCreating }] = useCreateApprovalFlowMutation();
  const [updateApprovalFlow, { isLoading: isUpdating }] = useUpdateApprovalFlowMutation();
  const [deleteApprovalFlowMutation, { isLoading: isDeleting }] = useDeleteApprovalFlowMutation();

  // Fetch departments
  const { data: departmentsResponse, isLoading: isLoadingDepartments } = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    sort: { name: -1 },
    // You might want to add a filter if needed, e.g., { isActive: true }
  });
  const departments: department[] = departmentsResponse?.data || []; // Explicitly typed

  const handleOpenModal = useCallback((flow: ApprovalFlowWithId | null = null) => {
    console.log('Opening modal with flow:', flow?._id || 'new');
    setEditingFlow(flow);
    // Reset the form key to force a complete remount of the form
    setFormKey(prev => prev + 1);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    console.log('Closing modal');
    setIsModalOpen(false);
    
    // Clear the editing flow after the modal is closed
    // This ensures the form is properly reset when reopened
    setTimeout(() => {
      console.log('Clearing editing flow');
      setEditingFlow(null);
    }, 300); // Match this with your modal close animation duration
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      handleCloseModal();
    } else {
      setIsModalOpen(true);
    }
  }, [handleCloseModal]);

  const handleSubmitForm = useCallback(async (formData: any) => {
    try {
      if (editingFlow && editingFlow._id) {
        // For update, we need to include the _id and nest the update data under 'data'
        const updateData: any = {
          _id: editingFlow._id.toString(),
          data: {
            ...formData,
            // Ensure flowDefinition is properly stringified if it's an object
            ...(formData.flowDefinition && typeof formData.flowDefinition === 'object' 
              ? { flowDefinition: JSON.stringify(formData.flowDefinition) }
              : {})
          }
        };

        // Handle departmentId specifically - ensure it's properly set or unset
        if (formData.departmentId) {
          updateData.data.departmentId = formData.departmentId;
        } else {
          // Explicitly set to null to unset the department
          updateData.data.departmentId = null;
        }

        console.log('Updating approval flow with data:', JSON.stringify(updateData, null, 2));
        const result = await updateApprovalFlow(updateData).unwrap();
        console.log('Update result:', result);
        toast.success('Approval flow updated successfully');
      } else {
        // For create, include createdBy from session
        const createData: CreateApprovalFlowPayload = {
          ...formData,
          createdBy: session?.user?._id?.toString() || '',
          // Ensure departmentId is properly handled - use null if empty string
          departmentId: formData.departmentId || null,
        };
        console.log('Creating new approval flow with data:', createData);
        await createApprovalFlow(createData).unwrap();
        toast.success('Approval flow created successfully');
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Error saving approval flow:', error);
      toast.error('Failed to save approval flow');
    }
  }, [editingFlow, createApprovalFlow, updateApprovalFlow, handleCloseModal, refetch, session?.user?._id]);

  const handleDelete = async (id: string) => {
    // Consider using a more robust confirmation dialog if available
    if (window.confirm('Are you sure you want to delete this approval flow?')) {
      try {
        await deleteApprovalFlowMutation({ _id: id }).unwrap();
        refetch();
      } catch (rawError) {
        console.error('Failed to delete approval flow:', rawError);
        let message = 'An unexpected error occurred while deleting the approval flow.';
        if (typeof rawError === 'object' && rawError !== null) {
          const error = rawError as { data?: { message?: string }; message?: string };
          message = error.data?.message || error.message || 'Failed to delete approval flow.';
        }
        // TODO: Implement user-friendly error display
        alert(`Error: ${message}`);
      }
    }
  };
  
  const pageTitle = "Approval Flows";
  // Breadcrumbs can be re-added later if a dedicated breadcrumb component is available or needed.
  // const breadcrumbItems = [
  //   { label: "Dashboard", href: "/dashboard" },
  //   { label: pageTitle, href: "/dashboard/approval-flow" },
  // ];
  const primaryButtonAction = () => handleOpenModal();

  // Error handling for the main data fetch
  if (error) {
    // You might want a more sophisticated error component here
    return <p className="text-red-500 p-4">Error loading approval flows. Please check console or try again later.</p>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">{pageTitle}</h1>
        <Button onClick={primaryButtonAction} disabled={isLoadingFlows || isCreating || isUpdating || isDeleting}>
          <Plus className="mr-2 h-4 w-4" /> Add New Flow
        </Button>
      </div>

      {/* Optional: Add Breadcrumbs here if needed */}

      {isLoadingFlows && (
        <div className="flex justify-center items-center h-64">
          <p>Loading approval flows...</p> {/* Replace with a spinner component if available */}
        </div>
      )}

      {!isLoadingFlows && approvalFlows.length > 0 && (
        <ApprovalFlowList 
          approvalFlows={approvalFlows}
          onEdit={(flow) => handleOpenModal(flow)}
          onDelete={handleDelete} 
          isLoading={isDeleting} // Pass isDeleting for individual row actions
        />
      )}

      <Dialog 
        open={isModalOpen} 
        onOpenChange={handleOpenChange}
      >
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editingFlow ? 'Edit Approval Flow' : 'Create New Approval Flow'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {editingFlow && (
              <ApprovalFlowForm
                key={`approval-flow-form-${formKey}`}
                onSubmit={handleSubmitForm}
                initialData={editingFlow as ApprovalFlowWithId}
                onCancel={handleCloseModal}
                isLoading={isCreating || isUpdating}
                departments={departments?.map(dept => ({
                  ...dept,
                  _id: dept._id?.toString() || ''
                })) || []}
                isLoadingDepartments={isLoadingDepartments}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalFlowPage;
