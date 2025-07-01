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

    const { formType, id } = params;
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

    // Prepare PDF data
    const pdfData = {
      formType,
      formData: formData.formData,
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