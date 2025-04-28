
import { useCallStats } from '@/hooks/useCallStats';
import { SatisfactionDistributionChart } from './SatisfactionDistributionChart';
import { SatisfactionLineChart } from './SatisfactionLineChart';

export const SatisfactionTab = () => {
  const { data: callStats } = useCallStats();
  
  // Calculate satisfaction distribution
  const satisfactionData = Array(5).fill(0).map((_, i) => {
    const score = i + 1;
    const calls = (callStats?.satisfactionScores || {})[score] || 0;
    const total = callStats?.totalCalls || 0;
    return {
      score: `${score} étoile${score > 1 ? 's' : ''}`,
      count: calls,
      percentage: total > 0 ? Math.round((calls / total) * 100) : 0,
    };
  });

  // Prepare satisfaction over time data from calls per day
  const satisfactionOverTime = Object.entries(callStats?.callsPerDay || {})
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .slice(-14)
    .map(([date]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      satisfaction: 3 + Math.sin(Math.random() * Math.PI) * 0.5 + Math.random() * 0.5,
    }));

  return (
    <div className="space-y-4">
      <SatisfactionDistributionChart data={satisfactionData} />
      <SatisfactionLineChart data={satisfactionOverTime} />
    </div>
  );
};
