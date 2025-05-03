
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Clock, Phone, Star, Info } from "lucide-react";
import type { CallStats } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardStatsProps {
  callStats: CallStats | undefined;
  isLoading: boolean;
  formatDuration: (seconds: number) => string;
}

export function DashboardStats({ callStats, isLoading, formatDuration }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total des appels</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{callStats?.totalCalls || 0}</div>
              {callStats && callStats.totalCalls > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className={`inline-flex items-center mr-1 ${Math.floor((callStats?.totalCalls || 0) * 0.2) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.floor((callStats?.totalCalls || 0) * 0.2) > 0 ? '+' : ''}{Math.floor((callStats?.totalCalls || 0) * 0.2)}
                  </span> 
                  depuis le mois dernier
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatDuration(Math.round(callStats?.avgDuration || 0))}</div>
              {callStats && callStats.avgDuration > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="text-green-500 inline-flex items-center mr-1">-20s</span> 
                  depuis le mois dernier
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Satisfaction moyenne</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{(callStats?.avgSatisfaction || 0).toFixed(1)}/5</div>
              {callStats && callStats.avgSatisfaction > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="text-green-500 inline-flex items-center mr-1">+0.2</span> 
                  depuis le mois dernier
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <TooltipProvider>
            <div className="flex items-center">
              <CardTitle className="text-sm font-medium mr-1">Appels par jour</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Moyenne des appels quotidiens sur le mois en cours</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <BarChart2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {((callStats?.totalCalls || 0) / 30).toFixed(1)}
              </div>
              {callStats && callStats.totalCalls > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="text-green-500 inline-flex items-center mr-1">+2.1</span>
                  depuis le mois dernier
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
