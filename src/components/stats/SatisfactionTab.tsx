
import { SatisfactionDistributionChart } from './SatisfactionDistributionChart';
import { SatisfactionLineChart } from './SatisfactionLineChart';

type SatisfactionTabProps = {
  satisfactionData: Array<{
    score: string;
    count: number;
    percentage: number;
  }>;
  satisfactionOverTime: Array<{
    date: string;
    satisfaction: number;
    appels?: number;
  }>;
};

export const SatisfactionTab = ({ satisfactionData, satisfactionOverTime }: SatisfactionTabProps) => {
  return (
    <div className="space-y-4">
      <SatisfactionDistributionChart data={satisfactionData} />
      <SatisfactionLineChart data={satisfactionOverTime} />
    </div>
  );
};
