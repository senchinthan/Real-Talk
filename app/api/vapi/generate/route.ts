import {generateText} from "ai";
import {google} from "@ai-sdk/google";
import {getRandomInterviewCover} from "@/lib/utils";
import {db} from "@/firebase/admin";

export async function GET(){
    console.log('Generate API GET endpoint called');
    return Response.json({ 
        success: true,
        data: 'THANK YOU',
        timestamp: new Date().toISOString()
    }, { status: 200 });
}

export async function POST(request: Request) {
    console.log('Generate API POST endpoint called at:', new Date().toISOString());
    
    let type, role, level, techstack, amount, userid;
    
    try {
        const body = await request.json();
        console.log('Raw request body:', body);
        
        ({ type, role, level, techstack, amount, userid } = body);
        
        console.log('Generate API received data:', { type, role, level, techstack, amount, userid });
        console.log('Userid type:', typeof userid, 'Value:', userid);
    } catch (error) {
        console.error('Error parsing request body:', error);
        return Response.json({ 
            success: false, 
            error: 'Invalid JSON in request body' 
        }, { status: 400 });
    }

    // Clean and validate userid
    const cleanedUserId = userid ? userid.toString().trim() : null;
    const actualUserId = cleanedUserId && 
                        cleanedUserId !== 'default_userid' && 
                        cleanedUserId !== '' && 
                        cleanedUserId.length > 10 && // Firebase user IDs are typically longer
                        !cleanedUserId.includes(' ') ? // Should not contain spaces
                        cleanedUserId : null;
    
    console.log('Cleaned userId:', cleanedUserId, 'Actual userId:', actualUserId);
    
    if (!actualUserId) {
        console.error('Invalid or missing userid:', { 
            original: userid, 
            cleaned: cleanedUserId, 
            reason: !cleanedUserId ? 'null/undefined' : 
                   cleanedUserId === 'default_userid' ? 'default value' :
                   cleanedUserId === '' ? 'empty string' :
                   cleanedUserId.length <= 10 ? 'too short' :
                   cleanedUserId.includes(' ') ? 'contains spaces' : 'unknown'
        });
        return Response.json({ 
            success: false, 
            error: 'Invalid user ID provided' 
        }, { status: 400 });
    }

    try {
        const { text: questions } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you!
    `,
        });

        const interview = {
            role: role,
            type: type,
            level: level,
            techstack: techstack.split(","),
            questions: JSON.parse(questions),
            userId: actualUserId, // Use the validated user ID
            finalized: true,
            isUserGenerated: true, // Mark as user-generated
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
        };

        await db.collection("interviews").add(interview);

        return Response.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return Response.json({ success: false, error: error }, { status: 500 });
    }
}
