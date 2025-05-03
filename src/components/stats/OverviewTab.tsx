
import type { CustomerStats } from '@/types';
import { CallsPerDayChart } from './CallsPerDayChart';
import { CustomerDistributionChart } from './CustomerDistributionChart';

type OverviewTabProps = {
  chartData: Array<{
    date: string;
    appels: number;
  }>;
  customerStats: CustomerStats[];
  isLoading?: boolean;
  onRefresh?: () => void;
};

export const OverviewTab = ({ 
  chartData, 
  customerStats, 
  isLoading = false,
  onRefresh 
}: OverviewTabProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CallsPerDayChart 
        data={chartData} 
        isLoading={isLoading} 
        onRefresh={onRefresh} 
      />
      <CustomerDistributionChart 
        data={customerStats} 
        isLoading={isLoading} 
        onRefresh={onRefresh} 
      />
    </div>
  );
};
