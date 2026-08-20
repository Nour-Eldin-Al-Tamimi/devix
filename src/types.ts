export type DeveloperLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type GoalType =
  | 'Strengthen my CV'
  | 'Build my portfolio'
  | 'Practice my skills'
  | 'Prepare for jobs';

export type TimeOption =
  | '1 Day'
  | 'Weekend (2-3 Days)'
  | '1 Week'
  | '2 Weeks'
  | '1 Month';

export interface DatabaseColumn {
  name: string;
  type: string;
  desc: string;
}

export interface DatabaseTable {
  table: string;
  description: string;
  columns: DatabaseColumn[];
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  samplePayload?: string;
  responsePreview?: string;
}

export interface MilestoneTask {
  id: string;
  task: string;
  details?: string;
  completed?: boolean;
}

export interface MilestonePhase {
  phaseNumber: number;
  phase: string;
  title: string;
  duration: string;
  tasks: MilestoneTask[];
}

export interface InterviewQuestion {
  question: string;
  idealAnswer: string;
  talkingPoint: string;
  pitfallsToAvoid: string;
}

export interface StarterFile {
  filename: string;
  language: string;
  description: string;
  code: string;
}

export interface ProjectBlueprint {
  id: string;
  title: string;
  tagline: string;
  level: DeveloperLevel;
  skills: string[];
  goal: GoalType;
  projectType: string;
  availableTime: string;
  matchScore: number;
  overview: string;
  problemStatement: string;
  targetAudience: string;
  whyItProvesSkills: string[];
  architecture: {
    summary: string;
    frontend: string;
    backend: string;
    database: string;
    authAndSecurity: string;
    deployment: string;
  };
  databaseSchema: DatabaseTable[];
  apiEndpoints: ApiEndpoint[];
  milestones: MilestonePhase[];
  cvBulletPoints: string[];
  interviewQuestions: InterviewQuestion[];
  starterFiles: StarterFile[];
  readmeMarkdown: string;
  difficultyReasoning?: string;
  implementationStatus?: {
    implemented: string[];
    scaffolded: string[];
    planned: string[];
  };
  technicalDecisions?: string[];
  limitations?: string[];
  metricsToMeasureLater?: string[];
  createdAt: string;
  tags: string[];
}

export interface ProjectGeneratorInput {
  level: DeveloperLevel;
  skills: string[];
  goal: GoalType;
  projectType: string;
  availableTime: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  createdAt: string;
  plan: 'free' | 'pro';
  isPro: boolean;
  isBeta?: boolean;
  betaGenerationsRemaining?: number;
  redeemedBetaCode?: string | null;
  betaRedeemedAt?: string | null;
  paypalOrderId: string | null;
  paypalTransactionId: string | null;
  proActivatedAt: string | null;
}

export interface BetaRedeemResponse {
  success: boolean;
  generationsGranted: number;
  generationsRemaining: number;
  code?: string;
  message?: string;
  error?: string;
}

export type AuthModalMode = 'signin' | 'signup' | 'forgot-password';
