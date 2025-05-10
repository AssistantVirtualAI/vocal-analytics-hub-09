
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Clock, Phone, Star, Info, TrendingUp, TrendingDown } from "lucide-react";
import type { CallStats } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  callStats: CallStats | undefined;
  isLoading: boolean;
  formatDuration: (seconds: number) => string;
}

export function DashboardStats({ callStats, isLoading, formatDuration }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Total des appels" 
        icon={Phone} 
        value={callStats?.totalCalls || 0}
        isLoading={isLoading}
        trend={0.2}
        trendLabel="depuis le mois dernier"
      />
      
      <StatCard 
        title="Durée moyenne" 
        icon={Clock} 
        value={formatDuration(Math.round(callStats?.avgDuration || 0))}
        isLoading={isLoading}
        trend={-0.1}
        trendLabel="depuis le mois dernier"
      />
      
      <StatCard 
        title="Satisfaction moyenne" 
        icon={Star} 
        value={`${(callStats?.avgSatisfaction || 0).toFixed(1)}/5`}
        isLoading={isLoading}
        trend={0.2}
        trendLabel="depuis le mois dernier"
      />
      
      <StatCard 
        title="Appels par jour" 
        icon={BarChart2} 
        value={((callStats?.totalCalls || 0) / 30).toFixed(1)}
        isLoading={isLoading}
        trend={0.15}
        trendLabel="depuis le mois dernier"
        hasTooltip
        tooltipText="Moyenne des appels quotidiens sur le mois en cours"
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  icon: React.ElementType;
  value: string | number;
  isLoading: boolean;
  trend?: number;
  trendLabel?: string;
  hasTooltip?: boolean;
  tooltipText?: string;
}

function StatCard({ title, icon: Icon, value, isLoading, trend = 0, trendLabel, hasTooltip, tooltipText }: StatCardProps) {
  const isPositive = trend > 0;
  const isTrendShown = trend !== 0 && !isLoading;
  
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-secondary/20 bg-gradient-to-br from-card to-secondary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {hasTooltip ? (
          <TooltipProvider>
            <div className="flex items-center">
              <CardTitle className="text-sm font-medium mr-1">{title}</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-background/90 backdrop-blur-sm border border-border/40">
                  <p>{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        ) : (
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        )}
        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {isTrendShown && (
              <div className="flex items-center text-xs mt-1">
                <span className={cn(
                  "inline-flex items-center gap-1",
                  isPositive ? "text-green-500" : "text-red-500"
                )}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isPositive && "+"}{(Math.abs(trend) * 100).toFixed(0)}%
                </span>
                {trendLabel && <span className="ml-1 text-muted-foreground">{trendLabel}</span>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
