
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
import type { CustomerStats } from '@/types';

type CustomerSatisfactionChartProps = {
  data: CustomerStats[];
};

export const CustomerSatisfactionChart = ({ data }: CustomerSatisfactionChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Satisfaction par client</CardTitle>
        <CardDescription>Niveau moyen de satisfaction par client</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="customerName" />
              <YAxis domain={[0, 5]} />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}/5`, 'Satisfaction moyenne']}
              />
              <Legend />
              <Bar
                dataKey="avgSatisfaction"
                name="Satisfaction moyenne"
                fill="#E5DEFF"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
