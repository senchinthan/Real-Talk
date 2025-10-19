import { NextRequest, NextResponse } from 'next/server';
import { getCompanyTemplates, createCompanyInterview } from '@/lib/actions/company.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(request: NextRequest) {
  try {
    const templates = await getCompanyTemplates();
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
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error('Error creating company interview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create company interview' },
      { status: 500 }
    );
  }
}
