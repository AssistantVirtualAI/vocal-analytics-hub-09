
/**
 * Helper functions for formatting and displaying statistics
 */

import { formatDuration as formatDurationBase } from '@/components/dashboard/utils/formatters';

// Re-export the formatDuration function from formatters
export const formatDuration = formatDurationBase;

// Format percentage with 1 decimal place
export const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A';
  }
  return `${(value * 100).toFixed(1)}%`;
};

// Format key name from snake_case to Title Case
export const formatKeyName = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get badge variant based on sentiment label
export const getSentimentBadgeVariant = (
  label?: string
): "default" | "destructive" | "outline" | "secondary" => {
  if (label === 'positive') return 'default';
  if (label === 'negative') return 'destructive';
  if (label === 'neutral') return 'outline';
  return 'secondary';
};

// Check if statistics object has valid data
export const hasValidStatistics = (statistics: any): boolean => {
  return statistics && 
         typeof statistics === 'object' && 
         Object.keys(statistics).length > 0;
};

// Get remaining statistics fields excluding the common ones
export const getRemainingStats = (statistics: Record<string, any>) => {
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
  
  return Object.entries(statistics).filter(([key]) => !commonKeys.includes(key));
};
