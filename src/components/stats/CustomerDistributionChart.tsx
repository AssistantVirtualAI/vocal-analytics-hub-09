
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { CustomerStats } from '@/types';
import { EmptyDataState } from './EmptyDataState';

type CustomerDistributionChartProps = {
  data: CustomerStats[];
  isLoading?: boolean;
  onRefresh?: () => void;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF66B2', '#00E5E5'];

export const CustomerDistributionChart = ({ 
  data, 
  isLoading = false,
  onRefresh 
}: CustomerDistributionChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution des Appels par Client</CardTitle>
          <CardDescription>Répartition des appels totaux par client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const totalCalls = data.reduce((sum, customer) => sum + customer.totalCalls, 0);
  
  if (totalCalls === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution des Appels par Client</CardTitle>
          <CardDescription>Répartition des appels totaux par client</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyDataState 
            title="Aucun appel trouvé" 
            description="Aucune donnée d'appel n'est disponible pour les clients."
            onAction={onRefresh}
          />
        </CardContent>
      </Card>
    );
  }
  
  // For pie chart, take top 5 customers and group the rest as "Autres"
  let chartData = [];
  
  if (data.length <= 6) {
    chartData = data.map(customer => ({
      name: customer.customerName,
      value: customer.totalCalls
    }));
  } else {
    // Get top 5
    const topCustomers = data.slice(0, 5);
    const others = data.slice(5);
    
    // Add top 5 to chart data
    chartData = topCustomers.map(customer => ({
      name: customer.customerName,
      value: customer.totalCalls
    }));
    
    // Add "Autres" category
    const othersValue = others.reduce((sum, customer) => sum + customer.totalCalls, 0);
    chartData.push({
      name: 'Autres',
      value: othersValue
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution des Appels par Client</CardTitle>
        <CardDescription>Répartition des appels totaux par client</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} appels`, 'Nombre d\'appels']} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
