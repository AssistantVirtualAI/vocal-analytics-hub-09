
import React from 'react';
import { AudioPlayerControls } from './AudioPlayerControls';
import { RetryButton } from './RetryButton';
import { DownloadButton } from './DownloadButton';

interface PlayerControlsProps {
  audioUrl?: string;
  isLoading: boolean;
  error?: Error | null;
  callId?: string;
  onRetry?: () => void;
  isRetrying: boolean;
}

export const PlayerControls = ({ 
  audioUrl, 
  isLoading, 
  error, 
  callId,
  onRetry,
  isRetrying
}: PlayerControlsProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <AudioPlayerControls 
        audioUrl={audioUrl} 
        isDisabled={isLoading}
        ariaLabel="Contrôles de lecture audio ElevenLabs"
      />
      <div className="flex gap-2">
        {error && onRetry && (
          <RetryButton onRetry={onRetry} isRetrying={isRetrying} />
        )}
        {audioUrl && !isLoading && (
          <DownloadButton audioUrl={audioUrl} callId={callId} />
        )}
      </div>
    </div>
  );
};
