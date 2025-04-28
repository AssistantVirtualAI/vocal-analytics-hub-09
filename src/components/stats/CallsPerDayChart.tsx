
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

type CallsPerDayChartProps = {
  data: Array<{
    date: string;
    appels: number;
  }>;
};

export const CallsPerDayChart = ({ data }: CallsPerDayChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appels par jour</CardTitle>
        <CardDescription>Nombre d'appels sur les 14 derniers jours</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip />
              <Legend />
              <Bar 
                name="Nombre d'appels"
                dataKey="appels" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
                className="cursor-pointer hover:opacity-80"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
