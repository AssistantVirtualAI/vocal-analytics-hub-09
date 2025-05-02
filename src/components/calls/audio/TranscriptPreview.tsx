
import React from 'react';
import { TranscriptDialog } from './TranscriptDialog';
import { TranscriptText } from './TranscriptText';

interface TranscriptPreviewProps {
  transcript: string;
}

export const TranscriptPreview = ({ transcript }: TranscriptPreviewProps) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium mb-2" id="transcript-heading">Transcription ElevenLabs</h3>
        <TranscriptDialog transcript={transcript} />
      </div>
      <div 
        className="bg-muted p-3 rounded-md"
        aria-labelledby="transcript-heading"
      >
        <TranscriptText transcript={transcript} />
      </div>
    </div>
  );
};
