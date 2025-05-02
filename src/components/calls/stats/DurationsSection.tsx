
import { StatItem } from './StatItem';
import { formatDuration } from './statsUtils';

interface DurationsSectionProps {
  totalDuration?: number;
  agentTalkDuration?: number;
  customerTalkDuration?: number;
  silenceDuration?: number;
}

/**
 * Displays key durations statistics in a grid layout
 */
export const DurationsSection = ({
  totalDuration,
  agentTalkDuration,
  customerTalkDuration,
  silenceDuration
}: DurationsSectionProps) => {
  return (
    <div>
      <h3 className="text-md font-medium mb-3">Durées Clés</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatItem 
          label="Durée Totale" 
          value={formatDuration(totalDuration)}
        />
        <StatItem 
          label="Parole Agent" 
          value={formatDuration(agentTalkDuration)}
        />
        <StatItem 
          label="Parole Client" 
          value={formatDuration(customerTalkDuration)}
        />
        <StatItem 
          label="Silence" 
          value={formatDuration(silenceDuration)}
        />
      </div>
    </div>
  );
};
