
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';

type CallsLast30DaysChartProps = {
  data: Array<{
    date: string;
    appels: number;
  }>;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
};

export const CallsLast30DaysChart = ({ 
  data, 
  isLoading = false,
  error = null,
  onRetry 
}: CallsLast30DaysChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume d'appels quotidiens (30 jours)</CardTitle>
        <CardDescription>Évolution du nombre d'appels sur les 30 derniers jours</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {error ? (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div>Erreur lors du chargement des données: {error.message}</div>
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  className="mt-2"
                >
                  Réessayer
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Aucune donnée disponible pour cette période
          </div>
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
        )}
      </CardContent>
    </Card>
  );
};
