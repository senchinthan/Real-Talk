import { NextRequest, NextResponse } from 'next/server';
import { deleteCompanyTemplate, updateCompanyTemplate, getCompanyTemplateById } from '@/lib/actions/company.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const { templateId } = params;
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Check if the request is coming from an admin page
    const url = new URL(request.url);
    const isAdminRequest = url.searchParams.get('isAdmin') === 'true';
    
    // Get the current user to verify admin status
    const user = await getCurrentUser();
    const isAdmin = (user?.isAdmin || user?.role === 'admin' || false) && isAdminRequest;
    
    const template = await getCompanyTemplateById(templateId, isAdmin);
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found or not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching company template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company template' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { templateId } = params;
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const result = await updateCompanyTemplate(templateId, data);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating company template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update company template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { templateId } = params;
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const templateData = await request.json();
    const result = await updateCompanyTemplate(templateId, templateData);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating company template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update company template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { templateId } = params;
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteCompanyTemplate(templateId);
    
    if (result.success) {
      return new Response(null, { status: 204 }); // No Content
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting company template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete company template' },
      { status: 500 }
    );
  }
}
