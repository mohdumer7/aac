import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSApprovalInstance from '@/models/hrms/HRMSApprovalInstance.model';

// GET /api/hrms/approval-instances/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const instance = await HRMSApprovalInstance.findById(params.id);
    
    if (!instance) {
      return NextResponse.json(
        { success: false, message: 'Approval instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: instance
    });
  } catch (error: any) {
    console.error('Error fetching approval instance:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}