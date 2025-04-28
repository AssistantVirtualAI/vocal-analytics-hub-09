
import type { CustomerStats } from '@/types';
import { CallsPerDayChart } from './CallsPerDayChart';
import { CustomerDistributionChart } from './CustomerDistributionChart';

type OverviewTabProps = {
  chartData: Array<{
    date: string;
    appels: number;
  }>;
  customerStats: CustomerStats[];
};

export const OverviewTab = ({ chartData, customerStats }: OverviewTabProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <CallsPerDayChart data={chartData} />
      <CustomerDistributionChart data={customerStats} />
    </div>
  );
};
