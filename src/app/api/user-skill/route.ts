// src/app/api/user-skill/route.ts
import { userSkillManager } from '@/server/managers/userSkillManager';
import { BODY_REQUIRED, ERROR, INSUFFIENT_DATA, INVALID_REQUEST, SUCCESS } from '@/shared/constants';
import { createMongooseObjectId } from '@/shared/functions';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/mongoose';
import * as models from '@/models';
import mongoose from 'mongoose';

// Initialize models
Object.values(models).forEach(model => {
  const modelName = (model as any).modelName;
  if (modelName && !mongoose.models[modelName]) {
    ;(model as any).init();
  }
});

export async function GET(request: NextRequest) {
  // Ensure database connection and models are initialized
  await dbConnect();

  const searchParams = new URL(request.url).searchParams;
  const operations: any = {};

  // Extract and parse the filter parameter
  const filterParam = searchParams.get('filter');
  if (filterParam) {
    try {
      operations.filter = JSON.parse(filterParam);
    } catch (error) {
      return NextResponse.json(
        { status: 'ERROR', message: 'INVALID_FILTER_FORMAT', data: {} },
        { status: 400 }
      );
    }
  } else {
    operations.filter = {};
  }

  // Get skills by user ID
  const userId = searchParams.get('userId');
  if (userId) {
    const response = await userSkillManager.getUserSkillsByUser(userId);
    if (response.status === SUCCESS) {
      return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
    }
    return NextResponse.json(
      { status: 'ERROR', message: response.message, data: {} },
      { status: 500 }
    );
  }

  // Get skills by category ID
  const categoryId = searchParams.get('categoryId');
  if (categoryId) {
    const response = await userSkillManager.getUserSkillsByCategory(categoryId);
    if (response.status === SUCCESS) {
      return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
    }
    return NextResponse.json(
      { status: 'ERROR', message: response.message, data: {} },
      { status: 500 }
    );
  }

  // Get all skills with filters
  const response = await userSkillManager.getUserSkills(operations);
  
  if (response.status === SUCCESS) {
    return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
  }
  return NextResponse.json(
    { status: 'ERROR', message: response.message, data: {} },
    { status: 500 }
  );
}

export async function POST(request: NextRequest) {
  // Ensure database connection and models are initialized
  await dbConnect();

  const body = await request.json();

  if (!body) return NextResponse.json({ status: ERROR, message: INVALID_REQUEST, data: {} }, { status: 400 });

  const { action, data } = body;

  if (!action) return NextResponse.json({ status: ERROR, message: INSUFFIENT_DATA, data: {} }, { status: 400 });

  // Convert string IDs to ObjectIds
  if (data.user) data.user = createMongooseObjectId(data.user);
  if (data.category) data.category = createMongooseObjectId(data.category);
  if (data.addedBy) data.addedBy = createMongooseObjectId(data.addedBy);
  if (data.updatedBy) data.updatedBy = createMongooseObjectId(data.updatedBy);

  let response: any = {};
  
  switch (action) {
    case "create":
      response = await userSkillManager.createUserSkill({ data });
      break;
    case "update":
      response = await userSkillManager.updateUserSkill({
        filter: { _id: data._id },
        data
      });
      break;
    default:
      response = { status: ERROR, message: INVALID_REQUEST };
  }

  if (response.status === SUCCESS) {
    return NextResponse.json({ status: SUCCESS, message: SUCCESS, data: response.data }, { status: 200 });
  }
  return NextResponse.json(
    { status: 'ERROR', message: response.message, data: {} },
    { status: 500 });
}