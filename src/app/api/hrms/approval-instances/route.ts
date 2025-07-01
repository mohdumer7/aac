import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSApprovalInstance from '@/models/hrms/HRMSApprovalInstance.model';

// GET /api/hrms/approval-instances
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query filters
    const query: any = {};
    
    if (searchParams.get('formType')) {
      query.formType = searchParams.get('formType');
    }
    
    if (searchParams.get('currentStatus')) {
      query.currentStatus = searchParams.get('currentStatus');
    }
    
    if (searchParams.get('submittedBy')) {
      query.submittedBy = searchParams.get('submittedBy');
    }
    
    // For approver view - show instances where user is an approver
    if (searchParams.get('viewType') === 'approver') {
      query['stepProgress.assignedApprovers.userId'] = session.user.id;
      query.currentStatus = { $in: ['pending', 'in_progress'] };
    }
    
    // For submitter view - show instances submitted by user
    if (searchParams.get('viewType') === 'submitter') {
      query.submittedBy = session.user.id;
    }

    const [instances, total] = await Promise.all([
      HRMSApprovalInstance.find(query)
        .sort({ submittedDate: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      HRMSApprovalInstance.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        instances,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching approval instances:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}