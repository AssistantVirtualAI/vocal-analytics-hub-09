
import {
  LineChart,
  Line,
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

type SatisfactionLineChartProps = {
  data: Array<{
    date: string;
    satisfaction: number;
  }>;
};

export const SatisfactionLineChart = ({ data }: SatisfactionLineChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Satisfaction dans le temps</CardTitle>
        <CardDescription>Évolution de la satisfaction moyenne sur la période</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[2.5, 5]} />
              <Tooltip 
                formatter={(value: number) => [value.toFixed(1) + '/5', 'Satisfaction']}
              />
              <Legend />
              <Line
                name="Satisfaction moyenne"
                type="monotone"
                dataKey="satisfaction"
                stroke="#7E69AB"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
