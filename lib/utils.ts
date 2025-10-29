import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

const checkIconExists = async (url: string) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok; // Returns true if the icon exists
  } catch {
    return false;
  }
};

export const getTechLogos = async (techArray: string[]) => {
  const logoURLs = techArray.map((tech) => {
    const normalized = normalizeTechName(tech);
    return {
      tech,
      url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
    };
  });

  const results = await Promise.all(
    logoURLs.map(async ({ tech, url }) => ({
      tech,
      url: (await checkIconExists(url)) ? url : "/tech.svg",
    }))
  );

  return results;
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};

// Question format utilities
export function isNewQuestionFormat(questions: any[]): questions is Question[] {
  return questions.length > 0 && typeof questions[0] === 'object' && 'id' in questions[0];
}

export function convertLegacyQuestions(questions: string[]): Question[] {
  return questions.map((question, index) => ({
    id: `q-${index}`,
    text: question,
    type: 'text' as const,
    points: 1
  }));
}

// Scoring utilities
export function calculateAptitudeScore(answers: UserAnswer[], questions: Question[]): number {
  let totalScore = 0;
  let maxScore = 0;

  questions.forEach(question => {
    const userAnswer = answers.find(a => a.questionId === question.id);
    if (!userAnswer) return;

    maxScore += question.points || 1;

    if (question.type === 'mcq') {
      const correctIndex = typeof question.correctAnswer === 'number' 
        ? question.correctAnswer 
        : question.options?.indexOf(question.correctAnswer as string);
      
      if (userAnswer.answer === correctIndex) {
        totalScore += question.points || 1;
      }
    } else if (question.type === 'text') {
      // For text questions, we'll rely on AI analysis in the feedback API
      // This is just a placeholder for basic scoring
      totalScore += question.points || 1;
    }
  });

  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
}

// Judge0 language mapping
export function mapLanguageToJudge0(language: string): number {
  const languageMap: Record<string, number> = {
    'javascript': 63,
    'python': 71,
    'java': 62,
    'cpp': 54,
    'c': 50,
    'csharp': 51,
    'go': 60,
    'rust': 73,
    'php': 68,
    'ruby': 72,
    'swift': 83,
    'kotlin': 78,
    'typescript': 74,
    'scala': 81,
    'r': 80,
    'bash': 46,
    'sql': 82,
    'html': 47,
    'css': 48,
    'json': 45
  };

  return languageMap[language.toLowerCase()] || 63; // Default to JavaScript
}

export function getLanguageName(judge0Id: number): string {
  const reverseMap: Record<number, string> = {
    63: 'javascript',
    71: 'python',
    62: 'java',
    54: 'cpp',
    50: 'c',
    51: 'csharp',
    60: 'go',
    73: 'rust',
    68: 'php',
    72: 'ruby',
    83: 'swift',
    78: 'kotlin',
    74: 'typescript',
    81: 'scala',
    80: 'r',
    46: 'bash',
    82: 'sql',
    47: 'html',
    48: 'css',
    45: 'json'
  };

  return reverseMap[judge0Id] || 'javascript';
}
