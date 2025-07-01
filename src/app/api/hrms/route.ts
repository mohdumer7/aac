import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSManager from '@/server/managers/hrmsManager';

// GET /api/hrms - Dashboard statistics and overview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      department: searchParams.get('department'),
      status: searchParams.get('status')
    };

    const [dashboardStats, approvalStats] = await Promise.all([
      HRMSManager.getDashboardStats(filters),
      HRMSManager.getApprovalStats(filters)
    ]);

    if (dashboardStats.success && approvalStats.success) {
      return NextResponse.json({
        success: true,
        data: {
          formStats: dashboardStats.data,
          approvalStats: approvalStats.data,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error fetching dashboard data' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error fetching HRMS dashboard:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}