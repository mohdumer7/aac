import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSWorkflowManager from '@/server/managers/hrmsWorkflowManager';

// GET /api/hrms/workflows/[id] - Get specific workflow instance
export async function GET(
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
    const result = await HRMSWorkflowManager.getWorkflowInstanceById(id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching workflow instance:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/hrms/workflows/[id] - Update workflow instance
export async function PUT(
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

    const result = await HRMSWorkflowManager.updateWorkflowInstance(
      id,
      body,
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating workflow instance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}