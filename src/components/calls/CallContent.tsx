
import { SummaryCard } from './summary/SummaryCard';
import { TranscriptCard } from './transcript/TranscriptCard';

interface CallContentProps {
  summary?: string;
  transcript?: string;
  callId?: string;
  isLoading?: boolean;
}

export const CallContent = ({ summary, transcript, callId, isLoading = false }: CallContentProps) => {
  return (
    <div className="space-y-6">
      <SummaryCard 
        summary={summary} 
        hasTranscript={!!transcript} 
        callId={callId} 
        isLoading={isLoading}
        transcript={transcript}
      />
      <TranscriptCard 
        transcript={transcript} 
        isLoading={isLoading}
      />
    </div>
  );
};
