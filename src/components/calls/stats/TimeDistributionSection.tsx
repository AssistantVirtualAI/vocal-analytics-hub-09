
import { Progress } from '@/components/ui/progress';
import { formatPercentage } from './statsUtils';

interface TimeDistributionSectionProps {
  agentTalkPercentage?: number;
  customerTalkPercentage?: number;
  silencePercentage?: number;
}

/**
 * Displays the time distribution with progress bars
 */
export const TimeDistributionSection = ({
  agentTalkPercentage,
  customerTalkPercentage,
  silencePercentage
}: TimeDistributionSectionProps) => {
  // Don't render if no percentages available
  if (
    agentTalkPercentage === undefined && 
    customerTalkPercentage === undefined && 
    silencePercentage === undefined
  ) {
    return null;
  }

  return (
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
  );
};
