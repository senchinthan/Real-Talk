import { db } from "@/firebase/admin";
import { Question, TestCase } from "@/types";

// Get all coding questions
export async function getCodingQuestions(): Promise<Question[]> {
  try {
    const snapshot = await db.collection('codingQuestions').orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Question[];
  } catch (error) {
    console.error('Error fetching coding questions:', error);
    return [];
  }
}

// Get a specific coding question by ID
export async function getCodingQuestionById(questionId: string): Promise<Question | null> {
  try {
    const doc = await db.collection('codingQuestions').doc(questionId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    } as Question;
  } catch (error) {
    console.error('Error fetching coding question:', error);
    return null;
  }
}

// Create a new coding question
export async function createCodingQuestion(question: Omit<Question, 'id'>): Promise<{ success: boolean; questionId?: string; error?: string }> {
  try {
    const docRef = await db.collection('codingQuestions').add({
      ...question,
      type: 'code', // Ensure type is set to 'code'
      createdAt: new Date().toISOString()
    });
    
    return {
      success: true,
      questionId: docRef.id
    };
  } catch (error) {
    console.error('Error creating coding question:', error);
    return {
      success: false,
      error: 'Failed to create coding question'
    };
  }
}

// Update a coding question
export async function updateCodingQuestion(questionId: string, question: Partial<Question>): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection('codingQuestions').doc(questionId).update({
      ...question,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating coding question:', error);
    return {
      success: false,
      error: 'Failed to update coding question'
    };
  }
}

// Delete a coding question
export async function deleteCodingQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection('codingQuestions').doc(questionId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting coding question:', error);
    return {
      success: false,
      error: 'Failed to delete coding question'
    };
  }
}

// Get random coding questions for a round
export async function getRandomCodingQuestions(count: number, difficulty?: 'easy' | 'medium' | 'hard'): Promise<Question[]> {
  try {
    let query = db.collection('codingQuestions');
    
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
    console.error('Error fetching random coding questions:', error);
    return [];
  }
}
