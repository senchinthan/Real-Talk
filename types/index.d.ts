interface Feedback {
  id: string;
  interviewId: string;
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

interface CompanyTemplate {
  id: string;
  companyName: string;
  companyLogo: string;
  description: string;
  rounds: Round[];
  isActive: boolean;
  createdAt: string;
}

interface Round {
  id: string;
  name: string; // "Aptitude", "Coding", "System Design", "Behavioral"
  type: "voice" | "text" | "code";
  duration: number; // in minutes
  questions: string[];
  passingScore?: number;
}

interface CompanyInterview {
  id: string;
  templateId: string;
  companyName: string;
  userId: string;
  createdAt: string;
  completedRounds: string[]; // array of round IDs
}

interface RoundFeedback extends Feedback {
  roundId: string;
  roundName: string;
}

interface Interview {
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

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
  roundId?: string;
  roundName?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
}

interface InterviewCardProps {
  id?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  roundId?: string;
  roundName?: string;
}

interface RouteParams {
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
