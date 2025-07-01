import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSApprovalFlowManager from '@/server/managers/hrmsApprovalFlowManager';

// POST /api/hrms/approval-flows/[id]/toggle-status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { isActive } = await request.json();
    
    const result = await HRMSApprovalFlowManager.toggleApprovalFlowStatus(
      params.id,
      isActive,
      session.user.id
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error toggling approval flow status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}