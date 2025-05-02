
import { SummaryCard } from './summary/SummaryCard';
import { TranscriptCard } from './transcript/TranscriptCard';
import { useGenerateSummaryFallback } from '@/hooks/useGenerateSummaryFallback';
import { useGenerateSummaryAnthopic } from '@/hooks/useGenerateSummaryAnthopic';

interface CallContentProps {
  summary?: string;
  transcript?: string;
  callId?: string;
  isLoading?: boolean;
}

export const CallContent = ({ summary, transcript, callId, isLoading = false }: CallContentProps) => {
  const { mutate: generateSummaryFallback, isPending: isFallbackGenerating } = useGenerateSummaryFallback();
  const { mutate: generateSummaryAnthopic, isPending: isAnthropicGenerating } = useGenerateSummaryAnthopic();
  
  const handleGenerateSummaryFallback = () => {
    if (callId && transcript) {
      generateSummaryFallback({ callId, transcript });
    }
  };
  
  const handleGenerateSummaryAnthopic = () => {
    if (callId && transcript) {
      generateSummaryAnthopic({ callId, transcript });
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
        isFallbackGenerating={isFallbackGenerating}
        onGenerateAnthropicSummary={handleGenerateSummaryAnthopic}
        isAnthropicGenerating={isAnthropicGenerating}
      />
      <TranscriptCard 
        transcript={transcript} 
        isLoading={isLoading}
      />
    </div>
  );
};
