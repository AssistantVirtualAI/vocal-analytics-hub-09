
import { SummaryCard } from './summary/SummaryCard';
import { TranscriptCard } from './transcript/TranscriptCard';

interface CallContentProps {
  summary?: string;
  transcript?: string;
  callId?: string;
}

export const CallContent = ({ summary, transcript, callId }: CallContentProps) => {
  return (
    <div className="space-y-6">
      <SummaryCard 
        summary={summary} 
        hasTranscript={!!transcript} 
        callId={callId} 
      />
      <TranscriptCard transcript={transcript} />
    </div>
  );
};
