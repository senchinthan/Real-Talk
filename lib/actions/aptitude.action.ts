import { db } from "@/firebase/admin";
import { Question } from "@/types";

// Get all aptitude questions
export async function getAptitudeQuestions(): Promise<Question[]> {
  try {
    const snapshot = await db.collection('aptitudeQuestions').orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Question[];
  } catch (error) {
    console.error('Error fetching aptitude questions:', error);
    return [];
  }
}

// Get a specific aptitude question by ID
export async function getAptitudeQuestionById(questionId: string): Promise<Question | null> {
  try {
    const doc = await db.collection('aptitudeQuestions').doc(questionId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    } as Question;
  } catch (error) {
    console.error('Error fetching aptitude question:', error);
    return null;
  }
}

// Create a new aptitude question
export async function createAptitudeQuestion(question: Omit<Question, 'id'>): Promise<{ success: boolean; questionId?: string; error?: string }> {
  try {
    const docRef = await db.collection('aptitudeQuestions').add({
      ...question,
      createdAt: new Date().toISOString()
    });
    
    return {
      success: true,
      questionId: docRef.id
    };
  } catch (error) {
    console.error('Error creating aptitude question:', error);
    return {
      success: false,
      error: 'Failed to create aptitude question'
    };
  }
}

// Update an aptitude question
export async function updateAptitudeQuestion(questionId: string, question: Partial<Question>): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection('aptitudeQuestions').doc(questionId).update({
      ...question,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating aptitude question:', error);
    return {
      success: false,
      error: 'Failed to update aptitude question'
    };
  }
}

// Delete an aptitude question
export async function deleteAptitudeQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection('aptitudeQuestions').doc(questionId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting aptitude question:', error);
    return {
      success: false,
      error: 'Failed to delete aptitude question'
    };
  }
}

// Get random aptitude questions for a round
export async function getRandomAptitudeQuestions(count: number, difficulty?: 'easy' | 'medium' | 'hard'): Promise<Question[]> {
  try {
    let query = db.collection('aptitudeQuestions');
    
    // Apply difficulty filter if provided
    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
    }
    
    const snapshot = await query.get();
    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Question[];
    
    // Shuffle and limit
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  } catch (error) {
    console.error('Error fetching random aptitude questions:', error);
    return [];
  }
}
