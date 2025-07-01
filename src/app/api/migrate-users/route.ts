import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import migrateUserData from "@/scripts/migrateUserData";


export async function POST(req: NextRequest) {
  try {
    // Check authentication
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //   return NextResponse.json(
    //     { error: "Unauthorized: You must be logged in to perform this action" },
    //     { status: 401 }
    //   );
    // }

    // // Check if user has admin rights (you can adjust this based on your role system)
    // if (session.user.role !== "Admin") {
    //   return NextResponse.json(
    //     { error: "Forbidden: Only administrators can perform this action" },
    //     { status: 403 }
    //   );
    // }

    // Get migration options from request body
    const  dryRun = false 

    // Run the migration
    const result = await migrateUserData(dryRun);

    return NextResponse.json(
      {
        status: "success",
        message: "User data migration completed successfully",
        result
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error during user migration:", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to migrate user data",
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Return a simple status page that explains this is an API endpoint
  return NextResponse.json(
    {
      status: "info",
      message: "This is the user migration API endpoint. Use POST to trigger migration."
    },
    { status: 200 }
  );
} 