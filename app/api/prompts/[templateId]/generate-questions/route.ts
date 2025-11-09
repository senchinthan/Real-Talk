import { NextRequest, NextResponse } from 'next/server';
import { generateVoiceInterviewQuestions } from '@/lib/actions/gemini.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templateId = params.templateId;
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Generate questions for the prompt template
    const result = await generateVoiceInterviewQuestions(templateId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        questions: result.questions
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
