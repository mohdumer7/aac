// src/app/dashboard/ticket/categories/page.tsx
"use client";

import React from 'react';
import { useGetMasterQuery } from '@/services/endpoints/masterApi';
import { useGetTicketCategoriesQuery } from '@/services/endpoints/ticketCategoryApi';
import useUserAuthorised from '@/hooks/useUserAuthorised';
import DashboardLoader from '@/components/ui/DashboardLoader';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import TicketCategoryComponent from '@/components/TicketComponent/TicketCategoryComponent';

const TicketCategoriesPage = () => {
  const router = useRouter();
  const { user, status } = useUserAuthorised() as { user: { _id?: string; name?: string | null; email?: string | null; image?: string | null; role?: { name?: string | null } }, status: string };
  
  // Get departments
  const { data: departmentData = {data:[]}, isLoading: departmentLoading } = useGetMasterQuery({
    db: 'DEPARTMENT_MASTER',
    filter: { isActive: true },
    sort: { name: 1 }
  });
  
  // Get all categories
  const { data: categoryData = {data:[]}, isLoading: categoryLoading } = useGetTicketCategoriesQuery({});
  
  const loading = departmentLoading || categoryLoading || status === 'loading';
  
  // Check if user is admin
  const isAdmin = user?.role?.name?.toUpperCase() === 'ADMIN';
  
  return (
    <DashboardLoader loading={loading}>
      <div className="space-y-6 p-4">
        <div className="flex items-center mb-6">
          <Button 
          variant="link"
            className="mr-4 flex justify-center items-center"
            onClick={() => router.push('/dashboard/ticket')}
          >
            <ArrowLeft className="mr-2 w-36 h-36" />
            
          </Button>
          <h1 className="text-3xl font-bold">Ticket Categories</h1>
        </div>
        
        <TicketCategoryComponent 
          departments={departmentData?.data || []}
          categories={categoryData?.data || []}
          userId={user?._id||''}
          isAdmin={isAdmin}
        />
      </div>
    </DashboardLoader>
  );
};

export default TicketCategoriesPage;