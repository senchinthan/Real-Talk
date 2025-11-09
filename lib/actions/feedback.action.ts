import { db } from '@/firebase/admin';
import { CompanyFeedback, RoundFeedback, Round, UserAnswer } from '@/types';
import { getCompanyInterviewById, getCompanyTemplateById } from './company.action';

// Create round feedback for aptitude or coding rounds
export async function createRoundFeedback(params: {
  interviewId: string;
  userId: string;
  templateId: string;
  roundId: string;
  roundName: string;
  roundType: string;
  answers: UserAnswer[];
  score: number;
}): Promise<{ success: boolean; feedbackId?: string; error?: string; isUpdate?: boolean }> {
  try {
    const { interviewId, userId, templateId, roundId, roundName, roundType, answers, score } = params;

    // Get the round details to determine passing score
    const interview = await getCompanyInterviewById(interviewId);
    if (!interview) {
      return { success: false, error: 'Interview not found' };
    }

    // Get the template to find the round
    const template = await getCompanyTemplateById(interview.templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    const round = template.rounds.find((r: Round) => r.id === roundId);
    if (!round) {
      return { success: false, error: 'Round not found' };
    }

    // Determine if the user passed based on the passing score
    const passingScore = round.passingScore || 70; // Default passing score is 70%
    const passed = score >= passingScore;

    // Check if there's existing feedback for this round
    const existingFeedbackQuery = await db.collection('roundFeedback')
      .where('interviewId', '==', interviewId)
      .where('userId', '==', userId)
      .where('roundId', '==', roundId)
      .get();

    let feedbackId;
    let attemptNumber = 1;
    let isUpdate = false;

    if (!existingFeedbackQuery.empty) {
      // Found existing feedback, update it
      const existingDoc = existingFeedbackQuery.docs[0];
      feedbackId = existingDoc.id;
      const existingData = existingDoc.data();
      attemptNumber = (existingData.attempt || 1) + 1;
      isUpdate = true;
      
      console.log(`Found existing feedback with ID: ${feedbackId}, updating as attempt #${attemptNumber}...`);
      
      // Update the existing document
      await db.collection('roundFeedback').doc(feedbackId).update({
        score,
        passed,
        answers,
        attempt: attemptNumber,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Updated existing feedback with ID: ${feedbackId}`);
    } else {
      // Create the round feedback document
      const roundFeedback: Omit<RoundFeedback, 'id'> = {
        interviewId,
        userId,
        templateId,
        roundId,
        roundName,
        roundType,
        attempt: attemptNumber,
        score,
        passingScore,
        passed,
        answers,
        createdAt: new Date().toISOString()
      };

      // Save to roundFeedback collection
      const docRef = await db.collection('roundFeedback').add(roundFeedback);
      feedbackId = docRef.id;
      console.log(`Round feedback created with ID: ${feedbackId}`);
    }
    
    // Update the company feedback
    await updateCompanyFeedback(interviewId, userId, templateId);
    
    return { 
      success: true, 
      feedbackId,
      isUpdate
    };
  } catch (error) {
    console.error('Error creating round feedback:', error);
    return { success: false, error: 'Failed to create round feedback' };
  }
}

// Get round feedback for a specific round
export async function getRoundFeedback(interviewId: string, roundId: string, userId: string): Promise<RoundFeedback | null> {
  try {
    const feedback = await db
      .collection('roundFeedback')
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

// Get all round feedback for an interview
export async function getAllRoundFeedback(interviewId: string, userId: string): Promise<RoundFeedback[]> {
  try {
    const feedback = await db
      .collection('roundFeedback')
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

// Update or create company feedback based on round feedback
export async function updateCompanyFeedback(interviewId: string, userId: string, templateId: string): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
  try {
    // Get all round feedback for this interview
    const roundFeedbacks = await getAllRoundFeedback(interviewId, userId);
    
    if (roundFeedbacks.length === 0) {
      return { success: false, error: 'No round feedback found' };
    }

    // Get the interview details
    const interview = await getCompanyInterviewById(interviewId);
    if (!interview) {
      return { success: false, error: 'Interview not found' };
    }

    // Get the template to find all rounds
    const template = await getCompanyTemplateById(templateId);
    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Calculate average score from round feedback
    const totalScore = roundFeedbacks.reduce((sum, feedback) => sum + feedback.score, 0);
    const averageScore = Math.round(totalScore / roundFeedbacks.length);

    // Get unique rounds (latest attempt for each round)
    const roundMap = new Map<string, RoundFeedback>();
    roundFeedbacks.forEach(feedback => {
      if (!roundMap.has(feedback.roundId) || 
          (feedback.attempt || 0) > (roundMap.get(feedback.roundId)?.attempt || 0)) {
        roundMap.set(feedback.roundId, feedback);
      }
    });

    const uniqueRounds = Array.from(roundMap.values());
    
    // Generate strengths and areas for improvement based on round performance
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];

    // Count passed rounds
    const passedRounds = uniqueRounds.filter(r => r.passed).length;
    const totalRounds = uniqueRounds.length;
    
    // Add general feedback based on performance
    if (passedRounds === totalRounds && totalRounds > 0) {
      strengths.push('Successfully passed all completed rounds');
    } else if (passedRounds > 0) {
      strengths.push(`Passed ${passedRounds} out of ${totalRounds} completed rounds`);
      areasForImprovement.push('Focus on improving performance in failed rounds');
    } else if (totalRounds > 0) {
      areasForImprovement.push('Work on improving skills across all rounds');
    }

    // Add specific feedback based on round types
    const aptitudeRounds = uniqueRounds.filter(r => r.roundType === 'aptitude');
    const codingRounds = uniqueRounds.filter(r => r.roundType === 'code');
    const voiceRounds = uniqueRounds.filter(r => r.roundType === 'voice');
    
    if (aptitudeRounds.length > 0) {
      const avgAptitudeScore = aptitudeRounds.reduce((sum, r) => sum + r.score, 0) / aptitudeRounds.length;
      if (avgAptitudeScore >= 80) {
        strengths.push('Strong aptitude skills demonstrated');
      } else if (avgAptitudeScore < 60) {
        areasForImprovement.push('Focus on improving aptitude fundamentals');
      }
    }
    
    if (codingRounds.length > 0) {
      const avgCodingScore = codingRounds.reduce((sum, r) => sum + r.score, 0) / codingRounds.length;
      if (avgCodingScore >= 80) {
        strengths.push('Strong coding skills demonstrated');
      } else if (avgCodingScore < 60) {
        areasForImprovement.push('Practice coding problems to improve implementation skills');
      }
    }

    // Format round scores for company feedback
    const roundScores = uniqueRounds.map(feedback => ({
      roundId: feedback.roundId,
      roundName: feedback.roundName,
      roundType: feedback.roundType,
      score: feedback.score,
      passed: feedback.passed
    }));

    // Create final assessment
    const finalAssessment = `Completed ${totalRounds} rounds with an average score of ${averageScore}/100. ${passedRounds} rounds passed out of ${totalRounds} completed.`;

    // Create or update company feedback
    const companyFeedback: Omit<CompanyFeedback, 'id'> = {
      interviewId,
      userId,
      templateId,
      companyName: template.companyName,
      totalRounds: template.rounds.length,
      completedRounds: totalRounds,
      averageScore,
      roundScores,
      strengths,
      areasForImprovement,
      finalAssessment,
      createdAt: new Date().toISOString()
    };

    // Check if company feedback already exists
    const existingFeedback = await db
      .collection('companyFeedback')
      .where('interviewId', '==', interviewId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    let feedbackId: string;
    
    if (existingFeedback.empty) {
      // Create new company feedback
      const docRef = await db.collection('companyFeedback').add(companyFeedback);
      feedbackId = docRef.id;
      console.log(`Company feedback created with ID: ${feedbackId}`);
    } else {
      // Update existing company feedback
      feedbackId = existingFeedback.docs[0].id;
      await db.collection('companyFeedback').doc(feedbackId).update(companyFeedback);
      console.log(`Company feedback updated with ID: ${feedbackId}`);
    }

    return {
      success: true,
      feedbackId
    };
  } catch (error) {
    console.error('Error updating company feedback:', error);
    return { success: false, error: 'Failed to update company feedback' };
  }
}

// Get company feedback for an interview
export async function getCompanyFeedback(interviewId: string, userId: string): Promise<CompanyFeedback | null> {
  try {
    const feedback = await db
      .collection('companyFeedback')
      .where('interviewId', '==', interviewId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (feedback.empty) {
      return null;
    }

    const feedbackDoc = feedback.docs[0];
    return {
      id: feedbackDoc.id,
      ...feedbackDoc.data()
    } as CompanyFeedback;
  } catch (error) {
    console.error('Error fetching company feedback:', error);
    return null;
  }
}
