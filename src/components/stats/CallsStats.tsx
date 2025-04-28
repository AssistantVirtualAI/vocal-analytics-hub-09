
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCallsPerDay } from '@/hooks/useCallsPerDay';
import { CallsPerDayChart } from '@/components/stats/CallsPerDayChart';
import { CallsLast30DaysChart } from '@/components/stats/CallsLast30DaysChart';

export function CallsStats() {
  const { data: callsPerDayData, isLoading: isChartLoading } = useCallsPerDay();
  const { data: calls30DaysData, isLoading: is30DaysLoading } = useCallsPerDay(30);

  const renderCallsChart = (data: any[], loading: boolean, title: string, description: string) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              Chargement des données...
            </div>
          ) : (
            <CallsPerDayChart data={data || []} />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-4">
      {renderCallsChart(
        callsPerDayData || [],
        isChartLoading,
        "Volume d'appels quotidiens",
        "Nombre d'appels par jour sur les 14 derniers jours"
      )}
      <CallsLast30DaysChart data={calls30DaysData || []} />
    </div>
  );
}
