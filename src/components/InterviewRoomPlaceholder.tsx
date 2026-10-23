import React from 'react';
import { InterviewStudio } from './interview/InterviewStudio';
import type { InterviewConfig } from '../types';

interface InterviewRoomPlaceholderProps {
  config: InterviewConfig;
  onBackToSetup: () => void;
  onExitHome: () => void;
}

export const InterviewRoomPlaceholder: React.FC<InterviewRoomPlaceholderProps> = (props) => {
  return <InterviewStudio {...props} />;
};
