
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCallsPerDay } from '@/hooks/useCallsPerDay';
import { CallsPerDayChart } from '@/components/stats/CallsPerDayChart';

export function CallsStats() {
  const { data: callsPerDayData, isLoading: isChartLoading } = useCallsPerDay();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume d'appels quotidiens</CardTitle>
        <CardDescription>Nombre d'appels par jour sur les 14 derniers jours</CardDescription>
      </CardHeader>
      <CardContent>
        {isChartLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            Chargement des données...
          </div>
        ) : (
          <CallsPerDayChart data={callsPerDayData || []} />
        )}
      </CardContent>
    </Card>
  );
}
