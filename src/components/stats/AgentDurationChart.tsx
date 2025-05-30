
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
import { formatDuration } from './AgentPerformanceChart';

export const AgentDurationChart = () => {
  const { data: agentStats = [] } = useAgentStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Durée moyenne par agent</CardTitle>
        <CardDescription>Durée moyenne des appels par agent</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agentStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatDuration(value)} />
              <Tooltip 
                formatter={(value: number) => [formatDuration(value), 'Durée moyenne']}
              />
              <Legend />
              <Bar
                dataKey="avgDuration"
                name="Durée moyenne"
                fill="#9b87f5"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
