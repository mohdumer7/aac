import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

// Disable Next.js body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Parse the incoming form
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({
        status: 'error',
        message: 'File upload failed',
        error: err.message
      });
    }

    try {
      // Handle files based on formidable version
      const file = files.file?.[0] || files.file; 
      
      // Handle fields based on formidable version
      const ticketId = Array.isArray(fields.ticketId) ? fields.ticketId[0] : fields.ticketId;
      const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;

      if (!file || !ticketId || !userId) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required fields',
        });
      }

      // Generate a unique filename WITH extension
      const originalName = (file as formidable.File).originalFilename || 'file';
      const ext = path.extname(originalName);
      const newFilename = `${uuidv4()}${ext}`;

      // Get the file path based on formidable version
      const oldPath = (file as formidable.File).filepath;
      const newPath = path.join(uploadDir, newFilename);
      
      // Rename the file to include the extension
      fs.renameSync(oldPath, newPath);

      // Determine correct mimetype
      const fileType = (file as formidable.File).mimetype || mime.lookup(originalName) || 'application/octet-stream';

      const fileData = {
        fileName: originalName,
        originalName,
        storedFileName: newFilename,
        fileType,
        fileSize: (file as formidable.File).size,
        url: `/uploads/${newFilename}`,
        uploadedAt: new Date(),
        ticketId,
        userId
      };

      console.log('Upload successful:', fileData);

      // Return success response
      return res.status(200).json({
        status: 'success',
        message: 'File uploaded successfully',
        data: fileData
      });
    } catch (error) {
      console.error('Processing error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error processing upload',
        error: String(error)
      });
    }
  });
}