import { create } from 'zustand';

export type QuestionType = 'DSA' | 'System Design' | 'HR/Behavioral';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Role = 'SDE' | 'DevOps' | 'Data Analyst' | 'Frontend' | 'Backend' | 'Full Stack' | 'ML Engineer';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Senior';

export interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate' | 'system';
  content: string;
  questionType?: QuestionType;
  difficulty?: Difficulty;
  timestamp: Date;
}

export interface CandidateProfile {
  role: Role;
  level: ExperienceLevel;
  skills: string;
  previousScore: string;
}

export interface InterviewStats {
  totalQuestions: number;
  dsaCount: number;
  systemDesignCount: number;
  hrCount: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

export interface InterviewFeedback {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

interface InterviewState {
  phase: 'setup' | 'interview' | 'complete';
  profile: CandidateProfile | null;
  messages: InterviewMessage[];
  stats: InterviewStats;
  isLoading: boolean;
  currentQuestionType: QuestionType | null;
  currentDifficulty: Difficulty | null;
  interviewStartTime: Date | null;
  feedback: InterviewFeedback | null;
  feedbackLoading: boolean;
  sessionId: string;

  setProfile: (profile: CandidateProfile) => void;
  startInterview: () => void;
  addMessage: (message: InterviewMessage) => void;
  setIsLoading: (loading: boolean) => void;
  updateCurrentQuestion: (type: QuestionType, difficulty: Difficulty) => void;
  incrementStats: (type: QuestionType, difficulty: Difficulty) => void;
  resetInterview: () => void;
  completeInterview: () => void;
  setFeedback: (feedback: InterviewFeedback | null) => void;
  setFeedbackLoading: (loading: boolean) => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  phase: 'setup',
  profile: null,
  messages: [],
  stats: {
    totalQuestions: 0,
    dsaCount: 0,
    systemDesignCount: 0,
    hrCount: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
  },
  isLoading: false,
  currentQuestionType: null,
  currentDifficulty: null,
  interviewStartTime: null,
  feedback: null,
  feedbackLoading: false,
  sessionId: '',

  setProfile: (profile) => set({ profile }),

  startInterview: () => set({ phase: 'interview', interviewStartTime: new Date(), sessionId: crypto.randomUUID() }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setIsLoading: (loading) => set({ isLoading: loading }),

  updateCurrentQuestion: (type, difficulty) =>
    set({ currentQuestionType: type, currentDifficulty: difficulty }),

  incrementStats: (type, difficulty) =>
    set((state) => ({
      stats: {
        ...state.stats,
        totalQuestions: state.stats.totalQuestions + 1,
        dsaCount: state.stats.dsaCount + (type === 'DSA' ? 1 : 0),
        systemDesignCount: state.stats.systemDesignCount + (type === 'System Design' ? 1 : 0),
        hrCount: state.stats.hrCount + (type === 'HR/Behavioral' ? 1 : 0),
        easyCount: state.stats.easyCount + (difficulty === 'easy' ? 1 : 0),
        mediumCount: state.stats.mediumCount + (difficulty === 'medium' ? 1 : 0),
        hardCount: state.stats.hardCount + (difficulty === 'hard' ? 1 : 0),
      },
    })),

  resetInterview: () =>
    set({
      phase: 'setup',
      profile: null,
      messages: [],
      stats: {
        totalQuestions: 0,
        dsaCount: 0,
        systemDesignCount: 0,
        hrCount: 0,
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0,
      },
      isLoading: false,
      currentQuestionType: null,
      currentDifficulty: null,
      interviewStartTime: null,
      feedback: null,
      feedbackLoading: false,
      sessionId: '',
    }),

  completeInterview: () => set({ phase: 'complete' }),

  setFeedback: (feedback) => set({ feedback }),

  setFeedbackLoading: (loading) => set({ feedbackLoading: loading }),
}));
