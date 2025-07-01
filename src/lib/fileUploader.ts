/**
 * Direct file uploader that bypasses RTK Query to ensure proper file handling
 */
export async function uploadFile(file: File, ticketId: string, userId: string): Promise<any> {
  try {
    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticketId', ticketId);
    formData.append('userId', userId);
    
    // Log for debugging
    console.log('Uploading file:', file.name, 'type:', file.type, 'size:', file.size);
    
    // Make a direct fetch request
    const response = await fetch('/api/file-upload', {
      method: 'POST',
      body: formData,
      // Let the browser set the Content-Type header with boundary
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}