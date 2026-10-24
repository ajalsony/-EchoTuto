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
  | 'idle' // Not tested
  | 'requesting' // Requesting microphone permission
  | 'testing' // Testing with live audio capture running
  | 'ready' // Microphone ready (sound activity detected)
  | 'no-audio' // No audio detected after timeout
  | 'active' // Microphone active (general ready state)
  | 'denied' // Permission denied by user or browser
  | 'missing' // No hardware input device found
  | 'unsupported' // Browser does not support mediaDevices
  | 'error'; // Hardware or track initialization error

export type SpeechRecognitionState =
  | 'ready'
  | 'listening'
  | 'processing'
  | 'completed'
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
  status?: 'in-progress' | 'completed' | 'abandoned';
  completedAt?: string | null;
}

