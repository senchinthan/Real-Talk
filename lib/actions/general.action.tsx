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

    // First, get all finalized interviews that are not from the current user
    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit * 2) // Get more to account for filtering
        .get();

    // Filter out user-generated interviews in memory
    const filteredInterviews = interviews.docs
        .map((doc) => ({
            id: doc.id,
            ...doc.data()
        }))
        .filter((interview: any) => !interview.isUserGenerated)
        .slice(0, limit); // Limit to requested amount

    return filteredInterviews as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db
        .collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript } = params;

    try {
        console.log("Starting feedback generation for interview:", interviewId);
        console.log("Transcript length:", transcript.length);
        
        const formattedTranscript = transcript
            .map((sentence: { role: string; content: string }) =>(
                    `- ${sentence.role}: ${sentence.content}\n`
            )).join('');

        console.log("Formatted transcript:", formattedTranscript.substring(0, 200) + "...");

        // Check if Google API key is available
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            console.error("Google AI API key not found in environment variables");
            return { success: false, error: "Google AI API key not configured" };
        }

        console.log("Generating feedback with Google AI...");
        const { object: {totalScore, categoryScores, strengths, areasForImprovement, finalAssessment} } = await generateObject({
            model: google("gemini-2.0-flash-001"),
            schema: feedbackSchema,
            prompt: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.

        Transcript:
        ${formattedTranscript}

        Please provide feedback in the following format:
        
        1. **Total Score**: A number from 0-100 representing overall performance
        2. **Category Scores**: An array of exactly 5 objects, each with:
           - name: One of "Communication Skills", "Technical Knowledge", "Problem Solving", "Cultural Fit", "Confidence and Clarity"
           - score: A number from 0-100
           - comment: A detailed comment about performance in this area
        
        3. **Strengths**: An array of strings highlighting what the candidate did well
        4. **Areas for Improvement**: An array of strings identifying specific areas to work on
        5. **Final Assessment**: A comprehensive summary paragraph
        
        Categories to evaluate:
        - **Communication Skills**: Clarity, articulation, structured responses
        - **Technical Knowledge**: Understanding of key concepts for the role
        - **Problem Solving**: Ability to analyze problems and propose solutions
        - **Cultural Fit**: Alignment with company values and job role
        - **Confidence and Clarity**: Confidence in responses, engagement, and clarity
        `,
            system:
                "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Return the feedback in the exact JSON format requested.",
        })

        console.log("Feedback generated successfully:", { totalScore, categoryScores });

        const feedback = await db.collection('feedback').add({
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            createdAt: new Date().toISOString(),
        })

        console.log("Feedback saved to database with ID:", feedback.id);
        return { success: true, feedbackId: feedback.id }

    } catch (e) {
        console.error("Error saving feedback:", e);
        console.error("Error details:", {
            message: e instanceof Error ? e.message : 'Unknown error',
            stack: e instanceof Error ? e.stack : undefined,
            name: e instanceof Error ? e.name : undefined
        });

        return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    console.log('Getting feedback for interview:', interviewId, 'user:', userId);

    const feedback = await db
        .collection('feedback')
        .where('interviewId', '==', interviewId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    console.log('Feedback query result:', feedback.empty ? 'No feedback found' : 'Feedback found');

    if(feedback.empty) return null;

    const feedbackDoc = feedback.docs[0];
    const rawData = feedbackDoc.data();
    console.log('Raw feedback data from database:', rawData);
    console.log('Raw totalScore:', rawData.totalScore, 'Type:', typeof rawData.totalScore);
    
    const feedbackData = {
        id: feedbackDoc.id, 
        ...rawData,
        totalScore: typeof rawData.totalScore === 'string' ? parseInt(rawData.totalScore) : rawData.totalScore
    } as Feedback;

    console.log('Processed feedback data:', feedbackData);
    console.log('Processed totalScore:', feedbackData.totalScore, 'Type:', typeof feedbackData.totalScore);
    return feedbackData;
}
