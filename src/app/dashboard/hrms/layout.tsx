'use client';

import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';
import { WorkflowProvider } from '@/contexts/WorkflowContext';

export default function HRMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Generate breadcrumbs based on the current path
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    // Always start with Dashboard
    breadcrumbs.push({
      href: '/dashboard',
      label: 'Dashboard'
    });
    
    // Add HRMS
    if (paths.length > 1) {
      breadcrumbs.push({
        href: '/dashboard/hrms',
        label: 'HRMS'
      });
    }
    
    // Add subsequent paths
    if (paths.length > 2) {
      const remainingPaths = paths.slice(2);
      let currentPath = '/dashboard/hrms';
      
      remainingPaths.forEach((path, index) => {
        currentPath += `/${path}`;
        
        // Format the label
        let label = path.replace(/-/g, ' ').replace(/_/g, ' ');
        label = label.charAt(0).toUpperCase() + label.slice(1);
        
        // Special formatting for known paths
        if (path === 'approval-flows') label = 'Approval Flows';
        if (path === 'drafts') label = 'Draft Forms';
        if (path === 'manpower_requisition') label = 'Manpower Requisition';
        if (path === 'candidate_information') label = 'Candidate Information';
        if (path === 'business_trip_request') label = 'Business Trip Request';
        if (path === 'new_employee_joining') label = 'New Employee Joining';
        if (path === 'assets_it_access') label = 'Assets & IT Access';
        if (path === 'employee_information') label = 'Employee Information';
        if (path === 'accommodation_transport_consent') label = 'Accommodation & Transport';
        if (path === 'beneficiary_declaration') label = 'Beneficiary Declaration';
        if (path === 'non_disclosure_agreement') label = 'Non-Disclosure Agreement';
        
        breadcrumbs.push({
          href: currentPath,
          label,
          isLast: index === remainingPaths.length - 1
        });
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-6 py-3">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <WorkflowProvider>
          {children}
        </WorkflowProvider>
      </main>
    </div>
  );
}