import { NextRequest, NextResponse } from 'next/server';
import { getCompanyTemplates, createCompanyInterview, createCompanyTemplate } from '@/lib/actions/company.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(request: NextRequest) {
  try {
    // Check if the request is coming from an admin page
    const url = new URL(request.url);
    const isAdminRequest = url.searchParams.get('isAdmin') === 'true';
    
    // Get the current user to verify admin status
    const user = await getCurrentUser();
    const isAdmin = (user?.isAdmin || user?.role === 'admin' || false) && isAdminRequest;
    
    // Get templates with admin flag
    const templates = await getCompanyTemplates(isAdmin);
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching company templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Check if this is a template creation request or an interview creation request
    if (body.companyName !== undefined && body.rounds !== undefined) {
      // This is a template creation request
      const result = await createCompanyTemplate(body);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          data: {
            templateId: result.templateId
          }
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    } else if (body.templateId) {
      // This is an interview creation request
      const { templateId } = body;
      const result = await createCompanyInterview(user.id, templateId);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          data: {
            interviewId: result.interviewId
          }
        });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
