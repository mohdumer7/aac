"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IApprovalFlow } from '@/models/approvals/ApprovalFlow.model';
import { getDocumentId } from '@/utils/mongooseUtils';
import { Edit, Trash2 } from 'lucide-react';

// Type for the department data that might be populated
interface PopulatedDepartment {
  _id: string;
  name: string;
}

// Type for approval flow with a required _id
interface ApprovalFlowWithId extends IApprovalFlow {
  _id: string;
}

interface ApprovalFlowListProps {
  approvalFlows: ApprovalFlowWithId[];
  onEdit: (flow: ApprovalFlowWithId) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const ApprovalFlowList: React.FC<ApprovalFlowListProps> = ({ approvalFlows, onEdit, onDelete, isLoading }) => {
  if (isLoading) {
    return <p>Loading flows...</p>; // Or a spinner component
  }

  if (!approvalFlows || approvalFlows.length === 0) {
    return <p className="text-center text-gray-500 py-8">No approval flows found. Click "Add New Flow" to create one.</p>;
  }

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Flow Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Department</TableHead> {/* Assuming department is part of the display */}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvalFlows.map((flow) => (
            <TableRow key={getDocumentId(flow)}>
              <TableCell className="font-medium">{flow.flowName || '-'}</TableCell>
              <TableCell>{flow.description || '-'}</TableCell>
              <TableCell>
                {flow.departmentId && typeof flow.departmentId === 'object' 
                  ? (flow.departmentId as any)?.name || 'N/A' 
                  : flow.departmentId ? String(flow.departmentId) : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(flow)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    const flowId = getDocumentId(flow);
                    if (flowId) {
                      onDelete(flowId);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ApprovalFlowList;
