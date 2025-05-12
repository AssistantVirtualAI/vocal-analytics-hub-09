
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { TimeRange } from "@/components/dashboard/TimeRangeSelector";

type CallsByDay = Record<string, number>;

interface CallsChartProps {
  data: CallsByDay;
  isLoading?: boolean;
  error?: Error | null;
  refetch?: () => void;
  timeRange?: TimeRange;
}

export function CallsChart({ 
  data, 
  isLoading = false, 
  error = null, 
  refetch,
  timeRange = '14d' 
}: CallsChartProps) {
  // Format the data for the chart
  const chartData = Object.entries(data).map(([date, count]) => ({
    date,
    calls: count,
  })).sort((a, b) => a.date.localeCompare(b.date));

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case '24h': return 'dernières 24 heures';
      case '7d': return '7 derniers jours';
      case '14d': return '14 derniers jours';
      case '30d': return '30 derniers jours';
      case 'all': return 'toute la période';
      default: return '14 derniers jours';
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Volume d'appels - {getTimeRangeLabel()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium mb-2">Erreur de chargement des données</p>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message || "Une erreur est survenue lors du chargement des données"}
            </p>
            {refetch && (
              <Button onClick={refetch} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume d'appels - {getTimeRangeLabel()}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px]">
            <Skeleton className="w-full h-full" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    try {
                      return format(parseISO(date), "d MMM", { locale: fr });
                    } catch (e) {
                      return date;
                    }
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} />
                <Tooltip 
                  formatter={(value) => [Number(value), "Appels"]}
                  labelFormatter={(date) => {
                    try {
                      return format(parseISO(date as string), "d MMMM yyyy", { locale: fr });
                    } catch (e) {
                      return date;
                    }
                  }}
                />
                <Bar dataKey="calls" fill="#4f46e5" radius={[4, 4, 0, 0]} />
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
