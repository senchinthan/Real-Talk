import { NextRequest, NextResponse } from 'next/server';
import { getPromptTemplateById, generateInterviewQuestions } from '@/lib/actions/gemini.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { templateId, role, level, techstack, amount, customData } = await request.json();
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Get the prompt template
    const template = await getPromptTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Generate questions
    const result = await generateInterviewQuestions({
      promptTemplate: template.prompt,
      role,
      level,
      techstack,
      amount: amount || 5,
      customData
    });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          questions: result.questions
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error generating interview questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate interview questions' },
      { status: 500 }
    );
  }
}
