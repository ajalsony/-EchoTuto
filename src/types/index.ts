export type EchoRingsState = 'idle' | 'speaking' | 'recording' | 'processing' | 'error';

export type InterviewTrack = 'technical' | 'hr';

export type PracticeMode = 'voice' | 'typed';

export type DifficultyLevel = 'foundation' | 'pressure-cooker' | 'executive';

export type ScreenView =
  | 'entry'
  | 'setup'
  | 'room'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'verify-email'
  | 'dashboard';

export type MicStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'missing'
  | 'unsupported'
  | 'error';

export interface InterviewTrackInfo {
  id: InterviewTrack;
  code: string;
  title: string;
  tagline: string;
  description: string;
  focusAreas: string[];
}

export interface DifficultyOption {
  id: DifficultyLevel;
  title: string;
  badge: string;
  description: string;
  recommendation?: string;
}

export interface InterviewConfig {
  track: InterviewTrack;
  difficulty: DifficultyLevel;
  topic: string;
  customTopic: string;
  mode: PracticeMode;
}

export type EducationLevel =
  | 'High School'
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Doctorate'
  | 'Diploma'
  | 'Other';

export type ExperienceLevel = 'Fresher' | 'Internship' | 'Experienced';

export interface StudentProfileData {
  fullName: string;
  username: string;
  email: string;
  age: number | string;
  educationLevel: string;
  courseDegree: string;
  studyYear: string;
  college?: string;
  targetRole?: string;
  experienceLevel?: ExperienceLevel;
  skills?: string;
}

export interface UserProfile extends StudentProfileData {
  id: string;
  createdAt?: string;
  emailConfirmed?: boolean;
}

export interface InterviewHistoryItem {
  id: string;
  userId?: string;
  track: InterviewTrack;
  topic: string;
  difficulty: DifficultyLevel;
  mode: PracticeMode;
  date: string;
  durationSeconds: number;
  overallScore?: number | null;
  cadenceScore?: number | null;
  defenseScore?: number | null;
  feedbackSummary?: string | null;
}

