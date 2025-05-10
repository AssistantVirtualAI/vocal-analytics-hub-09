
import React from 'react';
import { CallStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart3, CircuitBoard, Activity } from 'lucide-react';
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
    <Card className="border-blue-200/20 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/30 dark:to-indigo-900/20 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/10 dark:hover:shadow-blue-900/20 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400/50 via-indigo-400/50 to-purple-400/50"></div>
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Appels par jour
          </CardTitle>
          <span className="bg-blue-100/70 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 text-xs rounded-full border border-blue-200/50 dark:border-blue-700/50">
            14 derniers jours
          </span>
        </div>
        <div className="p-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/50 border border-blue-200/50 dark:border-blue-800/30">
          <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-full h-[250px] relative overflow-hidden rounded-lg border border-blue-100 dark:border-blue-800/30">
              <Skeleton className="h-full w-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CircuitBoard className="h-16 w-16 text-blue-200 dark:text-blue-800/50 animate-pulse" />
              </div>
            </div>
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
                <BarChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 24 }}
                  className="[&_.recharts-layer]:!opacity-90"
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(124, 58, 237, 0.8)" />
                      <stop offset="100%" stopColor="rgba(79, 70, 229, 0.3)" />
                    </linearGradient>
                  </defs>
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
                    dy={10}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value}
                    dx={-10}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent 
                        className="border-blue-100 dark:border-blue-800/30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm"
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
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    className="hover:opacity-80 transition-opacity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-blue-50/30 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-800/20">
            <CircuitBoard className="h-16 w-16 mb-4 text-blue-300 dark:text-blue-700/50" />
            <p>Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
