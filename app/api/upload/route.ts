import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToStorage } from '@/lib/actions/storage.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { fileData, path } = body;

    if (!fileData) {
      return NextResponse.json(
        { success: false, error: 'File data is required' },
        { status: 400 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Storage path is required' },
        { status: 400 }
      );
    }

    // Validate file data format
    if (!fileData.startsWith('data:')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file data format. Must be a data URL.' },
        { status: 400 }
      );
    }

    // Upload the file to storage
    const fileUrl = await uploadFileToStorage(fileData, path);

    // Return the file URL
    return NextResponse.json({
      success: true,
      data: { url: fileUrl }
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    
    // Provide more detailed error messages
    const errorMessage = error?.message || 'Failed to upload file';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
