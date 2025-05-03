
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface ChartData {
  date: string;
  appels: number;
}

interface DashboardCallsChartProps {
  data: ChartData[];
  isLoading: boolean;
}

export function DashboardCallsChart({ data, isLoading }: DashboardCallsChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Appels par jour</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {isLoading ? (
          <div className="h-[200px] sm:h-[300px] flex items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[200px] sm:h-[300px] flex items-center justify-center text-muted-foreground">
            Aucune donnée d'appel disponible
          </div>
        ) : (
          <div className="h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip />
                <Bar 
                  dataKey="appels" 
                  name="Nombre d'appels"
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
}
