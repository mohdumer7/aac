import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

// This is the proper App Router way to handle file uploads
export async function POST(request: NextRequest) {
  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Clone the request to access it multiple times
    const clonedRequest = request.clone();
    
    // Check if it's a multipart form
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({
        status: 'error',
        message: 'Content-Type must be multipart/form-data',
      }, { status: 400 });
    }

    // Access form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ticketId = formData.get('ticketId') as string;
    const userId = formData.get('userId') as string;

    if (!file || !ticketId || !userId) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required fields',
      }, { status: 400 });
    }

    console.log('Received file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Get file extension from original filename
    const originalExt = path.extname(file.name);
    const newFilename = `${uuidv4()}${originalExt}`;
    const filePath = path.join(uploadDir, newFilename);

    // Convert file to buffer and save it
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Determine correct mimetype
    const fileType = file.type || mime.lookup(file.name) || 'application/octet-stream';

    const fileData = {
      fileName: file.name,
      originalName: file.name,
      storedFileName: newFilename,
      fileType: fileType,
      fileSize: file.size,
      url: `/uploads/${newFilename}`,
      uploadedAt: new Date(),
      ticketId,
      userId
    };

    console.log('Upload successful:', fileData);

    // Return success response
    return NextResponse.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: fileData
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'File upload failed',
      error: String(error)
    }, { status: 500 });
  }
}