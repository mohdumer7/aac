// src/utils/fileUpload.ts
export async function uploadFile(formData: FormData) {
    try {
      console.log('Uploading file using direct fetch...');
      
      // Use native fetch API to ensure proper FormData handling
      const response = await fetch('/api/file-upload', {
        method: 'POST',
        // IMPORTANT: Don't set Content-Type manually!
        // Let the browser set it automatically with boundary parameters
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }