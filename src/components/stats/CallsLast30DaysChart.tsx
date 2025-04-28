
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type CallsLast30DaysChartProps = {
  data: Array<{
    date: string;
    appels: number;
  }>;
};

export const CallsLast30DaysChart = ({ data }: CallsLast30DaysChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume d'appels quotidiens (30 jours)</CardTitle>
        <CardDescription>Évolution du nombre d'appels sur les 30 derniers jours</CardDescription>
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
                tickFormatter={(value) => value}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip />
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
