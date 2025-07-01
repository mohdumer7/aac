import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ManpowerRequisition from "@/models/hiring/ManpowerRequisition.model";
import { connectToDB } from "@/lib/mongoose";

// Get all requisitions (with filtering and pagination)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const department = url.searchParams.get("department");
    const requestedBy = url.searchParams.get("requestedBy");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Connect to database
    await connectToDB();

    // Build query based on filters
    const query: any = {};
    if (status) query.status = status;
    if (department) query.department = department;
    if (requestedBy) query.requestedBy = requestedBy;

    // Get total count for pagination
    const total = await ManpowerRequisition.countDocuments(query);

    // Fetch requisitions with populated references
    const requisitions = await ManpowerRequisition.find(query)
      .populate("requestedBy", "firstName lastName displayName email")
      .populate("department", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Return response with pagination metadata
    return NextResponse.json({
      data: requisitions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching requisitions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch requisitions" },
      { status: 500 }
    );
  }
}

// Create a new requisition
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json();

    // Connect to database
    await connectToDB();

    // Create new requisition
    const requisition = new ManpowerRequisition({
      ...data,
      status: "Draft", // Always start as a draft
      addedBy: session.user.id,
      updatedBy: session.user.id,
    });

    await requisition.save();

    return NextResponse.json(
      { message: "Requisition created successfully", data: requisition },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating requisition:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create requisition" },
      { status: 500 }
    );
  }
} 