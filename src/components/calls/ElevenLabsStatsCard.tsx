import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Import Progress for potential visualizations
import { Badge } from '@/components/ui/badge'; // Import Badge for potential tags

interface ElevenLabsStatsCardProps {
  statistics: any; // Keep 'any' for now, refine if structure becomes known
  isLoading: boolean;
}

// Helper function to format duration in seconds to MM:SS
const formatDuration = (seconds: number | undefined): string => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) {
    return 'N/A';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Helper to format percentage
const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  return `${(value * 100).toFixed(1)}%`;
};

// Helper to render a single statistic item
const renderStatItem = (label: string, value: string | number | undefined, unit: string = '') => {
  const displayValue = value !== undefined && value !== null ? `${value}${unit}` : 'N/A';
  return (
    <div className="p-3 bg-muted rounded-md">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div className="font-medium text-lg">{displayValue}</div>
    </div>
  );
};

// Helper to render sentiment if available
const renderSentiment = (sentiment: any) => {
  if (!sentiment || typeof sentiment !== 'object') return null;
  
  // Example: Assuming sentiment has 'score' and 'label'
  const score = sentiment.score;
  const label = sentiment.label;
  let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "secondary";
  if (label === 'positive') badgeVariant = 'default'; // Or a custom green
  if (label === 'negative') badgeVariant = 'destructive';
  if (label === 'neutral') badgeVariant = 'outline';

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Analyse de Sentiment</h3>
      <div className="flex items-center space-x-2">
        {label && <Badge variant={badgeVariant}>{label.charAt(0).toUpperCase() + label.slice(1)}</Badge>}
        {score !== undefined && <span className="text-sm text-muted-foreground">(Score: {score.toFixed(2)})</span>}
      </div>
      {/* Add more sentiment details if available, e.g., scores per segment */}
    </div>
  );
};

export const ElevenLabsStatsCard = ({ statistics, isLoading }: ElevenLabsStatsCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques ElevenLabs</CardTitle>
          <CardDescription>Chargement des statistiques...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics || typeof statistics !== 'object' || Object.keys(statistics).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistiques ElevenLabs</CardTitle>
          <CardDescription>Aucune statistique disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Les statistiques ne sont pas disponibles pour cet appel. Cela peut être dû au traitement en cours par ElevenLabs, à l'absence de cette fonctionnalité pour l'appel, ou à un problème de configuration.
          </p>
        </CardContent>
      </Card>
    );
  }

  // --- Render Key Statistics --- 
  // Adjust keys based on actual ElevenLabs API response structure
  const totalDuration = statistics.total_duration_seconds;
  const agentTalkDuration = statistics.agent_talk_duration_seconds;
  const customerTalkDuration = statistics.customer_talk_duration_seconds;
  const silenceDuration = statistics.silence_duration_seconds;
  const agentTalkPercentage = statistics.agent_talk_percentage;
  const customerTalkPercentage = statistics.customer_talk_percentage;
  const silencePercentage = statistics.silence_percentage;
  const sentiment = statistics.sentiment; // Assuming sentiment might be a nested object

  // --- Render Other/Generic Statistics --- 
  const otherStats = Object.entries(statistics).filter(([key]) => 
    !['total_duration_seconds', 'agent_talk_duration_seconds', 'customer_talk_duration_seconds', 'silence_duration_seconds', 'agent_talk_percentage', 'customer_talk_percentage', 'silence_percentage', 'sentiment'].includes(key)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiques ElevenLabs</CardTitle>
        <CardDescription>Données de performance et analyse de l'appel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Durations */}
          <div>
            <h3 className="text-md font-medium mb-3">Durées Clés</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {renderStatItem("Durée Totale", formatDuration(totalDuration))}
              {renderStatItem("Parole Agent", formatDuration(agentTalkDuration))}
              {renderStatItem("Parole Client", formatDuration(customerTalkDuration))}
              {renderStatItem("Silence", formatDuration(silenceDuration))}
            </div>
          </div>

          {/* Talk/Silence Percentages (Example with Progress bars) */}
          {(agentTalkPercentage !== undefined || customerTalkPercentage !== undefined || silencePercentage !== undefined) && (
            <div>
              <h3 className="text-md font-medium mb-3">Répartition du Temps de Parole</h3>
              <div className="space-y-2">
                {agentTalkPercentage !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Agent</span>
                      <span>{formatPercentage(agentTalkPercentage)}</span>
                    </div>
                    <Progress value={agentTalkPercentage * 100} className="h-2" />
                  </div>
                )}
                {customerTalkPercentage !== undefined && (
                   <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Client</span>
                      <span>{formatPercentage(customerTalkPercentage)}</span>
                    </div>
                    <Progress value={customerTalkPercentage * 100} className="h-2" />
                  </div>
                )}
                 {silencePercentage !== undefined && (
                   <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Silence</span>
                      <span>{formatPercentage(silencePercentage)}</span>
                    </div>
                    <Progress value={silencePercentage * 100} className="h-2 bg-gray-300" />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Sentiment Analysis */}
          {renderSentiment(sentiment)}

          {/* Other Statistics */}
          {otherStats.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-md font-medium mb-3">Autres Données</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {otherStats.map(([key, value]) => {
                  const formattedKey = key
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                  
                  // Handle nested objects simply for now
                  const displayValue = (typeof value === 'object' && value !== null) 
                                       ? JSON.stringify(value)
                                       : value?.toString() || 'N/A';

                  return (
                    <div key={key} className="p-3 bg-muted/50 rounded-md">
                      <div className="text-xs font-medium text-muted-foreground mb-1">{formattedKey}</div>
                      <div className="font-medium text-sm break-words">{displayValue}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
