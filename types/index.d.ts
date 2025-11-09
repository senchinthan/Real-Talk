export interface Feedback {
  id: string;
  interviewId: string;
  userId: string;
  attempt?: number;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

export interface CompanyTemplate {
  id: string;
  companyName: string;
  companyLogo: string;
  description: string;
  rounds: Round[];
  isActive: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'text' | 'code';
  options?: string[];           // For MCQ
  correctAnswer?: string | number; // For MCQ (index) or text
  testCases?: TestCase[];       // For coding questions
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface Round {
  id: string;
  name: string; // "Aptitude", "Coding", "System Design", "Behavioral"
  type: "voice" | "text" | "code" | "aptitude";
  duration: number; // in minutes
  // New fields for question bank references
  questionBankId?: string; // ID of the question bank to use
  questionCount?: number; // Number of questions to use from the bank
  promptTemplateId?: string; // ID of the prompt template for voice/text interviews
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'; // Difficulty level
  questions?: Question[] | string[]; // For backward compatibility
  passingScore?: number;
}

export interface UserAnswer {
  questionId: string;
  answer: string | number;
  code?: string;
  language?: string;
  isCorrect?: boolean;
  score?: number;
}

export interface CompanyInterview {
  id: string;
  templateId: string;
  companyName: string;
  userId: string;
  createdAt: string;
  completedRounds: string[]; // array of round IDs
}

export interface RoundFeedback {
  id: string;
  interviewId: string;
  userId: string;
  templateId: string;
  roundId: string;
  roundName: string;
  roundType: string;
  attempt?: number;
  score: number;
  passingScore: number;
  passed: boolean;
  answers?: UserAnswer[];
  createdAt: string;
}

export interface CompanyFeedback {
  id: string;
  interviewId: string;
  userId: string;
  templateId: string;
  companyName: string;
  totalRounds: number;
  completedRounds: number;
  averageScore: number;
  roundScores: Array<{
    roundId: string;
    roundName: string;
    roundType: string;
    score: number;
    passed: boolean;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  companyTemplateId?: string;
  roundId?: string;
}

export interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
  roundId?: string;
  roundName?: string;
}

export interface User {
  name: string;
  email: string;
  image: string;
  id: string;
  role?: string;
  isAdmin?: boolean;
}

export interface InterviewCardProps {
  id?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

export interface AgentProps {
  userName: string;
  userId?: string;
  userRole: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  roundId?: string;
  roundName?: string;
}

export interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}

interface QuestionBank {
  id: string;
  name: string;
  description: string;
  type: 'aptitude' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  createdAt: string;
  updatedAt?: string;
  questionIds: string[];
  isActive: boolean;
}

interface AptitudeQuestionBank extends QuestionBank {
  type: 'aptitude';
  questions?: Question[];
}

interface CodingQuestionBank extends QuestionBank {
  type: 'coding';
  questions?: Question[];
}
