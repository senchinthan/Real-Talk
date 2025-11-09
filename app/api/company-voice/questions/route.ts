import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/firebase/admin";
import { getCompanyTemplateById } from '@/lib/actions/company.action';
import { generateVoiceInterviewQuestions } from '@/lib/actions/gemini.action';

export async function GET(request: NextRequest) {
    try {
        // Get query parameters
        const url = new URL(request.url);
        const templateId = url.searchParams.get('templateId');
        const roundId = url.searchParams.get('roundId');

        if (!templateId || !roundId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: templateId and roundId' },
                { status: 400 }
            );
        }

        // Get the template to find the round and its promptTemplateId
        const template = await getCompanyTemplateById(templateId);
        if (template) {
            const round = template.rounds.find((r: any) => r.id === roundId);
            if (round && round.promptTemplateId) {
                const promptTemplateId = round.promptTemplateId;
                try {
                    // Get questions directly from the promptTemplate document
                    const promptTemplateDoc = await db.collection('promptTemplates').doc(promptTemplateId).get();
                    if (promptTemplateDoc.exists) {
                        const promptTemplate = promptTemplateDoc.data();
                        if (promptTemplate && promptTemplate.generatedQuestions && promptTemplate.generatedQuestions.length > 0) {
                            console.log(`Found ${promptTemplate.generatedQuestions.length} questions in promptTemplate ${promptTemplateId}`);
                            return NextResponse.json({
                                success: true,
                                questions: promptTemplate.generatedQuestions,
                                prompt: promptTemplate.originalPrompt || promptTemplate.prompt || null
                            });
                        } else {
                            // No questions found, but prompt template exists - generate questions now
                            console.log(`No questions found in promptTemplate ${promptTemplateId}, generating now...`);
                            
                            // Generate questions synchronously since we need them now
                            const generationResult = await generateVoiceInterviewQuestions(promptTemplateId);
                            
                            if (generationResult.success && generationResult.questions) {
                                console.log(`Successfully generated ${generationResult.questions.length} questions for promptTemplate ${promptTemplateId}`);
                                return NextResponse.json({
                                    success: true,
                                    questions: generationResult.questions,
                                    generated: true
                                });
                            } else {
                                console.error(`Failed to generate questions: ${generationResult.error}`);
                            }
                        }
                    } else {
                        console.log(`PromptTemplate ${promptTemplateId} not found`);
                    }
                } catch (error) {
                    console.error(`Error fetching or generating prompt template: ${error}`);
                }
            } else {
                console.log(`No promptTemplateId found for round ${roundId}`);
            }
        } else {
            console.log(`Template ${templateId} not found`);
        }
        
        // If no questions found, return default questions
        const defaultQuestions = [
            "Tell me about your background and experience.",
            "What are your strengths and weaknesses?",
            "Why are you interested in this role?",
            "Describe a challenging project you worked on.",
            "Do you have any questions for me?"
        ];
        
        console.log(`No questions found for voice round ${roundId}, returning default questions`);
        return NextResponse.json({
            success: true,
            questions: defaultQuestions,
            isDefault: true
        });
    } catch (error) {
        console.error('Error fetching voice questions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch voice interview questions' },
            { status: 500 }
        );
    }
}
