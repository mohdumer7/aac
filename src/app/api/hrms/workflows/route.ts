import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSWorkflowManager from '@/server/managers/hrmsWorkflowManager';

// GET /api/hrms/workflows - Get all workflow instances
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const workflowType = searchParams.get('workflowType');
    const candidateId = searchParams.get('candidateId');
    const employeeId = searchParams.get('employeeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await HRMSWorkflowManager.getWorkflowInstances({
      status,
      workflowType,
      candidateId,
      employeeId,
      page,
      limit,
      userId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching workflow instances:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/hrms/workflows - Create new workflow instance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { workflowType, triggerFormType, triggerFormId, metadata } = body;

    const result = await HRMSWorkflowManager.createWorkflowInstance({
      workflowType,
      triggerFormType,
      triggerFormId,
      metadata,
      createdBy: session.user.id
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating workflow instance:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}