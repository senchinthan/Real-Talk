import { db } from "@/firebase/admin";
import { firestore } from "firebase-admin";
import { getCompanyTemplateById } from "./company.action";

// Import types from the global namespace
type QuestionBank = {
  id: string;
  name: string;
  description: string;
  type: 'aptitude' | 'coding' | 'text';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  createdAt: string;
  updatedAt?: string;
  questionIds: string[];
  isActive: boolean;
};

type AptitudeQuestionBank = QuestionBank & {
  type: 'aptitude';
  questions?: Question[];
};

type CodingQuestionBank = QuestionBank & {
  type: 'coding';
  questions?: Question[];
};

type TextQuestionBank = QuestionBank & {
  type: 'text';
  questions?: Question[];
};

type Question = {
  id: string;
  text: string;
  type: 'mcq' | 'text' | 'code';
  options?: string[];
  correctAnswer?: string | number;
  testCases?: TestCase[];
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
};

type TestCase = {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
};

// Get all aptitude question banks
export async function getAptitudeQuestionBanks(): Promise<AptitudeQuestionBank[]> {
  try {
    const snapshot = await db.collection('aptitudeQuestionBanks').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AptitudeQuestionBank[];
  } catch (error) {
    console.error('Error fetching aptitude question banks:', error);
    return [];
  }
}

// Get a specific aptitude question bank by ID
export async function getAptitudeQuestionBankById(bankId: string): Promise<AptitudeQuestionBank | null> {
  try {
    const doc = await db.collection('aptitudeQuestionBanks').doc(bankId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const bank = {
      id: doc.id,
      ...doc.data()
    } as AptitudeQuestionBank;
    
    // Fetch the questions if questionIds exist
    if (bank.questionIds && bank.questionIds.length > 0) {
      const questions: Question[] = [];
      
      // Get each question by its document ID
      for (const questionId of bank.questionIds) {
        try {
          const questionDoc = await db.collection('aptitudeQuestions').doc(questionId).get();
          
          if (questionDoc.exists) {
            questions.push({
              id: questionDoc.id,
              ...questionDoc.data()
            } as Question);
          } else {
            console.log(`Question ${questionId} not found`);
          }
        } catch (err) {
          console.error(`Error fetching question ${questionId}:`, err);
        }
      }
      
      bank.questions = questions;
    }
    
    return bank;
  } catch (error) {
    console.error('Error fetching aptitude question bank:', error);
    return null;
  }
}

// Get all text question banks
export async function getTextQuestionBanks(): Promise<TextQuestionBank[]> {
  try {
    const snapshot = await db.collection('textQuestionBanks').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TextQuestionBank[];
  } catch (error) {
    console.error('Error fetching text question banks:', error);
    return [];
  }
}

// Get a specific text question bank by ID
export async function getTextQuestionBankById(bankId: string): Promise<TextQuestionBank | null> {
  try {
    const doc = await db.collection('textQuestionBanks').doc(bankId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const bank = {
      id: doc.id,
      ...doc.data()
    } as TextQuestionBank;
    
    // Fetch the questions if questionIds exist
    if (bank.questionIds && bank.questionIds.length > 0) {
      const questions: Question[] = [];
      
      // Get each question by its document ID
      for (const questionId of bank.questionIds) {
        try {
          const questionDoc = await db.collection('textQuestions').doc(questionId).get();
          
          if (questionDoc.exists) {
            questions.push({
              id: questionDoc.id,
              ...questionDoc.data()
            } as Question);
          } else {
            console.log(`Question ${questionId} not found`);
          }
        } catch (err) {
          console.error(`Error fetching question ${questionId}:`, err);
        }
      }
      
      bank.questions = questions;
    }
    
    return bank;
  } catch (error) {
    console.error('Error fetching text question bank:', error);
    return null;
  }
}

// Get all coding question banks
export async function getCodingQuestionBanks(): Promise<CodingQuestionBank[]> {
  try {
    const snapshot = await db.collection('codingQuestionBanks').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CodingQuestionBank[];
  } catch (error) {
    console.error('Error fetching coding question banks:', error);
    return [];
  }
}

// Get a specific coding question bank by ID
// Load questions for a specific round based on its questionBankId
export async function loadQuestionsForRound(round: any): Promise<Question[]> {
  // If the round already has questions, return them
  if (round.questions && round.questions.length > 0 && 
      (typeof round.questions[0] !== 'string' || round.questions[0].includes('default-'))) {
    console.log(`Round ${round.name} already has ${round.questions.length} questions`);
    return round.questions as Question[];
  }
  
  // Special handling for voice interviews
  if (round.type === 'voice') {
    console.log(`Loading voice interview questions for round ${round.id}`);
    
    // Get the template ID from the round or use a default
    const templateId = round.templateId || (round.interviewId || 'default');
    
    // Load voice questions
    const voiceQuestions = await loadVoiceQuestionsForRound(templateId, round.id);
    
    // Convert string questions to Question objects
    return voiceQuestions.map((text: string, index: number) => ({
      id: `voice-${round.id}-${index}`,
      text,
      type: 'text',
      points: 1
    }));
  }
  
  // If the round has a questionBankId, load questions from the bank
  if (round.questionBankId) {
    let questionBank = null;
    
    // Load the appropriate question bank based on round type
    if (round.type === 'aptitude') {
      console.log(`Loading aptitude question bank: ${round.questionBankId}`);
      questionBank = await getAptitudeQuestionBankById(round.questionBankId);
    } else if (round.type === 'code') {
      console.log(`Loading coding question bank: ${round.questionBankId}`);
      questionBank = await getCodingQuestionBankById(round.questionBankId);
    } else if (round.type === 'text') {
      console.log(`Loading text question bank: ${round.questionBankId}`);
      questionBank = await getTextQuestionBankById(round.questionBankId);
    }
    
    // If we found the question bank and it has questions
    if (questionBank && questionBank.questions && questionBank.questions.length > 0) {
      // Use the specified number of questions or all questions if not specified
      const questionCount = round.questionCount || questionBank.questions.length;
      console.log(`Found ${questionBank.questions.length} questions in bank, using ${questionCount}`);
      
      // Get a random subset of questions if there are more questions than needed
      const selectedQuestions = questionBank.questions.length > questionCount
        ? getRandomQuestions(questionBank.questions, questionCount)
        : questionBank.questions;
      
      console.log(`Loaded ${selectedQuestions.length} questions for round ${round.name}`);
      return selectedQuestions;
    } else {
      // If no questions found, return a default question
      console.error(`No questions found for bank ID: ${round.questionBankId}`);
      return [{
        id: `default-${Date.now()}`,
        text: `This is a default question for ${round.name}. No questions were found in the question bank.`,
        type: 'text',
        points: 1
      }];
    }
  }
  
  // If the round has neither questions nor a questionBankId, return a default question
  console.log(`Round ${round.name} has no questions and no questionBankId`);
  return [{
    id: `default-${Date.now()}`,
    text: `This is a default question for ${round.name}. No question bank was specified.`,
    type: 'text',
    points: 1
  }];
}

// Helper function to get random questions from an array
function getRandomQuestions<T>(questions: T[], count: number): T[] {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function getCodingQuestionBankById(bankId: string): Promise<CodingQuestionBank | null> {
  try {
    const doc = await db.collection('codingQuestionBanks').doc(bankId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const bank = {
      id: doc.id,
      ...doc.data()
    } as CodingQuestionBank;
    
    // Fetch the questions if questionIds exist
    if (bank.questionIds && bank.questionIds.length > 0) {
      const questions: Question[] = [];
      
      // Get each question by its document ID
      for (const questionId of bank.questionIds) {
        try {
          const questionDoc = await db.collection('codingQuestions').doc(questionId).get();
          
          if (questionDoc.exists) {
            questions.push({
              id: questionDoc.id,
              ...questionDoc.data()
            } as Question);
          } else {
            console.log(`Question ${questionId} not found`);
          }
        } catch (err) {
          console.error(`Error fetching question ${questionId}:`, err);
        }
      }
      
      bank.questions = questions;
    }
    
    return bank;
  } catch (error) {
    console.error('Error fetching coding question bank:', error);
    return null;
  }
}

// Create a new aptitude question bank
export async function createAptitudeQuestionBank(bankData: {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  isActive?: boolean;
}): Promise<{ success: boolean; bankId?: string; error?: string }> {
  try {
    // Create the question bank document
    const docRef = await db.collection('aptitudeQuestionBanks').add({
      ...bankData,
      type: 'aptitude',
      questionIds: [],
      createdAt: new Date().toISOString(),
      isActive: bankData.isActive ?? true
    });
    
    return { 
      success: true, 
      bankId: docRef.id 
    };
  } catch (error) {
    console.error('Error creating aptitude question bank:', error);
    return {
      success: false,
      error: 'Failed to create aptitude question bank'
    };
  }
}

// Create a new text question bank
export async function createTextQuestionBank(bankData: {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  isActive?: boolean;
}): Promise<{ success: boolean; bankId?: string; error?: string }> {
  try {
    // Create the question bank document
    const docRef = await db.collection('textQuestionBanks').add({
      ...bankData,
      type: 'text',
      questionIds: [],
      createdAt: new Date().toISOString(),
      isActive: bankData.isActive ?? true
    });
    
    return { 
      success: true, 
      bankId: docRef.id 
    };
  } catch (error) {
    console.error('Error creating text question bank:', error);
    return {
      success: false,
      error: 'Failed to create text question bank'
    };
  }
}

// Create a new coding question bank
export async function createCodingQuestionBank(bankData: {
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  isActive?: boolean;
}): Promise<{ success: boolean; bankId?: string; error?: string }> {
  try {
    // Create the question bank document
    const docRef = await db.collection('codingQuestionBanks').add({
      ...bankData,
      type: 'coding',
      questionIds: [],
      createdAt: new Date().toISOString(),
      isActive: bankData.isActive ?? true
    });
    
    return { 
      success: true, 
      bankId: docRef.id 
    };
  } catch (error) {
    console.error('Error creating coding question bank:', error);
    return {
      success: false,
      error: 'Failed to create coding question bank'
    };
  }
}

// Update an aptitude question bank
export async function updateAptitudeQuestionBank(bankId: string, bankData: Partial<AptitudeQuestionBank>): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the bank exists
    const bankDoc = await db.collection('aptitudeQuestionBanks').doc(bankId).get();
    
    if (!bankDoc.exists) {
      return { success: false, error: 'Question bank not found' };
    }
    
    // Remove id and type from the data to be updated (if present)
    const { id, type, questions, ...dataToUpdate } = bankData;
    
    // Add updatedAt timestamp
    const updateData = {
      ...dataToUpdate,
      updatedAt: new Date().toISOString()
    };
    
    // Update the bank document
    await db.collection('aptitudeQuestionBanks').doc(bankId).update(updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating aptitude question bank:', error);
    return {
      success: false,
      error: 'Failed to update aptitude question bank'
    };
  }
}

// Delete an aptitude question bank
export async function deleteAptitudeQuestionBank(bankId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the bank exists
    const bankDoc = await db.collection('aptitudeQuestionBanks').doc(bankId).get();
    
    if (!bankDoc.exists) {
      return { success: false, error: 'Question bank not found' };
    }
    
    // Delete the bank document
    await db.collection('aptitudeQuestionBanks').doc(bankId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting aptitude question bank:', error);
    return {
      success: false,
      error: 'Failed to delete aptitude question bank'
    };
  }
}

// Delete a text question bank
export async function deleteTextQuestionBank(bankId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the bank exists
    const bankDoc = await db.collection('textQuestionBanks').doc(bankId).get();
    
    if (!bankDoc.exists) {
      return { success: false, error: 'Question bank not found' };
    }
    
    // Delete the bank document
    await db.collection('textQuestionBanks').doc(bankId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting text question bank:', error);
    return {
      success: false,
      error: 'Failed to delete text question bank'
    };
  }
}

// Delete a coding question bank
export async function deleteCodingQuestionBank(bankId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the bank exists
    const bankDoc = await db.collection('codingQuestionBanks').doc(bankId).get();
    
    if (!bankDoc.exists) {
      return { success: false, error: 'Question bank not found' };
    }
    
    // Delete the bank document
    await db.collection('codingQuestionBanks').doc(bankId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting coding question bank:', error);
    return {
      success: false,
      error: 'Failed to delete coding question bank'
    };
  }
}

// Get a question by ID from any question collection
export async function getQuestionById(questionId: string): Promise<Question | null> {
  try {
    // Try to find the question in each collection
    const collections = ['aptitudeQuestions', 'codingQuestions', 'textQuestions'];
    
    for (const collection of collections) {
      const questionDoc = await db.collection(collection).doc(questionId).get();
      
      if (questionDoc.exists) {
        return {
          id: questionDoc.id,
          ...questionDoc.data()
        } as Question;
      }
    }
    
    // If we get here, the question wasn't found in any collection
    console.log(`Question ${questionId} not found in any collection`);
    return null;
  } catch (error) {
    console.error('Error getting question by ID:', error);
    return null;
  }
}

// Add a question to an aptitude question bank
export async function addQuestionToAptitudeBank(
  bankId: string, 
  questionData: string | Question
): Promise<{ success: boolean; questionId?: string; error?: string }> {
  try {
    const bankRef = db.collection('aptitudeQuestionBanks').doc(bankId);
    
    // Get the current bank data
    const bankDoc = await bankRef.get();
    if (!bankDoc.exists) {
      return { success: false, error: 'Question bank not found' };
    }
    
    const bankData = bankDoc.data() as AptitudeQuestionBank;
    const questionIds = bankData.questionIds || [];
    
    let questionIdToAdd: string;
    
    // If questionData is a string, it's an existing question ID
    if (typeof questionData === 'string') {
      // Check if question already exists in the bank
      if (questionIds.includes(questionData)) {
        return { success: false, error: 'Question already exists in this bank' };
      }
      
      // Verify the question exists
      const questionDoc = await db.collection('aptitudeQuestions').doc(questionData).get();
      if (!questionDoc.exists) {
        return { success: false, error: 'Question not found' };
      }
      questionIdToAdd = questionData;
    } else {
      // It's a new question object, create it first
      const questionRef = await db.collection('aptitudeQuestions').add({
        ...questionData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      questionIdToAdd = questionRef.id;
    }
    
    
    // Update the bank with the new question ID
    await bankRef.update({
      questionIds: [...questionIds, questionIdToAdd],
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, questionId: questionIdToAdd };
  } catch (error) {
    console.error('Error adding question to aptitude bank:', error);
    return { success: false, error: 'Failed to add question to bank' };
  }
}

// Remove a question from an aptitude question bank
export async function removeQuestionFromAptitudeBank(
  bankId: string, 
  questionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const bankRef = db.collection('aptitudeQuestionBanks').doc(bankId);
    
    // Get the current bank data
    const bankDoc = await bankRef.get();
    if (!bankDoc.exists) {
      return { success: false, error: 'Question bank not found' };
    }
    
    const bankData = bankDoc.data() as AptitudeQuestionBank;
    const questionIds = bankData.questionIds || [];
    
    // Check if question exists in the bank
    const questionIndex = questionIds.indexOf(questionId);
    if (questionIndex === -1) {
      return { success: false, error: 'Question not found in this bank' };
    }
    
    // Remove the question ID from the array
    const updatedQuestionIds = [...questionIds];
    updatedQuestionIds.splice(questionIndex, 1);
    
    // Update the bank with the modified question IDs
    await bankRef.update({
      questionIds: updatedQuestionIds,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error removing question from aptitude bank:', error);
    return { success: false, error: 'Failed to remove question from bank' };
  }
}

// Update a question in any question collection
export async function updateQuestion(questionId: string, questionData: Partial<Question>): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to find the question in each collection
    const collections = ['aptitudeQuestions', 'codingQuestions', 'textQuestions'];
    
    for (const collection of collections) {
      const questionDoc = await db.collection(collection).doc(questionId).get();
      
      if (questionDoc.exists) {
        // Remove id from the data to be updated (if present)
        const { id, ...dataToUpdate } = questionData;
        
        // Add updatedAt timestamp
        const updateData = {
          ...dataToUpdate,
          updatedAt: new Date().toISOString()
        };
        
        await db.collection(collection).doc(questionId).update(updateData);
        
        console.log(`Updated question ${questionId} in collection ${collection}`);
        return { success: true };
      }
    }
    
    // If we get here, the question wasn't found in any collection
    return { 
      success: false, 
      error: `Question ${questionId} not found in any collection` 
    };
  } catch (error) {
    console.error('Error updating question:', error);
    return { 
      success: false, 
      error: 'Failed to update question' 
    };
  }
}

// Load voice interview questions for a company round
export async function loadVoiceQuestionsForRound(templateId: string, roundId: string): Promise<string[]> {
  try {
    console.log(`Loading voice questions for templateId: ${templateId}, roundId: ${roundId}`);
    
    // Get the template to find the round and its promptTemplateId
    const template = await getCompanyTemplateById(templateId);
    if (template) {
      const round = template.rounds.find((r: any) => r.id === roundId);
      if (round && round.promptTemplateId) {
        try {
          // Get questions directly from the promptTemplate document
          const promptTemplateDoc = await db.collection('promptTemplates').doc(round.promptTemplateId).get();
          if (promptTemplateDoc.exists) {
            const promptTemplate = promptTemplateDoc.data();
            if (promptTemplate && promptTemplate.generatedQuestions && promptTemplate.generatedQuestions.length > 0) {
              console.log(`Found ${promptTemplate.generatedQuestions.length} questions in promptTemplate ${round.promptTemplateId}`);
              return promptTemplate.generatedQuestions;
            }
          }
        } catch (error) {
          console.error(`Error fetching prompt template: ${error}`);
        }
      } else {
        console.log(`No promptTemplateId found for round ${roundId}`);
      }
    } else {
      console.log(`Template ${templateId} not found`);
    }
    
    // If no questions found, return default questions
    console.log(`No questions found for voice round ${roundId}, returning default questions`);
    return [
      "Tell me about your background and experience.",
      "What are your strengths and weaknesses?",
      "Why are you interested in this role?",
      "Describe a challenging project you worked on.",
      "Do you have any questions for me?"
    ];
  } catch (error) {
    console.error('Error loading voice questions:', error);
    return [
      "Tell me about your background and experience.",
      "What are your strengths and weaknesses?",
      "Why are you interested in this role?",
      "Describe a challenging project you worked on.",
      "Do you have any questions for me?"
    ];
  }
}
