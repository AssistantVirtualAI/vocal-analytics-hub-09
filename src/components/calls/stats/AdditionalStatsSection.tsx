
import { StatItem } from './StatItem';
import { formatKeyName } from './statsUtils';

interface AdditionalStatsSectionProps {
  statistics: Record<string, any>;
}

/**
 * Displays any additional statistics not covered by the specialized components
 */
export const AdditionalStatsSection = ({ statistics }: AdditionalStatsSectionProps) => {
  const commonKeys = [
    'total_duration_seconds',
    'agent_talk_duration_seconds',
    'customer_talk_duration_seconds',
    'silence_duration_seconds',
    'agent_talk_percentage',
    'customer_talk_percentage',
    'silence_percentage',
    'sentiment'
  ];
  
  const additionalStats = Object.entries(statistics).filter(
    ([key]) => !commonKeys.includes(key)
  );

  if (additionalStats.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t">
      <h3 className="text-md font-medium mb-3">Autres Données</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {additionalStats.map(([key, value]) => {
          // Format the key name for display
          const formattedKey = formatKeyName(key);
          
          // Handle nested objects simply
          const displayValue = typeof value === 'object' && value !== null
            ? JSON.stringify(value)
            : value?.toString() || 'N/A';

          return (
            <StatItem
              key={key}
              label={formattedKey}
              value={displayValue}
              className="bg-muted/50"
            />
          );
        })}
      </div>
    </div>
  );
};
