
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

type CustomerCallsChartProps = {
  data: CustomerStats[];
};

export const CustomerCallsChart = ({ data }: CustomerCallsChartProps) => {
  const sortedCustomers = [...data]
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top clients par nombre d'appels</CardTitle>
        <CardDescription>Les clients avec le plus grand nombre d'appels</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedCustomers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="customerName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="totalCalls"
                name="Nombre d'appels"
                fill="#7E69AB"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
