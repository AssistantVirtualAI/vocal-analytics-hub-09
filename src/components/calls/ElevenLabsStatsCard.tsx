import { Card } from '@/components/ui/card';
import { hasValidStatistics } from './stats/statsUtils';
import { LoadingState } from './stats/LoadingState';
import { EmptyState } from './stats/EmptyState';
import { DurationsSection } from './stats/DurationsSection';
import { TimeDistributionSection } from './stats/TimeDistributionSection';
import { SentimentSection } from './stats/SentimentSection';
import { AdditionalStatsSection } from './stats/AdditionalStatsSection';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ElevenLabsStatsCardProps {
  statistics: any; // Keep 'any' for now, could be refined later
  isLoading: boolean;
}

export const ElevenLabsStatsCard = ({ statistics, isLoading }: ElevenLabsStatsCardProps) => {
  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <LoadingState />
      </Card>
    );
  }

  // Handle empty or invalid statistics
  if (!hasValidStatistics(statistics)) {
    return (
      <Card>
        <EmptyState />
      </Card>
    );
  }

  // Extract main statistics data
  const totalDuration = statistics.total_duration_seconds;
  const agentTalkDuration = statistics.agent_talk_duration_seconds;
  const customerTalkDuration = statistics.customer_talk_duration_seconds;
  const silenceDuration = statistics.silence_duration_seconds;
  
  const agentTalkPercentage = statistics.agent_talk_percentage;
  const customerTalkPercentage = statistics.customer_talk_percentage;
  const silencePercentage = statistics.silence_percentage;
  
  const sentiment = statistics.sentiment;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques ElevenLabs</CardTitle>
        <CardDescription>Données de performance et analyse de l'appel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Durations */}
          <DurationsSection 
            totalDuration={totalDuration}
            agentTalkDuration={agentTalkDuration}
            customerTalkDuration={customerTalkDuration}
            silenceDuration={silenceDuration}
          />

          {/* Talk/Silence Percentages */}
          <TimeDistributionSection
            agentTalkPercentage={agentTalkPercentage}
            customerTalkPercentage={customerTalkPercentage}
            silencePercentage={silencePercentage}
          />
          
          {/* Sentiment Analysis */}
          <SentimentSection sentiment={sentiment} />

          {/* Other Statistics */}
          <AdditionalStatsSection statistics={statistics} />
        </div>
      </CardContent>
    </Card>
  );
};
