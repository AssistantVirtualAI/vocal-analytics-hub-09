
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

  // Format data correctly for the chart
  const formatChartData = (data: any) => {
    // Check if data exists and is valid
    if (!data) return [];
    
    // If data is already an array in correct format, return it
    if (Array.isArray(data) && data.length > 0 && 'date' in data[0] && 'appels' in data[0]) {
      return data;
    }
    
    // If data is an object with date keys, convert to array format
    if (typeof data === 'object' && !Array.isArray(data)) {
      return Object.entries(data).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        appels: typeof count === 'number' ? count : 0
      }));
    }
    
    // Default to empty array if data format is unrecognized
    console.warn("Unrecognized data format for chart:", data);
    return [];
  };

  const formattedDayData = formatChartData(callsPerDayData);
  const formatted30DaysData = formatChartData(calls30DaysData);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Volume d'appels quotidiens</CardTitle>
          <CardDescription>Nombre d'appels par jour sur les 14 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <CallsPerDayChart 
            data={formattedDayData} 
            isLoading={isChartLoading} 
          />
        </CardContent>
      </Card>
      
      <CallsLast30DaysChart 
        data={formatted30DaysData || []} 
        isLoading={is30DaysLoading}
      />
    </div>
  );
}
