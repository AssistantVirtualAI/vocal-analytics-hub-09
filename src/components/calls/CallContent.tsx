
import { SummaryCard } from './summary/SummaryCard';
import { TranscriptCard } from './transcript/TranscriptCard';
import { useGenerateSummaryFallback } from '@/hooks/useGenerateSummaryFallback';

interface CallContentProps {
  summary?: string;
  transcript?: string;
  callId?: string;
  isLoading?: boolean;
}

export const CallContent = ({ summary, transcript, callId, isLoading = false }: CallContentProps) => {
  const { mutate: generateSummaryFallback, isPending } = useGenerateSummaryFallback();
  
  const handleGenerateSummaryFallback = () => {
    if (callId && transcript) {
      generateSummaryFallback({ callId, transcript });
    }
  };
  
  return (
    <div className="space-y-6">
      <SummaryCard 
        summary={summary} 
        hasTranscript={!!transcript} 
        callId={callId} 
        isLoading={isLoading}
        transcript={transcript}
        onGenerateFallbackSummary={handleGenerateSummaryFallback}
        isFallbackGenerating={isPending}
      />
      <TranscriptCard 
        transcript={transcript} 
        isLoading={isLoading}
      />
    </div>
  );
};
