
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
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

type CustomerDistributionChartProps = {
  data: CustomerStats[];
};

export const CustomerDistributionChart = ({ data }: CustomerDistributionChartProps) => {
  const COLORS = ['#7E69AB', '#9b87f5', '#6E59A5', '#E5DEFF'];
  
  const customerCallDistribution = [
    { name: '1-5 appels', value: data.filter(c => c.totalCalls <= 5).length },
    { name: '6-10 appels', value: data.filter(c => c.totalCalls > 5 && c.totalCalls <= 10).length },
    { name: '11+ appels', value: data.filter(c => c.totalCalls > 10).length },
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution des clients</CardTitle>
        <CardDescription>Répartition des clients par nombre d'appels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={customerCallDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {customerCallDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${value} clients`, '']}
                labelFormatter={(name: string) => name}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
