
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Clock, Phone, Star } from "lucide-react";
import type { CallStats } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircle } from "lucide-react";

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
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-muted-foreground">
                      <path d="M7.5 11C7.22386 11 7 11.2239 7 11.5C7 11.7761 7.22386 12 7.5 12C7.77614 12 8 11.7761 8 11.5C8 11.2239 7.77614 11 7.5 11ZM7.5 3C5.55507 3 4 4.24001 4 6.25C4 6.52614 4.22386 6.75 4.5 6.75C4.77614 6.75 5 6.52614 5 6.25C5 4.87221 6.05861 4 7.5 4C8.94139 4 10 4.87221 10 6.25C10 7.0184 9.68526 7.50663 9.21071 7.85927C8.72348 8.22038 8.0468 8.43989 7.38373 8.6458C7.27136 8.6766 7.16256 8.70701 7.05876 8.73665C6.47259 8.89224 6 9.40172 6 10V10.5C6 10.7761 6.22386 11 6.5 11C6.77614 11 7 10.7761 7 10.5V10C7 9.94079 7.01758 9.88491 7.0463 9.84313C7.06756 9.81394 7.09255 9.79436 7.11424 9.78238C7.16689 9.75715 7.24015 9.73566 7.34115 9.70678C7.45131 9.67526 7.58165 9.63921 7.72252 9.59458C8.35044 9.40675 9.13466 9.15053 9.76516 8.67398C10.4035 8.189 11 7.40553 11 6.25C11 4.24001 9.44493 3 7.5 3Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
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
