
import { AgentPerformanceChart } from './AgentPerformanceChart';
import { AgentDurationChart } from './AgentDurationChart';

export const AgentsTab = () => {
  return (
    <div className="space-y-4">
      <AgentPerformanceChart />
      <AgentDurationChart />
    </div>
  );
};
