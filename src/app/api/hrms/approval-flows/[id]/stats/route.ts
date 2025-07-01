import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSApprovalFlowManager from '@/server/managers/hrmsApprovalFlowManager';

// GET /api/hrms/approval-flows/[id]/stats
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

    const [usageStats, stepStats] = await Promise.all([
      HRMSApprovalFlowManager.getFlowUsageStats(params.id),
      HRMSApprovalFlowManager.getStepPerformanceStats(params.id)
    ]);

    if (usageStats.success && stepStats.success) {
      return NextResponse.json({
        success: true,
        data: {
          usage: usageStats.data,
          stepPerformance: stepStats.data
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error fetching flow statistics' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching approval flow stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}