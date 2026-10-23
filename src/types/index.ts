export type EchoRingsState = 'idle' | 'speaking' | 'recording' | 'processing' | 'error';

export type InterviewTrack = 'technical' | 'hr';

export type PracticeMode = 'voice' | 'typed';

export type DifficultyLevel = 'foundation' | 'pressure-cooker' | 'executive';

export type ScreenView = 'entry' | 'setup' | 'room';

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
