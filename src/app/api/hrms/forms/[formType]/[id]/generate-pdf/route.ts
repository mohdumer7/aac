import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSManager from '@/server/managers/hrmsManager';

// POST /api/hrms/forms/[formType]/[id]/generate-pdf
export async function POST(
  request: NextRequest,
  { params }: { params: { formType: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In Next.js App Router, params are already resolved
    const formType = params.formType;
    const id = params.id;
    const body = await request.json();
    const { includeApprovalHistory = true, organizationLogo, organizationName } = body;

    // Get form data
    const formResult = await HRMSManager.getFormById(formType, id);
    if (!formResult.success) {
      return NextResponse.json(
        { success: false, message: 'Form not found' },
        { status: 404 }
      );
    }

    const formData = formResult.data;

    // Prepare PDF data with safety checks for objects that might be IDs now
    // This ensures PDF generation works even if the form data contains IDs instead of full objects
    const formDataForPDF = { ...formData.formData };
    
    // Handle mrNumber specifically for manpower_requisition forms
    if (formType === 'manpower_requisition' && !formDataForPDF.mrNumber) {
      formDataForPDF.mrNumber = id;  // Use the form ID as mrNumber if not available
    }
    
    // Add safety checks for department
    if (formDataForPDF.department && typeof formDataForPDF.department === 'string') {
      // If department is just an ID, create an object with the ID as name
      formDataForPDF.department = { _id: formDataForPDF.department, name: formDataForPDF.department };
    }
    
    // Add safety checks for reportingTo
    if (formDataForPDF.reportingTo && typeof formDataForPDF.reportingTo === 'string') {
      formDataForPDF.reportingTo = { _id: formDataForPDF.reportingTo, name: formDataForPDF.reportingTo };
    }
    
    // Add safety checks for location
    if (formDataForPDF.location && typeof formDataForPDF.location === 'string') {
      formDataForPDF.location = { _id: formDataForPDF.location, name: formDataForPDF.location };
    }
    
    const pdfData = {
      formType,
      formData: formDataForPDF,
      submittedBy: formData.submittedBy,
      submissionDate: formData.submittedAt,
      approvalHistory: includeApprovalHistory ? formData.approvalHistory : undefined,
      organizationLogo,
      organizationName: organizationName || 'Acero Building Systems'
    };

    // Since we can't generate PDF on server side with html2canvas (browser-only),
    // we'll return the data for client-side PDF generation
    return NextResponse.json({
      success: true,
      data: {
        pdfData,
        formId: id,
        formType,
        filename: `${formType}_${id}_${Date.now()}.pdf`
      },
      message: 'PDF data prepared for generation'
    });

  } catch (error: any) {
    console.error('Error preparing PDF data:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}