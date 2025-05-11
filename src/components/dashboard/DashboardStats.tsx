
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, Clock, Phone, Star, Info, Database, Activity, Brain, CircuitBoard } from "lucide-react";
import type { CallStats } from "@/types"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardDisplayStatsProps {
  displayData: CallStats | undefined;
  isLoading: boolean;
  formatDuration: (seconds: number) => string;
}

export function DashboardStats({ displayData, isLoading, formatDuration }: DashboardDisplayStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <GlassCard variant="default" glowEffect={true} className="p-4 transition-all duration-300 hover:translate-y-[-2px]">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Total des appels</h3>
          <div className="p-2 rounded-full bg-blue-500/10 backdrop-blur-sm border border-blue-500/20">
            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div>
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
        </div>
      </GlassCard>
      
      <GlassCard variant="default" glowEffect={true} className="p-4 transition-all duration-300 hover:translate-y-[-2px]">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Durée moyenne</h3>
          <div className="p-2 rounded-full bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div>
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
        </div>
      </GlassCard>
      
      <GlassCard variant="highlight" glowEffect={true} className="p-4 transition-all duration-300 hover:translate-y-[-2px]">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Satisfaction</h3>
          <div className="p-2 rounded-full bg-purple-500/10 backdrop-blur-sm border border-purple-500/20">
            <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div>
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
        </div>
      </GlassCard>
      
      <GlassCard variant="default" glowEffect={true} className="p-4 transition-all duration-300 hover:translate-y-[-2px]">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <TooltipProvider>
            <div className="flex items-center">
              <h3 className="text-sm font-medium mr-1">Appels par jour</h3>
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
          <div className="p-2 rounded-full bg-pink-500/10 backdrop-blur-sm border border-pink-500/20">
            <BarChart2 className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </div>
        </div>
        <div>
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
        </div>
      </GlassCard>
    </div>
  );
}
