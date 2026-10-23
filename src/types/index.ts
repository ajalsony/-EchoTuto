export type EchoRingsState = 'idle' | 'speaking' | 'recording' | 'processing' | 'error';

export type InterviewTrack = 'technical' | 'hr';

export type PracticeMode = 'voice' | 'typed';

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
