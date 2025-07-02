import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSWorkflowManager from '@/server/managers/hrmsWorkflowManager';

// POST /api/hrms/workflows/[id]/advance - Advance workflow to next step
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

    const { id } = params;
    const body = await request.json();
    const { stepId, formData, comments, skipValidation } = body;

    const result = await HRMSWorkflowManager.advanceWorkflowStep({
      workflowInstanceId: id,
      stepId,
      formData,
      comments,
      skipValidation,
      userId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error advancing workflow step:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}