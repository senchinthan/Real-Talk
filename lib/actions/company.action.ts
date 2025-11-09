import { db } from "@/firebase/admin";
import { companyTemplates } from "@/constants/companyTemplates";
import { createFeedback } from "@/lib/actions/general.action";
import { getRandomAptitudeQuestions } from "@/lib/actions/aptitude.action";
import { getRandomCodingQuestions } from "@/lib/actions/coding.action";
import { Timestamp } from "firebase-admin/firestore";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { feedbackSchema } from "@/constants";

// Define types needed for the file
type UserAnswer = {
  questionId: string;
  answer: string | number;
  code?: string;
  language?: string;
  isCorrect?: boolean;
  score?: number;
};

type Round = {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
};

type CompanyTemplate = {
  id: string;
  name: string;
  description?: string;
  rounds: Round[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
};

type CompanyInterview = {
  id: string;
  templateId: string;
  companyName: string;
  userId: string;
  createdAt: string;
  completedRounds: string[];
  [key: string]: any;
};

type RoundFeedback = {
  id: string;
  interviewId: string;
  userId: string;
  roundId: string;
  roundName: string;
  totalScore: number;
  categoryScores: Array<{ name: string; score: number; comment: string }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
  attempt?: number;
  [key: string]: any;
};

// Get all company templates
export async function getCompanyTemplates(isAdmin: boolean = false): Promise<CompanyTemplate[]> {
  try {
    // Try to fetch templates from Firestore first
    const snapshot = await db.collection('companyTemplates').get();
    
    // If we have templates in Firestore, return those (filtered by isActive for non-admins)
    if (!snapshot.empty) {
      const templates = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as CompanyTemplate[];
      
      // Only filter for non-admin users
      return isAdmin ? templates : templates.filter(template => template.isActive);
    }
    
    // Fall back to predefined templates if no templates in Firestore
    // Always filter predefined templates by isActive for consistency
    return companyTemplates.filter(template => isAdmin || template.isActive);
  } catch (error) {
    console.error('Error fetching company templates:', error);
    // Fall back to predefined templates on error
    return companyTemplates.filter(template => isAdmin || template.isActive);
  }
}

// Get a specific company template by ID
export async function getCompanyTemplateById(templateId: string, isAdmin: boolean = false): Promise<CompanyTemplate | null> {
  try {
    // Try to fetch from Firestore first
    const doc = await db.collection('companyTemplates').doc(templateId).get();
    
    // If document exists in Firestore, check if it's active or user is admin
    if (doc.exists) {
      const template = {
        ...doc.data(),
        id: doc.id
      } as CompanyTemplate;
      
      // Only return the template if it's active or the user is an admin
      if (isAdmin || template.isActive) {
        return template;
      }
      return null; // Return null for inactive templates if user is not admin
    }
    
    // If not in Firestore, check predefined templates
    const predefinedTemplate = companyTemplates.find(template => template.id === templateId);
    
    // Only return the template if it's active or the user is an admin
    if (predefinedTemplate && (isAdmin || predefinedTemplate.isActive)) {
      return predefinedTemplate;
    }
    return null;
  } catch (error) {
    console.error('Error fetching company template:', error);
    // Try predefined templates on error
    const predefinedTemplate = companyTemplates.find(template => template.id === templateId);
    
    // Only return the template if it's active or the user is an admin
    if (predefinedTemplate && (isAdmin || predefinedTemplate.isActive)) {
      return predefinedTemplate;
    }
    return null;
  }
}

// Import necessary functions from questionBank.action.ts
import { getAptitudeQuestionBankById, getTextQuestionBankById, getCodingQuestionBankById } from './questionBank.action';

// Helper function to get random questions from an array
function getRandomQuestions<T>(questions: T[], count: number): T[] {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Extended Round interface with question bank properties
interface ExtendedRound extends Round {
  questionBankId?: string;
  questionCount?: number;
  promptTemplateId?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
}

// Create a new company interview instance
export async function createCompanyInterview(userId: string, templateId: string, isAdmin: boolean = false): Promise<{ success: boolean; interviewId?: string; error?: string }> {
  try {
    const template = await getCompanyTemplateById(templateId, isAdmin);
    if (!template) {
      return { success: false, error: 'Template not found or not available' };
    }
    
    // Process rounds to maintain question bank references
    const processedRounds = template.rounds.map((round) => {
      // Cast to ExtendedRound to access additional properties
      const extendedRound = round as ExtendedRound;
      // Create a copy of the round, preserving the questionBankId
      const processedRound = { ...extendedRound };
      
      // Log the round details for debugging
      console.log(`Processing round: ${extendedRound.name}, type: ${extendedRound.type}, questionBankId: ${extendedRound.questionBankId || 'none'}`);
      
      // Ensure the round has a questions array for compatibility
      // but don't load the actual questions - they'll be loaded when needed
      if (!processedRound.questions) {
        processedRound.questions = [];
      }
      
      return processedRound;
    });

    // Generate the document ID first so we can include it in the initial document
    const interviewId = db.collection('companyInterviews').doc().id;
    console.log(`Generated new interview ID: ${interviewId}`);
    
    // Create the interview object with the ID already set
    const companyInterview: CompanyInterview = {
      id: interviewId, // Set the ID from the beginning
      templateId,
      companyName: template.companyName,
      userId,
      createdAt: new Date().toISOString(),
      completedRounds: []
    };

    console.log('Creating new company interview for user:', userId, 'with template:', templateId);
    
    // Create the document with the ID already set
    await db.collection('companyInterviews').doc(interviewId).set({
      ...companyInterview,
      // Add rounds separately since it's not in the CompanyInterview interface
      // but we need it in the database
      rounds: processedRounds
    });
    
    console.log(`Created company interview with ID: ${interviewId}`);
    
    // Double-check that the document was created with the correct ID
    const createdDoc = await db.collection('companyInterviews').doc(interviewId).get();
    if (createdDoc.exists) {
      const data = createdDoc.data();
      if (!data?.id || data.id !== interviewId) {
        console.log(`Interview created but ID field was not set correctly. Fixing...`);
        await db.collection('companyInterviews').doc(interviewId).update({ id: interviewId });
        console.log(`Fixed ID field for interview ${interviewId}`);
      } else {
        console.log(`Verified interview ${interviewId} has correct ID field`);
      }
    } else {
      console.error(`Failed to verify interview ${interviewId} was created`);
    }
    
    return { 
      success: true, 
      interviewId: interviewId 
    };
  } catch (error) {
    console.error('Error creating company interview:', error);
    return { success: false, error: 'Failed to create company interview' };
  }
}

// Get all company interviews for a user
export async function getCompanyInterviewsByUserId(userId?: string | null): Promise<CompanyInterview[]> {
  try {
    // Return empty array if userId is undefined or null
    if (!userId) {
      console.log('getCompanyInterviewsByUserId called with null/undefined userId');
      return [];
    }
    
    console.log(`Fetching interviews for userId: ${userId}`);
    const interviews = await db
      .collection('companyInterviews')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    console.log(`Found ${interviews.docs.length} interviews for user ${userId}`);
    
    const result = interviews.docs.map((doc) => {
      const data = doc.data();
      const docId = doc.id;
      
      // Create a new object with the document ID as the interview ID
      // This ensures the ID is always set correctly regardless of what's in the data
      const interview: CompanyInterview = {
        id: docId,
        templateId: data.templateId || '',
        companyName: data.companyName || '',
        userId: data.userId || '',
        createdAt: data.createdAt || new Date().toISOString(),
        completedRounds: data.completedRounds || [],
      };
      
      console.log(`Interview ${docId} mapped with explicit ID`);
      
      // If the document doesn't have an id field or it's different from the doc.id,
      // update it in Firestore to fix the inconsistency
      if (!data.id || data.id !== docId) {
        console.log(`Fixing missing/incorrect ID for interview ${docId}`);
        // Use a non-blocking update to avoid slowing down the response
        db.collection('companyInterviews').doc(docId).update({ id: docId })
          .then(() => console.log(`Updated interview ${docId} with correct ID`))
          .catch(err => console.error(`Failed to update interview ${docId} ID:`, err));
      }
      
      return interview;
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching company interviews:', error);
    return [];
  }
}

// Get a specific company interview
export async function getCompanyInterviewById(interviewId: string): Promise<CompanyInterview | null> {
  try {
    const interview = await db
      .collection('companyInterviews')
      .doc(interviewId)
      .get();

    if (!interview.exists) {
      return null;
    }
    
    const interviewData = interview.data();
    
    // Ensure interviewData is not undefined
    if (!interviewData) {
      return null;
    }
    
    // If the interview doesn't have rounds (old format), fetch from template
    if (!interviewData.rounds) {
      const template = await getCompanyTemplateById(interviewData.templateId);
      if (template) {
        interviewData.rounds = template.rounds;
      }
    }

    return {
      id: interview.id,
      ...interviewData
    } as CompanyInterview;
  } catch (error) {
    console.error('Error fetching company interview:', error);
    return null;
  }
}

// Mark a round as completed
export async function markRoundComplete(interviewId: string, roundId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`markRoundComplete called with interviewId: ${interviewId}, roundId: ${roundId}`);
    
    // Get the interview
    console.log(`Fetching interview with ID: ${interviewId}`);
    const interview = await getCompanyInterviewById(interviewId);
    
    if (!interview) {
      console.error(`Interview not found with ID: ${interviewId}`);
      return { success: false, error: 'Interview not found' };
    }
    
    console.log(`Interview found: ${JSON.stringify({
      id: interview.id,
      templateId: interview.templateId,
      userId: interview.userId,
      completedRounds: interview.completedRounds
    }, null, 2)}`);

    // Update completed rounds
    const updatedCompletedRounds = [...(interview.completedRounds || [])];
    if (!updatedCompletedRounds.includes(roundId)) {
      console.log(`Adding roundId ${roundId} to completedRounds`);
      updatedCompletedRounds.push(roundId);
    } else {
      console.log(`Round ${roundId} already marked as complete`);
    }

    console.log(`Updating companyInterviews collection, document ID: ${interviewId}`);
    console.log(`New completedRounds array: ${JSON.stringify(updatedCompletedRounds)}`);
    
    try {
      await db.collection('companyInterviews').doc(interviewId).update({
        completedRounds: updatedCompletedRounds
      });
      console.log(`Successfully updated completedRounds for interview ${interviewId}`);
      return { success: true };
    } catch (updateError: any) {
      console.error('Error updating completedRounds:', updateError);
      return { success: false, error: `Failed to update completedRounds: ${updateError?.message || 'Unknown error'}` };
    }
  } catch (error: any) {
    console.error('Error in markRoundComplete:', error);
    return { success: false, error: `Failed to mark round complete: ${error?.message || 'Unknown error'}` };
  }
}

// Get feedback for a specific round
export async function getRoundFeedback(interviewId: string, roundId: string, userId: string): Promise<RoundFeedback | null> {
  try {
    const feedback = await db
      .collection('feedback')
      .where('interviewId', '==', interviewId)
      .where('userId', '==', userId)
      .where('roundId', '==', roundId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (feedback.empty) {
      return null;
    }

    const feedbackDoc = feedback.docs[0];
    return {
      id: feedbackDoc.id,
      ...feedbackDoc.data()
    } as RoundFeedback;
  } catch (error) {
    console.error('Error fetching round feedback:', error);
    return null;
  }
}

// Get cumulative feedback across all rounds for a company interview
export async function getCumulativeFeedback(interviewId: string, userId: string): Promise<{
  totalRounds: number;
  completedRounds: number;
  averageScore: number;
  roundScores: Array<{
    roundId: string;
    roundName: string;
    score: number;
    attempt: number;
  }>;
  overallStrengths: string[];
  overallAreasForImprovement: string[];
  finalAssessment: string;
}> {
  try {
    const allFeedback = await db
      .collection('feedback')
      .where('interviewId', '==', interviewId)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    if (allFeedback.empty) {
      return {
        totalRounds: 0,
        completedRounds: 0,
        averageScore: 0,
        roundScores: [],
        overallStrengths: [],
        overallAreasForImprovement: [],
        finalAssessment: 'No feedback available yet'
      };
    }

    const feedbackDocs = allFeedback.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RoundFeedback[];

    // Get unique rounds (latest attempt for each round)
    const roundMap = new Map<string, RoundFeedback>();
    feedbackDocs.forEach(feedback => {
      if (!roundMap.has(feedback.roundId) || (feedback.attempt || 0) > (roundMap.get(feedback.roundId)?.attempt || 0)) {
        roundMap.set(feedback.roundId, feedback);
      }
    });

    const uniqueRounds = Array.from(roundMap.values());
    const totalScore = uniqueRounds.reduce((sum, feedback) => sum + feedback.totalScore, 0);
    const averageScore = uniqueRounds.length > 0 ? Math.round(totalScore / uniqueRounds.length) : 0;

    // Aggregate strengths and areas for improvement
    const allStrengths = uniqueRounds.flatMap(feedback => feedback.strengths);
    const allAreasForImprovement = uniqueRounds.flatMap(feedback => feedback.areasForImprovement);

    // Get unique values
    const overallStrengths = [...new Set(allStrengths)];
    const overallAreasForImprovement = [...new Set(allAreasForImprovement)];

    const roundScores = uniqueRounds.map(feedback => ({
      roundId: feedback.roundId,
      roundName: feedback.roundName,
      score: feedback.totalScore,
      attempt: feedback.attempt || 1
    }));

    return {
      totalRounds: uniqueRounds.length,
      completedRounds: uniqueRounds.length,
      averageScore,
      roundScores,
      overallStrengths,
      overallAreasForImprovement,
      finalAssessment: `Completed ${uniqueRounds.length} rounds with an average score of ${averageScore}/100. ${overallStrengths.length > 0 ? `Key strengths include: ${overallStrengths.slice(0, 3).join(', ')}.` : ''} ${overallAreasForImprovement.length > 0 ? `Areas for improvement: ${overallAreasForImprovement.slice(0, 3).join(', ')}.` : ''}`
    };
  } catch (error) {
    console.error('Error fetching cumulative feedback:', error);
    return {
      totalRounds: 0,
      completedRounds: 0,
      averageScore: 0,
      roundScores: [],
      overallStrengths: [],
      overallAreasForImprovement: [],
      finalAssessment: 'Error loading feedback'
    };
  }
}

// Create a new company template
export async function createCompanyTemplate(templateData: {
  companyName: string;
  description: string;
  isActive: boolean;
  rounds: Array<{
    id: string;
    name: string;
    type: 'voice' | 'text' | 'code' | 'aptitude';
    description: string;
    duration: number | null;
    questionBankId?: string;
    questionCount?: number;
    promptTemplateId?: string;
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  }>;
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    if (!templateData.companyName) {
      return { success: false, error: 'Company name is required' };
    }

    if (!templateData.rounds || templateData.rounds.length === 0) {
      return { success: false, error: 'At least one round is required' };
    }

    // Validate rounds
    for (const round of templateData.rounds) {
      if (!round.name || !round.type) {
        return { success: false, error: 'Each round must have a name and type' };
      }

      // Validate question bank for aptitude, code, and text rounds
      if ((round.type === 'aptitude' || round.type === 'code' || round.type === 'text') && !round.questionBankId) {
        return { success: false, error: `Question bank is required for ${round.type} round: ${round.name}` };
      }

      // Validate prompt template for voice interviews
      if (round.type === 'voice' && !round.promptTemplateId) {
        return { success: false, error: `Prompt template is required for voice round: ${round.name}` };
      }

      // Validate duration for non-voice rounds
      if (round.type !== 'voice' && (!round.duration || round.duration < 5)) {
        return { success: false, error: `Valid duration is required for ${round.type} round: ${round.name}` };
      }
    }

    // In a real implementation, you would save to Firestore
    // For now, we'll just generate an ID and return success
    const templateId = `template-${Date.now()}`;

    // Convert rounds to the format expected by the database
    const processedRounds = templateData.rounds.map(round => {
      // Base round object with common properties
      const baseRound = {
        id: round.id,
        name: round.name,
        type: round.type,
        duration: round.duration || (round.type === 'voice' ? 0 : 30),
        passingScore: 70,
        questions: [] as any[],
      };
      
      // For aptitude, code, and text rounds, preserve questionBankId and questionCount
      if (round.type === 'aptitude' || round.type === 'code' || round.type === 'text') {
        return {
          ...baseRound,
          questionBankId: round.questionBankId,
          questionCount: round.questionCount || 5,
          difficulty: round.difficulty || 'mixed',
        };
      }
      
      // For voice rounds, preserve promptTemplateId
      if (round.type === 'voice') {
        return {
          ...baseRound,
          promptTemplateId: round.promptTemplateId,
          questions: ["Placeholder question for voice interview"],
        };
      }
      
      return baseRound;
    });

    // Add the template to the database
    await db.collection('companyTemplates').doc(templateId).set({
      id: templateId,
      companyName: templateData.companyName,
      companyLogo: "/companies/default.png", // Default logo
      description: templateData.description || '',
      isActive: templateData.isActive ?? true,
      rounds: processedRounds,
      createdAt: new Date().toISOString()
    });

    return { success: true, templateId };
  } catch (error) {
    console.error('Error creating company template:', error);
    return { success: false, error: 'Failed to create company template' };
  }
}

// Update a company template
export async function updateCompanyTemplate(templateId: string, updateData: Partial<CompanyTemplate>): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the template exists in Firestore
    const doc = await db.collection('companyTemplates').doc(templateId).get();
    
    if (doc.exists) {
      // Update in Firestore
      await db.collection('companyTemplates').doc(templateId).update({
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    }
    
    // If not in Firestore, it might be a predefined template
    // We can't update those, so return an error
    const predefinedTemplate = companyTemplates.find(template => template.id === templateId);
    if (predefinedTemplate) {
      return { success: false, error: 'Cannot update predefined templates' };
    }
    
    return { success: false, error: 'Template not found' };
  } catch (error) {
    console.error('Error updating company template:', error);
    return { success: false, error: 'Failed to update company template' };
  }
}

// Delete a company template
export async function deleteCompanyTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the template exists in Firestore
    const doc = await db.collection('companyTemplates').doc(templateId).get();
    
    if (doc.exists) {
      // Delete from Firestore
      await db.collection('companyTemplates').doc(templateId).delete();
      return { success: true };
    }
    
    // If not in Firestore, it might be a predefined template
    // We can't delete those, so return an error
    const predefinedTemplate = companyTemplates.find(template => template.id === templateId);
    if (predefinedTemplate) {
      return { success: false, error: 'Cannot delete predefined templates' };
    }
    
    return { success: false, error: 'Template not found' };
  } catch (error) {
    console.error('Error deleting company template:', error);
    return { success: false, error: 'Failed to delete company template' };
  }
}

// Get all round feedback for a company interview
export async function getAllRoundFeedback(interviewId: string, userId: string): Promise<RoundFeedback[]> {
  try {
    const feedback = await db
      .collection('feedback')
      .where('interviewId', '==', interviewId)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return feedback.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as RoundFeedback[];
  } catch (error) {
    console.error('Error fetching all round feedback:', error);
    return [];
  }
}

// Create feedback for a specific round (aptitude, coding, or behavioral)
export async function createRoundFeedback(params: {
  interviewId: string;
  userId: string;
  roundId: string;
  roundName: string;
  transcript?: { role: string; content: string }[];
  answers?: UserAnswer[];
  score?: number;
}): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
  try {
    const { interviewId, userId, roundId, roundName, transcript, answers, score } = params;

    // Get the round details to understand the question type
    const interview = await getCompanyInterviewById(interviewId);
    if (!interview) {
      return { success: false, error: 'Interview not found' };
    }

    // Get the template to find the round
    const template = await getCompanyTemplateById(interview.templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    const round = template.rounds.find(r => r.id === roundId);
    if (!round) {
      return { success: false, error: 'Round not found' };
    }

    let feedbackData: any = {
      interviewId,
      userId,
      roundId,
      roundName,
      attempt: 1, // TODO: Calculate attempt number
      totalScore: score || 0,
      categoryScores: [],
      strengths: [],
      areasForImprovement: [],
      finalAssessment: '',
      createdAt: new Date().toISOString()
    };

    // Generate feedback based on round type
    if (round.type === 'aptitude' && answers) {
      // Generate AI feedback for aptitude questions
      feedbackData = await generateAptitudeFeedback(feedbackData, answers, round);
    } else if (round.type === 'code' && answers) {
      // Generate AI feedback for coding questions
      feedbackData = await generateCodingFeedback(feedbackData, answers, round);
    } else if (round.type === 'voice' && transcript) {
      // Use Gemini to generate feedback directly for company voice interviews
      feedbackData = await generateVoiceInterviewFeedback(feedbackData, transcript);
    }

    // Save the feedback
    const docRef = await db.collection('feedback').add(feedbackData);
    
    return { 
      success: true, 
      feedbackId: docRef.id 
    };
  } catch (error) {
    console.error('Error creating round feedback:', error);
    return { success: false, error: 'Failed to create round feedback' };
  }
}

// Generate AI feedback for aptitude questions
async function generateAptitudeFeedback(feedbackData: any, answers: UserAnswer[], round: Round): Promise<any> {
  // This would integrate with AI to analyze text responses
  // For now, we'll create a basic structure
  
  const strengths = [];
  const areasForImprovement = [];
  
  // Analyze answers and generate feedback
  if (answers.length > 0) {
    strengths.push('Completed all questions');
    if (feedbackData.totalScore >= 80) {
      strengths.push('Strong performance on aptitude questions');
    } else if (feedbackData.totalScore >= 60) {
      areasForImprovement.push('Consider reviewing fundamental concepts');
    } else {
      areasForImprovement.push('Focus on improving core knowledge areas');
    }
  }

  feedbackData.categoryScores = [
    { name: 'Aptitude', score: feedbackData.totalScore, comment: 'Performance on aptitude questions' }
  ];
  
  feedbackData.strengths = strengths;
  feedbackData.areasForImprovement = areasForImprovement;
  feedbackData.finalAssessment = `Scored ${feedbackData.totalScore}/100 on the ${round.name} round. ${strengths.length > 0 ? `Strengths: ${strengths.join(', ')}.` : ''} ${areasForImprovement.length > 0 ? `Areas for improvement: ${areasForImprovement.join(', ')}.` : ''}`;

  return feedbackData;
}

// Generate AI feedback for voice interviews using Gemini
async function generateVoiceInterviewFeedback(feedbackData: any, transcript: { role: string; content: string }[]): Promise<any> {
  try {
    // Format the transcript for Gemini
    const formattedTranscript = transcript
      .map(msg => `${msg.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
      .join('\n\n');

    // Generate structured feedback using Gemini
    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001"),
      schema: feedbackSchema,
      mode: "auto",
      prompt: `
      You are an AI interviewer analyzing a voice interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.

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
      system: "You are a professional interviewer analyzing a voice interview. Your task is to evaluate the candidate based on structured categories",
    });

    // Update the feedback data with the AI-generated feedback
    feedbackData.totalScore = object.totalScore;
    feedbackData.categoryScores = object.categoryScores;
    feedbackData.strengths = object.strengths;
    feedbackData.areasForImprovement = object.areasForImprovement;
    feedbackData.finalAssessment = object.finalAssessment;

    return feedbackData;
  } catch (error) {
    console.error('Error generating voice interview feedback:', error);
    
    // Fallback to basic feedback if AI generation fails
    const strengths = ['Participated in voice interview'];
    const areasForImprovement = ['Consider providing more detailed responses'];
    
    feedbackData.totalScore = 70; // Default score
    feedbackData.categoryScores = [
      { name: 'Communication Skills', score: 70, comment: 'Basic communication skills demonstrated' },
      { name: 'Technical Knowledge', score: 70, comment: 'Some technical knowledge demonstrated' },
      { name: 'Problem Solving', score: 70, comment: 'Basic problem-solving approach' },
      { name: 'Cultural Fit', score: 70, comment: 'Potential fit with company culture' },
      { name: 'Confidence and Clarity', score: 70, comment: 'Moderate confidence in responses' }
    ];
    feedbackData.strengths = strengths;
    feedbackData.areasForImprovement = areasForImprovement;
    feedbackData.finalAssessment = `Scored 70/100 on the voice interview round. ${strengths.join(', ')}. Areas for improvement: ${areasForImprovement.join(', ')}.`;
    
    return feedbackData;
  }
}

// Generate AI feedback for coding questions
async function generateCodingFeedback(feedbackData: any, answers: UserAnswer[], round: Round): Promise<any> {
  // This would integrate with AI to analyze code quality
  // For now, we'll create a basic structure
  
  const strengths = [];
  const areasForImprovement = [];
  
  // Analyze code submissions
  if (answers.length > 0) {
    strengths.push('Attempted coding problems');
    if (feedbackData.totalScore >= 80) {
      strengths.push('Strong problem-solving skills');
      strengths.push('Good code implementation');
    } else if (feedbackData.totalScore >= 60) {
      areasForImprovement.push('Focus on algorithm optimization');
      areasForImprovement.push('Practice edge case handling');
    } else {
      areasForImprovement.push('Review fundamental algorithms');
      areasForImprovement.push('Practice coding problems regularly');
    }
  }

  feedbackData.categoryScores = [
    { name: 'Coding', score: feedbackData.totalScore, comment: 'Performance on coding problems' }
  ];
  
  feedbackData.strengths = strengths;
  feedbackData.areasForImprovement = areasForImprovement;
  feedbackData.finalAssessment = `Scored ${feedbackData.totalScore}/100 on the ${round.name} round. ${strengths.length > 0 ? `Strengths: ${strengths.join(', ')}.` : ''} ${areasForImprovement.length > 0 ? `Areas for improvement: ${areasForImprovement.join(', ')}.` : ''}`;

  return feedbackData;
}
