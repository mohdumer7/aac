"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import useUserAuthorised from "@/hooks/useUserAuthorised";
import { useGetMasterQuery } from "@/services/endpoints/masterApi";
import { toast } from "react-toastify";
import { FileText, Plus, Search, Download, CheckCircle, XCircle, FileEdit, Eye, RefreshCw } from "lucide-react";
import { DataTable } from '@/components/TableComponent/TableComponent';
import DashboardLoader from '@/components/ui/DashboardLoader';

export default function RequisitionsPage() {
  const router = useRouter();
  const { user, status, authenticated } = useUserAuthorised();
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [filters, setFilters] = useState<any>({
    status: "",
    department: "",
  });

  // Fetch master data
  const { data: departmentData = [], isLoading: departmentLoading }: any = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    filter: { isActive: true },
    sort: { name: 'asc' },
  });

  // Fetch requisitions data
  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.department) queryParams.append("department", filters.department);

      // Call API
      const response = await fetch(`/api/hiring/requisitions?${queryParams.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setRequisitions(result.data);
        setTotal(result.pagination.total);
      } else {
        throw new Error(result.error || "Failed to fetch requisitions");
      }
    } catch (error: any) {
      console.error("Error fetching requisitions:", error);
      toast.error(error.message || "An error occurred while fetching requisitions");
    } finally {
      setLoading(false);
    }
  };

  // Handle filters
  const handleFilterChange = (value: string, filterName: string) => {
    setFilters((prev: any) => ({ ...prev, [filterName]: value }));
    setPage(1); // Reset to first page when filters change
  };

  // Generate PDF
  const handleGeneratePDF = async (requisitionId: string) => {
    try {
      // Open PDF in new tab
      window.open(`/api/hiring/requisitions/${requisitionId}/pdf`, '_blank');
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(error.message || "Failed to generate PDF");
    }
  };

  // Process approval action
  const handleApproval = async (requisitionId: string, action: string, remarks?: string) => {
    try {
      const response = await fetch(`/api/hiring/requisitions/${requisitionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, remarks }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Action completed successfully");
        // Refresh the list
        fetchRequisitions();
      } else {
        throw new Error(result.error || "Failed to process action");
      }
    } catch (error: any) {
      console.error("Error processing approval:", error);
      toast.error(error.message || "An error occurred");
    }
  };

  // View requisition details
  const handleViewDetails = (requisitionId: string) => {
    router.push(`/dashboard/hiring/requisitions/${requisitionId}`);
  };

  // Edit requisition
  const handleEdit = (requisitionId: string) => {
    router.push(`/dashboard/hiring/requisitions/${requisitionId}/edit`);
  };

  // Run on initial load and when filters/pagination change
  useEffect(() => {
    if (authenticated) {
      fetchRequisitions();
    }
  }, [authenticated, page, limit, filters]);

  if (!authenticated) {
    return <div>Please login to continue</div>;
  }

  // Status badge colors
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      "Draft": "bg-gray-200 text-gray-800",
      "Pending Department Head": "bg-blue-100 text-blue-800",
      "Pending HR Review": "bg-purple-100 text-purple-800",
      "Pending Finance": "bg-yellow-100 text-yellow-800",
      "Pending HR Head": "bg-indigo-100 text-indigo-800",
      "Pending CFO": "bg-orange-100 text-orange-800",
      "Pending CEO": "bg-pink-100 text-pink-800",
      "Approved": "bg-green-100 text-green-800",
      "Rejected": "bg-red-100 text-red-800",
    };

    return statusColors[status] || "bg-gray-200 text-gray-800";
  };

  // Action buttons based on status and user role
  const getActionButtons = (requisition: any) => {
    const actions = [];

    // View button always available
    actions.push(
      <Button 
        key="view" 
        variant="ghost" 
        size="sm" 
        onClick={() => handleViewDetails(requisition._id)}
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </Button>
    );

    // PDF button always available
    actions.push(
      <Button 
        key="pdf" 
        variant="ghost" 
        size="sm" 
        onClick={() => handleGeneratePDF(requisition._id)}
        title="Download PDF"
      >
        <Download className="h-4 w-4" />
      </Button>
    );

    // Edit button only for drafts
    if (requisition.status === "Draft") {
      actions.push(
        <Button 
          key="edit" 
          variant="ghost" 
          size="sm" 
          onClick={() => handleEdit(requisition._id)}
          title="Edit"
        >
          <FileEdit className="h-4 w-4" />
        </Button>
      );
    }

    // Approval actions based on status and user role
    // This is a simplified example - in a real app, you'd check user roles
    if (requisition.status === "Pending Department Head" && user.role === "Department Head") {
      actions.push(
        <Button 
          key="approve" 
          variant="ghost" 
          size="sm" 
          onClick={() => handleApproval(requisition._id, "approve_department_head")}
          title="Approve"
          className="text-green-600"
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      );
    }

    // Add more conditional actions based on status and user role

    return actions;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manpower Requisitions</h1>
        <Button 
          onClick={() => router.push("/dashboard/hiring/requisitions/new")}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Requisition
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter requisitions by criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <Select 
                onValueChange={(value) => handleFilterChange(value, "status")}
                value={filters.status}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending Department Head">Pending Department Head</SelectItem>
                  <SelectItem value="Pending HR Review">Pending HR Review</SelectItem>
                  <SelectItem value="Pending Finance">Pending Finance</SelectItem>
                  <SelectItem value="Pending HR Head">Pending HR Head</SelectItem>
                  <SelectItem value="Pending CFO">Pending CFO</SelectItem>
                  <SelectItem value="Pending CEO">Pending CEO</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto">
              <Select 
                onValueChange={(value) => handleFilterChange(value, "department")}
                value={filters.department}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departmentData?.data?.map((dept: any) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({ status: "", department: "" });
                setPage(1);
              }}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <DashboardLoader />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requisition ID</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requisitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No requisitions found. Create a new one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requisitions.map((req) => (
                      <TableRow key={req._id}>
                        <TableCell className="font-medium">
                          {req._id.substring(req._id.length - 6).toUpperCase()}
                        </TableCell>
                        <TableCell>{req.requestedPosition}</TableCell>
                        <TableCell>
                          {req.department?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {req.requestedBy?.displayName || 
                            (req.requestedBy?.firstName && req.requestedBy?.lastName 
                              ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}`
                              : "N/A")
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(req.requestDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(req.status)}>
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            {getActionButtons(req)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {requisitions.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                    />
                  </PaginationItem>
                  
                  {/* First page */}
                  {page > 2 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(1)}>
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis */}
                  {page > 3 && (
                    <PaginationItem>
                      <PaginationLink disabled>...</PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Previous page */}
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(page - 1)}>
                        {page - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Current page */}
                  <PaginationItem>
                    <PaginationLink isActive>{page}</PaginationLink>
                  </PaginationItem>
                  
                  {/* Next page */}
                  {page < Math.ceil(total / limit) && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(page + 1)}>
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis */}
                  {page < Math.ceil(total / limit) - 2 && (
                    <PaginationItem>
                      <PaginationLink disabled>...</PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Last page */}
                  {page < Math.ceil(total / limit) - 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(Math.ceil(total / limit))}>
                        {Math.ceil(total / limit)}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(prev => (prev < Math.ceil(total / limit) ? prev + 1 : prev))}
                      disabled={page >= Math.ceil(total / limit)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
} 