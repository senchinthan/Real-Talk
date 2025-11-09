import { db } from "@/firebase/admin";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

// Interface for AI prompt templates
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

// Get all prompt templates
export async function getPromptTemplates(): Promise<PromptTemplate[]> {
  try {
    const snapshot = await db.collection('promptTemplates').orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PromptTemplate[];
  } catch (error) {
    console.error('Error fetching prompt templates:', error);
    return [];
  }
}

// Get a specific prompt template by ID
export async function getPromptTemplateById(templateId: string): Promise<PromptTemplate | null> {
  try {
    const doc = await db.collection('promptTemplates').doc(templateId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    } as PromptTemplate;
  } catch (error) {
    console.error('Error fetching prompt template:', error);
    return null;
  }
}

// Create a new prompt template
export async function createPromptTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt'>): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    // Add the template to the database
    const docRef = await db.collection('promptTemplates').add({
      ...template,
      createdAt: new Date().toISOString(),
      isActive: template.isActive ?? true
    });
    
    const templateId = docRef.id;
    
    // If this is a voice interview prompt template, automatically generate questions
    if (template.name.toLowerCase().includes('voice') || template.description.toLowerCase().includes('voice interview')) {
      console.log(`Automatically generating questions for voice interview prompt template: ${templateId}`);
      
      // Generate questions asynchronously (don't await to avoid blocking)
      generateVoiceInterviewQuestions(templateId)
        .then(result => {
          if (result.success) {
            console.log(`Successfully generated ${result.questions?.length} questions for prompt template ${templateId}`);
          } else {
            console.error(`Failed to generate questions for prompt template ${templateId}: ${result.error}`);
          }
        })
        .catch(error => {
          console.error(`Error generating questions for prompt template ${templateId}:`, error);
        });
    }
    
    return {
      success: true,
      templateId
    };
  } catch (error) {
    console.error('Error creating prompt template:', error);
    return {
      success: false,
      error: 'Failed to create prompt template'
    };
  }
}

// Update a prompt template
export async function updatePromptTemplate(templateId: string, template: Partial<PromptTemplate>): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the prompt text was updated
    const promptUpdated = template.prompt !== undefined;
    
    // Update the template in the database
    await db.collection('promptTemplates').doc(templateId).update({
      ...template,
      updatedAt: new Date().toISOString()
    });
    
    // If the prompt was updated and this is a voice interview template, regenerate questions
    if (promptUpdated) {
      // Get the updated template to check if it's for voice interviews
      const updatedDoc = await db.collection('promptTemplates').doc(templateId).get();
      if (updatedDoc.exists) {
        const updatedTemplate = updatedDoc.data() as PromptTemplate;
        
        if (updatedTemplate.name.toLowerCase().includes('voice') || 
            updatedTemplate.description.toLowerCase().includes('voice interview')) {
          console.log(`Prompt updated for voice interview template ${templateId}, regenerating questions`);
          
          // Regenerate questions asynchronously
          generateVoiceInterviewQuestions(templateId)
            .then(result => {
              if (result.success) {
                console.log(`Successfully regenerated ${result.questions?.length} questions for prompt template ${templateId}`);
              } else {
                console.error(`Failed to regenerate questions for prompt template ${templateId}: ${result.error}`);
              }
            })
            .catch(error => {
              console.error(`Error regenerating questions for prompt template ${templateId}:`, error);
            });
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating prompt template:', error);
    return {
      success: false,
      error: 'Failed to update prompt template'
    };
  }
}

// Delete a prompt template
export async function deletePromptTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.collection('promptTemplates').doc(templateId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting prompt template:', error);
    return {
      success: false,
      error: 'Failed to delete prompt template'
    };
  }
}

// Generate voice interview questions for a prompt template
export async function generateVoiceInterviewQuestions(promptTemplateId: string): Promise<{ success: boolean; questions?: string[]; error?: string }> {
  try {
    // Get the prompt template
    const promptTemplateDoc = await db.collection('promptTemplates').doc(promptTemplateId).get();
    
    if (!promptTemplateDoc.exists) {
      return { success: false, error: 'Prompt template not found' };
    }
    
    const promptTemplate = promptTemplateDoc.data() as PromptTemplate;
    const prompt = promptTemplate.prompt;
    
    if (!prompt) {
      return { success: false, error: 'Prompt template has no prompt text' };
    }
    
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

    // Update the prompt template with the generated questions
    await db.collection('promptTemplates').doc(promptTemplateId).update({
      generatedQuestions: questions,
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`Generated ${questions.length} questions for prompt template ${promptTemplateId}`);
    
    return {
      success: true,
      questions
    };
  } catch (error) {
    console.error('Error generating voice interview questions:', error);
    return {
      success: false,
      error: 'Failed to generate voice interview questions'
    };
  }
}

// Generate interview questions using Gemini AI
export async function generateInterviewQuestions(
  params: {
    promptTemplate: string;
    role?: string;
    level?: string;
    techstack?: string;
    amount?: number;
    customData?: Record<string, string>;
  }
): Promise<{ success: boolean; questions?: string[]; error?: string }> {
  try {
    const { promptTemplate, role, level, techstack, amount = 5, customData = {} } = params;
    
    // Replace placeholders in the template
    let finalPrompt = promptTemplate
      .replace(/\{role\}/g, role || '')
      .replace(/\{level\}/g, level || '')
      .replace(/\{techstack\}/g, techstack || '')
      .replace(/\{amount\}/g, amount.toString());
    
    // Replace any custom placeholders
    Object.entries(customData).forEach(([key, value]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    
    // Generate questions using Gemini
    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: finalPrompt,
    });
    
    // Parse the response to extract questions
    let questions: string[];
    try {
      questions = JSON.parse(text);
    } catch (e) {
      // If parsing fails, try to extract questions using regex
      const matches = text.match(/"([^"]+)"/g);
      if (matches) {
        questions = matches.map(m => m.replace(/^"|"$/g, ''));
      } else {
        // Split by newlines and clean up
        questions = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith(']'));
      }
    }
    
    return {
      success: true,
      questions
    };
  } catch (error) {
    console.error('Error generating interview questions:', error);
    return {
      success: false,
      error: 'Failed to generate interview questions'
    };
  }
}
