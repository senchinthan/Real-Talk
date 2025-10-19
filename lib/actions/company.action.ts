import { db } from "@/firebase/admin";
import { companyTemplates } from "@/constants/companyTemplates";

// Get all active company templates
export async function getCompanyTemplates(): Promise<CompanyTemplate[]> {
  try {
    // For now, return the predefined templates
    // In the future, this could fetch from Firestore
    return companyTemplates.filter(template => template.isActive);
  } catch (error) {
    console.error('Error fetching company templates:', error);
    return [];
  }
}

// Get a specific company template by ID
export async function getCompanyTemplateById(templateId: string): Promise<CompanyTemplate | null> {
  try {
    const templates = await getCompanyTemplates();
    return templates.find(template => template.id === templateId) || null;
  } catch (error) {
    console.error('Error fetching company template:', error);
    return null;
  }
}

// Create a new company interview instance
export async function createCompanyInterview(userId: string, templateId: string): Promise<{ success: boolean; interviewId?: string; error?: string }> {
  try {
    const template = await getCompanyTemplateById(templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    const companyInterview: CompanyInterview = {
      id: '', // Will be set by Firestore
      templateId,
      companyName: template.companyName,
      userId,
      createdAt: new Date().toISOString(),
      completedRounds: []
    };

    const docRef = await db.collection('companyInterviews').add(companyInterview);
    
    return { 
      success: true, 
      interviewId: docRef.id 
    };
  } catch (error) {
    console.error('Error creating company interview:', error);
    return { success: false, error: 'Failed to create company interview' };
  }
}

// Get all company interviews for a user
export async function getCompanyInterviewsByUserId(userId: string): Promise<CompanyInterview[]> {
  try {
    const interviews = await db
      .collection('companyInterviews')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as CompanyInterview[];
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

    return {
      id: interview.id,
      ...interview.data()
    } as CompanyInterview;
  } catch (error) {
    console.error('Error fetching company interview:', error);
    return null;
  }
}

// Mark a round as completed
export async function markRoundComplete(interviewId: string, roundId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const interview = await getCompanyInterviewById(interviewId);
    if (!interview) {
      return { success: false, error: 'Interview not found' };
    }

    const updatedCompletedRounds = [...interview.completedRounds];
    if (!updatedCompletedRounds.includes(roundId)) {
      updatedCompletedRounds.push(roundId);
    }

    await db.collection('companyInterviews').doc(interviewId).update({
      completedRounds: updatedCompletedRounds
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking round complete:', error);
    return { success: false, error: 'Failed to mark round complete' };
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
      if (!roundMap.has(feedback.roundId) || feedback.attempt > (roundMap.get(feedback.roundId)?.attempt || 0)) {
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
