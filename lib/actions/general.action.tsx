import {db} from "@/firebase/admin";
import {generateObject} from "ai";
import {google} from "@ai-sdk/google";
import {feedbackSchema} from "@/constants";


export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit=20 } = params;

    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db
        .collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams){
    const { interviewId, userId, transcript, roundId, roundName } = params;
    
    // Trim whitespace to ensure consistency
    const trimmedInterviewId = interviewId?.trim();
    const trimmedUserId = userId?.trim();

    try{
        const formattedTranscript = transcript
            .map((sentence: {role: string; content: string; }) => (
                `-${sentence.role}:${sentence.content}\n`
            )).join('');
        const { object } = await generateObject({
            model: google( "gemini-2.0-flash-001"),
            schema: feedbackSchema,
            mode: "auto",
            prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Return exactly these 5 categories with these exact names:
        1. "Communication Skills" - Clarity, articulation, structured responses
        2. "Technical Knowledge" - Understanding of key concepts for the role
        3. "Problem Solving" - Ability to analyze problems and propose solutions
        4. "Cultural Fit" - Alignment with company values and job role
        5. "Confidence and Clarity" - Confidence in responses, engagement, and clarity

        For each category, provide:
        - name: The exact category name as listed above
        - score: A number from 0 to 100
        - comment: A detailed explanation of the score

        Also provide:
        - totalScore: Overall score from 0 to 100
        - strengths: Array of specific strengths observed
        - areasForImprovement: Array of specific areas that need improvement
        - finalAssessment: A comprehensive summary of the candidate's performance
        `,
            system:
                "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        console.log('Generated feedback object:', object);
        
        const { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment } = object;

        // Determine next attempt number
        const previousAttemptsSnap = await db
            .collection('feedback')
            .where('interviewId', '==', trimmedInterviewId)
            .where('userId', '==', trimmedUserId)
            .get();
        const attempt = (previousAttemptsSnap?.size || 0) + 1;

        const feedback = await db.collection('feedback').add({
            interviewId: trimmedInterviewId,
            userId: trimmedUserId,
            attempt,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            createdAt: new Date().toISOString(),
            ...(roundId && { roundId }),
            ...(roundName && { roundName }),
        })

        // Mark the interview as finalized after feedback is generated
        await db.collection('interviews').doc(trimmedInterviewId).update({
            finalized: true
        });

        return {
            success: true,
            feedbackId: feedback.id
        }
    } catch(e) {
        console.error('Error saving feedback:', e);

        return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
    const { interviewId, userId } = params;
    
    // Trim whitespace from userId to prevent query issues
    const trimmedUserId = userId?.trim();
    const trimmedInterviewId = interviewId?.trim();

    console.log('Looking for feedback:', { interviewId: trimmedInterviewId, userId: trimmedUserId });

    const feedback = await db
        .collection('feedback')
        .where('interviewId', '==', trimmedInterviewId)
        .where('userId', '==', trimmedUserId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

    console.log('Feedback query result:', { 
        empty: feedback.empty, 
        size: feedback.size,
        docs: feedback.docs.map(doc => ({ id: doc.id, data: doc.data() }))
    });

    if(feedback.empty) return null;

    const feedbackDoc = feedback.docs[0];
    return{
        id: feedbackDoc.id, ...feedbackDoc.data()
,    } as Feedback;

}
