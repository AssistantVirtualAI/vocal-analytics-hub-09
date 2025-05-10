import React from 'react';
import { CallStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface ChartDataItem {
  date: string;
  appels: number;
}

export interface DashboardCallsChartProps {
  data?: ChartDataItem[];
  callData?: CallStats;
  isLoading?: boolean;
}

export function DashboardCallsChart({ data, callData, isLoading = false }: DashboardCallsChartProps) {
  const chartData = React.useMemo(() => {
    // Use provided data if available
    if (data && data.length > 0) {
      return data;
    }
    
    // Otherwise try to generate from callData
    if (!callData?.callsPerDay) return [];
    
    return Object.entries(callData.callsPerDay)
      .map(([date, count]) => ({
        date: date.split('T')[0], // Extract just the date part
        appels: count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Show only last 14 days for better visualization
  }, [data, callData]);

  return (
    <Card className="border-secondary/20 bg-gradient-to-br from-card to-secondary/5 transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Appels par jour</CardTitle>
          <span className="bg-primary/10 text-primary px-2 py-0.5 text-xs rounded-full">
            14 derniers jours
          </span>
        </div>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-[300px]">
            <ChartContainer
              config={{
                appels: {
                  label: "Appels",
                  theme: {
                    light: "hsl(var(--primary))",
                    dark: "hsl(var(--primary))",
                  },
                }
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 24 }}>
                  <XAxis 
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent 
                        labelFormatter={(label) => {
                          const date = new Date(label as string);
                          return date.toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short'
                          });
                        }}
                      />
                    }
                  />
                  <Bar 
                    dataKey="appels"
                    fill="var(--color-appels)"
                    radius={[4, 4, 0, 0]}
                    className="hover:opacity-80"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}
