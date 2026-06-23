export type LearnerLevel = "Beginner" | "Intermediate" | "Advanced";

export type LearnerQuestion = {
  id: string;
  type: "multiple_choice" | "scenario" | "practical";
  question: string;
  options: string[];
  answer: string;
};

export type LearningModule = {
  id: string;
  title: string;
  description: string;
  milestone: string;
  topics: string[];
  resources: string[];
  practiceSources: string[];
  projectIdeas: string[];
  practiceTask: string;
  completed: boolean;
  practiceCompleted: boolean;
  feedback?: string;
};

export type LearnerSkillResult = {
  id: string;
  skill: string;
  level: LearnerLevel;
  score: number;
  status: "passed" | "failed";
  certificateId?: string | null;
  completedAt: string;
};

export type LearnerJourney = {
  activeAttemptId?: string;
  skills: string[];
  level: LearnerLevel;
  weeklyAvailability: number;
  goals: string;
  stage: number;
  learningPathComment?: string;
  modules: LearningModule[];
  mockTestScore?: number;
  certified: boolean;
  certificateId?: string;
  xp: number;
  streak: number;
  badges: string[];
  skillHistory: LearnerSkillResult[];
  updatedAt?: string;
};

export const LEARNER_SKILLS = [
  "Web Development",
  "Graphic Design",
  "UI/UX Design",
  "Public Speaking",
  "English Communication",
  "Digital Marketing",
  "Programming Languages",
];

export const EMPTY_JOURNEY: LearnerJourney = {
  skills: [],
  level: "Beginner",
  weeklyAvailability: 5,
  goals: "",
  stage: 1,
  modules: [],
  certified: false,
  xp: 0,
  streak: 0,
  badges: [],
  skillHistory: [],
};
