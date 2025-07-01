import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSManager from '@/server/managers/hrmsManager';

// POST /api/hrms/approval-instances/[id]/reject
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

    const { stepOrder, comments, attachments } = await request.json();
    
    if (!comments) {
      return NextResponse.json(
        { success: false, message: 'Comments are required for rejection' },
        { status: 400 }
      );
    }

    const result = await HRMSManager.processApprovalAction(
      params.id,
      stepOrder,
      'reject',
      session.user.id,
      comments,
      attachments
    );

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error rejecting instance:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}