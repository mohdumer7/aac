import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ManpowerRequisition from "@/models/hiring/ManpowerRequisition.model";
import JobPosting from "@/models/hiring/JobPosting.model";
import { connectToDB } from "@/lib/mongoose";

// Get a specific requisition by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    const requisitionId = params.id;

    // Connect to database
    await connectToDB();

    // Fetch requisition with populated references
    const requisition = await ManpowerRequisition.findById(requisitionId)
      .populate("requestedBy", "firstName lastName displayName email")
      .populate("department", "name")
      .populate("departmentHeadApproval.approvedBy", "firstName lastName displayName")
      .populate("hrAdminReview.approvedBy", "firstName lastName displayName")
      .populate("financeApproval.approvedBy", "firstName lastName displayName")
      .populate("hrHeadApproval.approvedBy", "firstName lastName displayName")
      .populate("cfoApproval.approvedBy", "firstName lastName displayName")
      .populate("ceoApproval.approvedBy", "firstName lastName displayName");

    if (!requisition) {
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: requisition });
  } catch (error: any) {
    console.error("Error fetching requisition:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch requisition" },
      { status: 500 }
    );
  }
}

// Update a requisition
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    const requisitionId = params.id;
    const data = await request.json();

    // Connect to database
    await connectToDB();

    // Find requisition
    const requisition = await ManpowerRequisition.findById(requisitionId);
    if (!requisition) {
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      );
    }

    // Update requisition with new data
    const updatedRequisition = await ManpowerRequisition.findByIdAndUpdate(
      requisitionId,
      {
        ...data,
        updatedBy: session.user.id,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: "Requisition updated successfully",
      data: updatedRequisition,
    });
  } catch (error: any) {
    console.error("Error updating requisition:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update requisition" },
      { status: 500 }
    );
  }
}

// Submit requisition for approval or process approvals
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    const requisitionId = params.id;
    const { action, remarks, approvalData } = await request.json();

    // Connect to database
    await connectToDB();

    // Find requisition
    const requisition = await ManpowerRequisition.findById(requisitionId);
    if (!requisition) {
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      );
    }

    const updateData: any = { updatedBy: session.user.id };
    let message = "";

    // Process different actions
    switch (action) {
      case "submit":
        // Submit draft for department head approval
        if (requisition.status !== "Draft") {
          return NextResponse.json(
            { error: "Requisition is not in draft status" },
            { status: 400 }
          );
        }
        
        updateData.status = "Pending Department Head";
        message = "Requisition submitted for approval";
        break;

      case "approve_department_head":
        // Department head approval
        if (requisition.status !== "Pending Department Head") {
          return NextResponse.json(
            { error: "Requisition is not pending department head approval" },
            { status: 400 }
          );
        }
        
        updateData.departmentHeadApproval = {
          approved: true,
          approvedBy: session.user.id,
          approvalDate: new Date()
        };
        updateData.status = "Pending HR Review";
        updateData.remarks = remarks || requisition.remarks;
        message = "Requisition approved by department head";
        break;

      case "approve_hr_admin":
        // HR Admin review
        if (requisition.status !== "Pending HR Review") {
          return NextResponse.json(
            { error: "Requisition is not pending HR review" },
            { status: 400 }
          );
        }
        
        if (!approvalData || !approvalData.position || approvalData.actualHeadCount === undefined) {
          return NextResponse.json(
            { error: "Missing HR review data" },
            { status: 400 }
          );
        }
        
        updateData.hrAdminReview = {
          position: approvalData.position,
          budgeted: approvalData.budgeted || false,
          actualHeadCount: approvalData.actualHeadCount,
          variance: approvalData.variance || 0,
          approved: true,
          approvedBy: session.user.id,
          approvalDate: new Date()
        };
        updateData.status = "Pending Finance";
        message = "Requisition reviewed by HR Admin";
        break;

      case "approve_finance":
        // Finance approval
        if (requisition.status !== "Pending Finance") {
          return NextResponse.json(
            { error: "Requisition is not pending finance approval" },
            { status: 400 }
          );
        }
        
        updateData.financeApproval = {
          approved: true,
          approvedBy: session.user.id,
          approvalDate: new Date()
        };
        updateData.status = "Pending HR Head";
        message = "Requisition approved by finance";
        break;

      case "approve_hr_head":
        // HR Head approval
        if (requisition.status !== "Pending HR Head") {
          return NextResponse.json(
            { error: "Requisition is not pending HR head approval" },
            { status: 400 }
          );
        }
        
        updateData.hrHeadApproval = {
          approved: true,
          approvedBy: session.user.id,
          approvalDate: new Date()
        };
        updateData.status = "Pending CFO";
        message = "Requisition approved by HR head";
        break;

      case "approve_cfo":
        // CFO approval
        if (requisition.status !== "Pending CFO") {
          return NextResponse.json(
            { error: "Requisition is not pending CFO approval" },
            { status: 400 }
          );
        }
        
        updateData.cfoApproval = {
          approved: true,
          approvedBy: session.user.id,
          approvalDate: new Date()
        };
        updateData.status = "Pending CEO";
        message = "Requisition approved by CFO";
        break;

      case "approve_ceo":
        // CEO approval - final approval
        if (requisition.status !== "Pending CEO") {
          return NextResponse.json(
            { error: "Requisition is not pending CEO approval" },
            { status: 400 }
          );
        }
        
        updateData.ceoApproval = {
          approved: true,
          approvedBy: session.user.id,
          approvalDate: new Date()
        };
        updateData.status = "Approved";
        message = "Requisition fully approved";
        break;

      case "reject":
        // Reject at any stage
        updateData.status = "Rejected";
        updateData.remarks = remarks || "Requisition rejected";
        message = "Requisition rejected";
        break;

      case "create_job_posting":
        // Create job posting from approved requisition
        if (requisition.status !== "Approved") {
          return NextResponse.json(
            { error: "Cannot create job posting: Requisition is not approved" },
            { status: 400 }
          );
        }
        
        if (requisition.jobPosting) {
          return NextResponse.json(
            { error: "Job posting already exists for this requisition" },
            { status: 400 }
          );
        }
        
        // Create job posting
        const jobPosting = new JobPosting({
          requisition: requisitionId,
          title: requisition.requestedPosition,
          department: requisition.department,
          // Other fields will be filled in by HR
          description: `Position for ${requisition.requestedPosition} in ${requisition.department}`,
          responsibilities: [],
          requirements: [],
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          addedBy: session.user.id,
          updatedBy: session.user.id
        });
        
        await jobPosting.save();
        
        // Update requisition with job posting reference
        updateData.jobPosting = jobPosting._id;
        message = "Job posting created successfully";
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update requisition
    const updatedRequisition = await ManpowerRequisition.findByIdAndUpdate(
      requisitionId,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message,
      data: updatedRequisition,
    });
  } catch (error: any) {
    console.error("Error processing requisition:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process requisition" },
      { status: 500 }
    );
  }
}

// Delete a requisition (only drafts can be deleted)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    const requisitionId = params.id;

    // Connect to database
    await connectToDB();

    // Find requisition
    const requisition = await ManpowerRequisition.findById(requisitionId);
    if (!requisition) {
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      );
    }

    // Only drafts can be deleted
    if (requisition.status !== "Draft") {
      return NextResponse.json(
        { error: "Only draft requisitions can be deleted" },
        { status: 400 }
      );
    }

    // Delete requisition
    await ManpowerRequisition.findByIdAndDelete(requisitionId);

    return NextResponse.json({
      message: "Requisition deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting requisition:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete requisition" },
      { status: 500 }
    );
  }
} 