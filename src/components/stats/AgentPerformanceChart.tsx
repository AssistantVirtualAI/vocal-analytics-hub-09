
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAgentStats } from '@/hooks/useAgentStats';

// Format duration from seconds to minutes:seconds
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const AgentPerformanceChart = () => {
  const { data: agentStats = [] } = useAgentStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance des agents</CardTitle>
        <CardDescription>Comparaison des performances d'agents par nombre d'appels et satisfaction</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={agentStats}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip />
              <Legend />
              <Bar dataKey="calls" name="Nombre d'appels" fill="#7E69AB" />
              <Bar dataKey="satisfaction" name="Satisfaction (sur 5)" fill="#6E59A5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
