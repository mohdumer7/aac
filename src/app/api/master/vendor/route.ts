// src/app/api/master/vendor/route.ts
import { NextRequest, NextResponse } from "next/server";
import Vendor from "@/models/master/Vendor.model";
import "@/lib/mongoose";

// GET all vendors
export async function GET(req: NextRequest) {
  try {
    const vendors = await Vendor.find({});
    return NextResponse.json(vendors);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching vendors", error }, { status: 500 });
  }
}

// POST create or update a vendor
export async function POST(req: NextRequest) {
  try {
    const { db, data, action, filter } = await req.json();

    if (db !== 'VENDOR_MASTER') {
      return NextResponse.json({ message: "Invalid database specified" }, { status: 400 });
    }

    let savedVendor;

    if (action === 'create') {
      const newVendor = new Vendor(data);
      savedVendor = await newVendor.save();
    } else if (action === 'update') {
        if (!filter || !filter._id) {
            return NextResponse.json({ message: "Missing filter for update" }, { status: 400 });
        }
      savedVendor = await Vendor.findOneAndUpdate({_id: filter._id}, data, { new: true });
    }
    else {
        return NextResponse.json({ message: "Invalid action specified" }, { status: 400 });
    }

    return NextResponse.json(savedVendor, { status: 201 });
  } catch (error) {
    console.error("Error in vendor route:", error);
    return NextResponse.json({ message: "Error creating/updating vendor", error }, { status: 500 });
  }
}