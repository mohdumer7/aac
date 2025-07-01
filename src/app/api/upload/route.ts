import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    // Get URL parameters for ticketId and userId
    const url = new URL(request.url);
    const ticketId = url.searchParams.get('ticketId');
    const userId = url.searchParams.get('userId');
    
    if (!ticketId || !userId) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing ticketId or userId. Add them as URL parameters.' 
        },
        { status: 400 }
      );
    }

    // Get the raw request body as a buffer
    const buffer = await request.arrayBuffer();
    const fileData = Buffer.from(buffer);
    
    // Extract filename from headers if available, or generate a unique one
    const contentDisposition = request.headers.get('content-disposition');
    let fileName = 'file-' + uuidv4();
    let fileType = request.headers.get('content-type') || 'application/octet-stream';
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/\s+/g, '-');
      }
    }
    
    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.log('Upload directory already exists');
    }
    
    // Extract file extension if present
    const fileExt = fileName.includes('.') ? fileName.split('.').pop() || '' : '';
    
    // Create a unique filename that preserves the original extension
    const uniqueFileName = `${Date.now()}-${uuidv4()}${fileExt ? '.' + fileExt : ''}`;
    const filePath = join(uploadDir, uniqueFileName);
    
    // Save the file
    await writeFile(filePath, fileData);
    
    // Determine content type based on file extension
    if (fileExt) {
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
      };
      
      if (fileExt.toLowerCase() in mimeTypes) {
        fileType = mimeTypes[fileExt.toLowerCase()];
      }
    }
    
    // Create file info object
    const fileInfo = {
      fileName,
      originalName: fileName,
      storedFileName: uniqueFileName,
      fileType,
      fileSize: fileData.length,
      url: `/uploads/${uniqueFileName}`,
      uploadedAt: new Date()
    };
    
    // Return success response
    return NextResponse.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        ...fileInfo,
        ticketId,
        userId
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'File upload failed', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}