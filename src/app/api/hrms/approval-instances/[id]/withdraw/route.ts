import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/configs/authOptions';
import HRMSApprovalInstance from '@/models/hrms/HRMSApprovalInstance.model';
import HRMSManager from '@/server/managers/hrmsManager';

// POST /api/hrms/approval-instances/[id]/withdraw
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

    const { withdrawalReason, canResubmit = true } = await request.json();
    
    if (!withdrawalReason) {
      return NextResponse.json(
        { success: false, message: 'Withdrawal reason is required' },
        { status: 400 }
      );
    }

    const instance = await HRMSApprovalInstance.findById(params.id);
    if (!instance) {
      return NextResponse.json(
        { success: false, message: 'Approval instance not found' },
        { status: 404 }
      );
    }

    // Check if user can withdraw (usually only the submitter)
    if (instance.submittedBy.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Only the submitter can withdraw this form' },
        { status: 403 }
      );
    }

    // Check if instance is in a withdrawable state
    if (!['pending', 'in_progress'].includes(instance.currentStatus)) {
      return NextResponse.json(
        { success: false, message: 'Form cannot be withdrawn in current status' },
        { status: 400 }
      );
    }

    // Update instance status
    instance.currentStatus = 'withdrawn';
    instance.withdrawalDetails = {
      withdrawnBy: session.user.id,
      withdrawnDate: new Date(),
      withdrawalReason,
      canResubmit
    };

    await instance.save();

    // Update original form status
    await HRMSManager.updateFormStatus(
      instance.formType,
      instance.formId,
      'withdrawn'
    );

    return NextResponse.json({
      success: true,
      data: instance,
      message: 'Form withdrawn successfully'
    });
  } catch (error: any) {
    console.error('Error withdrawing instance:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}