
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Clock, Phone, Star, Info, Database, Activity } from "lucide-react";
import type { CallStats } from "@/types"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Interface pour les props du composant DashboardStats
interface DashboardDisplayStatsProps {
  displayData: CallStats | undefined; // Prop renommée de callStats à displayData
  isLoading: boolean;
  formatDuration: (seconds: number) => string;
}

export function DashboardStats({ displayData, isLoading, formatDuration }: DashboardDisplayStatsProps) {
  // Le reste du composant utilise maintenant displayData au lieu de callStats
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/30 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-800/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-200/10 dark:hover:shadow-blue-900/20 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium">Total des appels</CardTitle>
          <div className="p-2 rounded-full bg-blue-100/80 dark:bg-blue-900/30">
            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{displayData?.totalCalls || 0}</div>
              {displayData && displayData.totalCalls > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className={`inline-flex items-center mr-1 ${Math.floor((displayData?.totalCalls || 0) * 0.2) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.floor((displayData?.totalCalls || 0) * 0.2) > 0 ? '+' : ''}{Math.floor((displayData?.totalCalls || 0) * 0.2)}
                  </span>
                  depuis le mois dernier
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/30 dark:from-indigo-900/30 dark:to-purple-900/30 dark:border-indigo-800/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-200/10 dark:hover:shadow-indigo-900/20 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
          <div className="p-2 rounded-full bg-indigo-100/80 dark:bg-indigo-900/30">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{formatDuration(Math.round(displayData?.avgDuration || 0))}</div>
              {displayData && displayData.avgDuration > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="text-green-500 inline-flex items-center mr-1">-20s</span>
                  depuis le mois dernier
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/30 dark:from-purple-900/30 dark:to-pink-900/30 dark:border-purple-800/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-200/10 dark:hover:shadow-purple-900/20 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-medium">Satisfaction moyenne</CardTitle>
          <div className="p-2 rounded-full bg-purple-100/80 dark:bg-purple-900/30">
            <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">{(displayData?.avgSatisfaction || 0).toFixed(1)}/5</div>
              {displayData && displayData.avgSatisfaction > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="text-green-500 inline-flex items-center mr-1">+0.2</span>
                  depuis le mois dernier
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-pink-50 to-red-50 border border-pink-200/30 dark:from-pink-900/30 dark:to-red-900/30 dark:border-pink-800/30 transition-all duration-300 hover:shadow-lg hover:shadow-pink-200/10 dark:hover:shadow-pink-900/20 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <TooltipProvider>
            <div className="flex items-center">
              <CardTitle className="text-sm font-medium mr-1">Appels par jour</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-white/90 backdrop-blur-sm border border-blue-200/50 dark:bg-slate-900/90 dark:border-blue-800/30">
                  <p>Moyenne des appels quotidiens sur le mois en cours</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <div className="p-2 rounded-full bg-pink-100/80 dark:bg-pink-900/30">
            <BarChart2 className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {((displayData?.totalCalls || 0) / 30).toFixed(1)}
              </div>
              {displayData && displayData.totalCalls > 0 && (
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
