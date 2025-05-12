
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { TimeRange } from "@/components/dashboard/TimeRangeSelector";

interface ChartDataItem {
  date: string;
  appels: number;
}

interface CallsLast30DaysChartProps {
  data: ChartDataItem[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  timeRange?: TimeRange;
}

export function CallsLast30DaysChart({ 
  data, 
  isLoading = false, 
  error = null, 
  onRetry,
  timeRange = '14d'
}: CallsLast30DaysChartProps) {
  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case '24h': return 'dernières 24 heures';
      case '7d': return '7 derniers jours';
      case '14d': return '14 derniers jours';
      case '30d': return '30 derniers jours';
      case 'all': return 'toute la période';
      default: return '30 derniers jours';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume d'appels - {getTimeRangeLabel()}</CardTitle>
        <CardDescription>
          Nombre d'appels quotidiens
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Erreur de chargement des données</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message || "Une erreur est survenue lors du chargement des données"}
            </p>
            {onRetry && (
              <Button onClick={onRetry} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            )}
          </div>
        ) : data && data.length > 0 ? (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip 
                  formatter={(value) => [Number(value), "Appels"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar 
                  dataKey="appels" 
                  fill="url(#colorGradient)" 
                  radius={[4, 4, 0, 0]} 
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
