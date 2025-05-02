
import { cn } from '@/lib/utils';

interface StatItemProps {
  label: string;
  value: string | number | undefined;
  unit?: string;
  className?: string;
}

/**
 * Renders a single statistic item with label and value
 */
export const StatItem = ({ 
  label, 
  value, 
  unit = '', 
  className 
}: StatItemProps) => {
  const displayValue = value !== undefined && value !== null 
    ? `${value}${unit}` 
    : 'N/A';

  return (
    <div className={cn("p-3 bg-muted rounded-md", className)}>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      <div className="font-medium text-lg">{displayValue}</div>
    </div>
  );
};
