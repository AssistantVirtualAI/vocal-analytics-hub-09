
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

type SatisfactionData = {
  score: string;
  count: number;
  percentage: number;
};

type SatisfactionDistributionChartProps = {
  data: SatisfactionData[];
};

export const SatisfactionDistributionChart = ({ data }: SatisfactionDistributionChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution de la satisfaction</CardTitle>
        <CardDescription>Répartition des appels par niveau de satisfaction</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="score" stroke="#888888" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value}`}
                yAxisId="left"
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                orientation="right"
                yAxisId="right"
              />
              <Tooltip />
              <Legend />
              <Bar 
                name="Nombre d'appels"
                dataKey="count" 
                fill="#7E69AB" 
                radius={[4, 4, 0, 0]} 
                yAxisId="left"
              />
              <Bar 
                name="Pourcentage"
                dataKey="percentage" 
                fill="#E5DEFF" 
                radius={[4, 4, 0, 0]} 
                yAxisId="right"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
