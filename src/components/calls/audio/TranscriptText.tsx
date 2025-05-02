
import React from 'react';

interface TranscriptTextProps {
  transcript: string;
  maxHeight?: string;
  className?: string;
}

export const TranscriptText = ({ 
  transcript, 
  maxHeight = 'max-h-40',
  className = ''
}: TranscriptTextProps) => {
  return (
    <div 
      className={`text-sm whitespace-pre-wrap overflow-y-auto ${maxHeight} ${className}`}
      tabIndex={0}
    >
      {transcript}
    </div>
  );
};
