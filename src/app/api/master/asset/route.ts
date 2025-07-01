// src/app/api/master/asset/route.ts
import { NextRequest, NextResponse } from "next/server";
import Asset from "@/models/master/Asset.model";
import "@/lib/mongoose";
import mongoose from "mongoose";

// GET all assets
export async function GET(req: NextRequest) {
  try {
    const assets = await Asset.find({});
    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching assets", error }, { status: 500 });
  }
}

// POST create a new asset
export async function POST(req: NextRequest) {
  try {
    const { db, data, action, filter } = await req.json();

    if (db !== 'ASSET_MASTER') {
      return NextResponse.json({ message: "Invalid database specified" }, { status: 400 });
    }

    let savedAsset;

    if (action === 'create') {
      const newAsset = new Asset(data);
      savedAsset = await newAsset.save();
    } else if (action === 'update') {
        if (!filter || !filter._id) {
            return NextResponse.json({ message: "Missing filter for update" }, { status: 400 });
        }
      savedAsset = await Asset.findOneAndUpdate({_id: filter._id}, data, { new: true });
    }
    else {
        return NextResponse.json({ message: "Invalid action specified" }, { status: 400 });
    }

    return NextResponse.json(savedAsset, { status: 201 });
  } catch (error) {
    console.error("Error in asset route:", error);
    return NextResponse.json({ message: "Error creating/updating asset", error }, { status: 500 });
  }
}