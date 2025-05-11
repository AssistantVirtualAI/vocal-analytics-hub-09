
import { RefreshCw, CircuitBoard, Database, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncElevenLabsHistoryButton } from "./SyncElevenLabsHistoryButton";
import { GlassCard } from "@/components/ui/glass-card";

interface DashboardHeaderProps {
  lastUpdated: string;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function DashboardHeader({ lastUpdated, isLoading, onRefresh }: DashboardHeaderProps) {
  return (
    <GlassCard 
      variant="default"
      withBorder={true}
      glowEffect={true}
      className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-6"
    >
      <div className="flex items-center">
        <div className="mr-3 p-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
          <Brain className="h-6 w-6 text-primary dark:text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Insights et analyses de vos agents AI</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-sm text-muted-foreground bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-blue-100/50 dark:border-blue-800/30 shadow-sm backdrop-blur-sm">
          <Database className="h-3.5 w-3.5 mr-1.5 text-blue-500/70 dark:text-blue-400/70" />
          <span>Dernière synchro: {lastUpdated}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/30 backdrop-blur-sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 text-blue-600 dark:text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Chargement...' : 'Actualiser'}
        </Button>
        <SyncElevenLabsHistoryButton onSuccess={onRefresh} />
      </div>
    </GlassCard>
  );
}
