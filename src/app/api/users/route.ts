import { NextRequest, NextResponse } from "next/server";
import { createUserWithDetails, updateUserWithDetails } from "@/utils/userUtils";

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Create new user with all related details
    const createdUser = await createUserWithDetails(userData);
    
    return NextResponse.json(
      { status: "success", data: createdUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userData = await request.json();
    const { id, ...data } = userData;
    
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Update user and related details
    const updatedUser = await updateUserWithDetails(id, data);
    
    return NextResponse.json(
      { status: "success", data: updatedUser },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
} 