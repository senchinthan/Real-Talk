import { NextRequest, NextResponse } from 'next/server';
import { getPromptTemplates, createPromptTemplate } from '@/lib/actions/gemini.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(request: NextRequest) {
  try {
    const templates = await getPromptTemplates();
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching prompt templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prompt templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templateData = await request.json();
    
    // Validate required fields
    if (!templateData.name || !templateData.prompt) {
      return NextResponse.json(
        { success: false, error: 'Name and prompt are required' },
        { status: 400 }
      );
    }

    const result = await createPromptTemplate(templateData);
    
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
  } catch (error) {
    console.error('Error creating prompt template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create prompt template' },
      { status: 500 }
    );
  }
}
