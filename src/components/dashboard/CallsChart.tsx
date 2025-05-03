
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataWrapper } from "./DataWrapper";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface CallsChartProps {
  chartData: Array<{ date: string; appels: number }>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function CallsChart({ chartData, isLoading, error, refetch }: CallsChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Appels par jour</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <DataWrapper isLoading={isLoading} error={error} refetch={refetch}>
          {chartData.length > 0 ? (
            <div className="h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                    allowDecimals={false}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="appels"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    className="cursor-pointer hover:opacity-80"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground h-[200px] sm:h-[300px] flex items-center justify-center">
              Aucune donnée d\u0027appel pour cette période.
            </p>
          )}
        </DataWrapper>
      </CardContent>
    </Card>
  );
}
