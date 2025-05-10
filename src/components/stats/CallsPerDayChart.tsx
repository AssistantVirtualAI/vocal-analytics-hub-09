
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
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyDataState } from './EmptyDataState';

type CallsPerDayChartProps = {
  data: Array<{
    date: string;
    appels: number;
  }>;
  isLoading?: boolean;
  onRefresh?: () => void;
};

export const CallsPerDayChart = ({ data, isLoading = false, onRefresh }: CallsPerDayChartProps) => {
  // Check if data is an array and has items
  const isDataValid = Array.isArray(data);
  
  // Count total calls in the data (safely)
  const totalCalls = isDataValid ? data.reduce((sum, item) => sum + (item.appels || 0), 0) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appels par jour</CardTitle>
        <CardDescription>Nombre d'appels sur les 14 derniers jours</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : !isDataValid ? (
          <EmptyDataState 
            title="Données invalides" 
            description="Le format des données est incorrect."
            onAction={onRefresh}
          />
        ) : totalCalls === 0 ? (
          <EmptyDataState 
            title="Aucun appel trouvé" 
            description="Aucune donnée d'appel n'est disponible pour cette période."
            onAction={onRefresh}
          />
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
};
