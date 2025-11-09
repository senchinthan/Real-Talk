import { NextRequest, NextResponse } from 'next/server';
import { getPromptTemplateById, updatePromptTemplate, deletePromptTemplate } from '@/lib/actions/gemini.action';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = params.id;
    const template = await getPromptTemplateById(templateId);
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching prompt template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prompt template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const templateId = params.id;
    const templateData = await request.json();
    
    // Check if template exists
    const existingTemplate = await getPromptTemplateById(templateId);
    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields
    if (templateData.name === '' || templateData.prompt === '') {
      return NextResponse.json(
        { success: false, error: 'Name and prompt cannot be empty' },
        { status: 400 }
      );
    }
    
    const result = await updatePromptTemplate(templateId, templateData);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating prompt template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update prompt template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const templateId = params.id;
    
    // Check if template exists
    const existingTemplate = await getPromptTemplateById(templateId);
    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    
    const result = await deletePromptTemplate(templateId);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting prompt template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete prompt template' },
      { status: 500 }
    );
  }
}
