import { storage } from '@/firebase/admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Firebase Storage
 * @param file Base64 encoded file data
 * @param path Storage path
 * @param filename Optional filename (will generate UUID if not provided)
 * @returns URL of the uploaded file
 */
export async function uploadFileToStorage(
  fileData: string,
  path: string,
  filename?: string
): Promise<string> {
  try {
    // Validate input
    if (!fileData) {
      throw new Error('File data is required');
    }
    
    if (!path) {
      throw new Error('Storage path is required');
    }
    
    // Check if the fileData is a valid data URL
    if (!fileData.includes(',')) {
      throw new Error('Invalid file data format');
    }
    
    // Remove the data URL prefix (e.g., "data:image/png;base64,")
    const base64Data = fileData.split(',')[1];
    if (!base64Data) {
      throw new Error('Invalid base64 data');
    }
    
    // Get content type
    let contentType = 'application/octet-stream';
    try {
      contentType = fileData.split(';')[0].split(':')[1];
    } catch (e) {
      console.warn('Could not determine content type, using default');
    }
    
    // Create buffer from base64
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique filename if not provided
    const fileExt = contentType.split('/')[1] || 'png';
    const finalFilename = filename || `${uuidv4()}.${fileExt}`;
    const filePath = `${path}/${finalFilename}`;
    
    // Upload the file to Firebase Storage
    const file = storage.bucket().file(filePath);
    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    
    // Return the public URL
    return `https://storage.googleapis.com/${storage.bucket().name}/${filePath}`;
  } catch (error: any) {
    console.error('Error uploading file to storage:', error);
    throw new Error(error?.message || 'Failed to upload file');
  }
}
