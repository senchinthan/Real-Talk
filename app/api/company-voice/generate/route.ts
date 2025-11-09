import { NextRequest, NextResponse } from 'next/server';
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getCompanyTemplateById } from '@/lib/actions/company.action';

export async function POST(request: NextRequest) {
    try {
        const { templateId, roundId, userId } = await request.json();

        if (!templateId || !roundId || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Get the template to find the round
        const template = await getCompanyTemplateById(templateId);
        if (!template) {
            return NextResponse.json(
                { success: false, error: 'Template not found' },
                { status: 404 }
            );
        }

        // Find the specific round
        const round = template.rounds.find((r: { id: string }) => r.id === roundId);
        if (!round) {
            return NextResponse.json(
                { success: false, error: 'Round not found' },
                { status: 404 }
            );
        }

        if (round.type !== 'voice') {
            return NextResponse.json(
                { success: false, error: 'Round is not a voice interview' },
                { status: 400 }
            );
        }

        // Get the prompt from the round or use a default prompt
        const prompt = round.prompt || 'Conduct a professional interview for a software engineering position. Ask about the candidate\'s experience, skills, and problem-solving abilities.';
        
        // Generate questions using Gemini
        const { text: questionsText } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `You are an expert interviewer preparing questions for a job interview.
            
            The company has provided the following instructions for this interview round:
            ${prompt}
            
            Based on these instructions, generate 5-7 interview questions that would be appropriate for a voice interview.
            The questions should follow the company's instructions closely.
            
            Return the questions as a JSON array of strings, like this:
            ["Question 1", "Question 2", "Question 3"]
            
            Do not include any explanations or additional text, just the JSON array.
            `,
        });

        // Parse the generated questions
        let questions;
        try {
            // Extract the JSON array from the response
            const jsonMatch = questionsText.match(/\[([\s\S]*)\]/); 
            if (jsonMatch) {
                questions = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON array found, try to parse the entire response
                questions = JSON.parse(questionsText);
            }

            // Ensure questions is an array
            if (!Array.isArray(questions)) {
                throw new Error('Generated content is not an array');
            }
        } catch (parseError) {
            console.error('Error parsing generated questions:', parseError);
            // If parsing fails, extract questions manually by splitting on newlines and cleaning up
            questions = questionsText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']') && !line.includes('```'))
                .map(line => {
                    // Remove numbers, quotes and other formatting
                    return line.replace(/^\d+\.\s*|^"|"$|^'|'$|^\*|\*$|^-\s*/g, '').trim();
                })
                .filter(line => line.length > 0);
        }

        // Save the generated questions to the database
        const timestamp = new Date();

        // Update the promptTemplate document if roundId is provided
        if (round.promptTemplateId) {
            // Update the promptTemplate with the generated questions
            await db.collection('promptTemplates').doc(round.promptTemplateId).update({
                generatedQuestions: questions,
                lastUpdated: timestamp,
                // Store the original prompt as well
                originalPrompt: prompt
            });
            
            console.log(`Updated promptTemplate ${round.promptTemplateId} with ${questions.length} questions`);
        } else {
            console.error(`Could not find promptTemplateId for round ${roundId}`);
            return NextResponse.json(
                { success: false, error: 'Could not find promptTemplate for this round' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            questions
        });
    } catch (error) {
        console.error('Error generating voice interview questions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate voice interview questions' },
            { status: 500 }
        );
    }
}
