
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Clock, Phone, Star } from "lucide-react";
import type { CallStats } from "@/types";

interface DashboardStatsProps {
  callStats: CallStats | undefined;
  isLoading: boolean;
  formatDuration: (seconds: number) => string;
}

export function DashboardStats({ callStats, isLoading, formatDuration }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
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
                <p className="text-xs text-muted-foreground">
                  +{Math.floor((callStats?.totalCalls || 0) * 0.2)} depuis le mois dernier
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card>
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
                <p className="text-xs text-muted-foreground">-20s depuis le mois dernier</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card>
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
                <p className="text-xs text-muted-foreground">+0.2 depuis le mois dernier</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Appels par jour</CardTitle>
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
                <p className="text-xs text-muted-foreground">+2.1 depuis le mois dernier</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
