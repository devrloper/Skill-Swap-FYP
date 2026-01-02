// TypeScript types for the application

export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  skillsToTeach: Skill[];
  skillsToLearn: Skill[];
  experience: 'beginner' | 'intermediate' | 'expert';
  availability: Availability;
  languages: string[];
  location?: string;
  createdAt: number;
  rating?: number;
  completedSessions?: number;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  category?: string;
}

export interface Availability {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface Connection {
  id: string;
  users: string[];
  status: 'pending' | 'accepted' | 'rejected';
  requestedBy: string;
  createdAt: number;
  acceptedAt?: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  read: boolean;
  type?: 'text' | 'system' | 'schedule';
}

export interface Session {
  id: string;
  participants: string[];
  topic: string;
  dateTime: number;
  duration: number; // in minutes
  zoomLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: number;
}

export interface Interview {
  id: string;
  userId: string;
  questions: InterviewQuestion[];
  answers: string[];
  aiAnalysis?: string;
  recommendations?: string[];
  completedAt: number;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'rating';
  options?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface MatchScore {
  userId: string;
  score: number;
  matchedSkills: string[];
  commonInterests: string[];
}
