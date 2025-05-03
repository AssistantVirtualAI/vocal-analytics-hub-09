
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCallStats } from '@/hooks/useCallStats';
import { useCustomerStats } from '@/hooks/useCustomerStats';
import { OverviewTab } from '@/components/stats/OverviewTab';
import { SatisfactionTab } from '@/components/stats/SatisfactionTab';
import { AgentsTab } from '@/components/stats/AgentsTab';
import { CustomersTab } from '@/components/stats/CustomersTab';
import { StatsOverview } from '@/components/stats/StatsOverview';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function Stats() {
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { 
    data: callStats, 
    isLoading: callStatsLoading, 
    error: callStatsError,
    refetch: refetchCallStats 
  } = useCallStats();
  
  const { 
    data: customerStats, 
    isLoading: customerStatsLoading, 
    error: customerStatsError,
    refetch: refetchCustomerStats 
  } = useCustomerStats();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const isLoading = callStatsLoading || customerStatsLoading;
  const hasError = callStatsError || customerStatsError;
  
  useEffect(() => {
    if (!isLoading && !hasError && (callStats || customerStats)) {
      setLastUpdated(new Date());
    }
  }, [isLoading, callStats, customerStats, hasError]);

  // Format the "last updated" text
  const formatLastUpdated = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'à l\'instant';
    if (diffMins === 1) return 'il y a 1 minute';
    if (diffMins < 60) return `il y a ${diffMins} minutes`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'il y a 1 heure';
    return `il y a ${diffHours} heures`;
  };

  // Generate sample data for testing if no real data
  const getSampleChartData = () => {
    if (callStats?.callsPerDay && Object.keys(callStats.callsPerDay).length > 0) {
      return Object.entries(callStats.callsPerDay)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          appels: count,
        }))
        .slice(-14);
    } else {
      // Generate sample data if no real data available
      const data = [];
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        data.push({
          date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
          appels: Math.floor(Math.random() * 10),
        });
      }
      return data;
    }
  };

  // Get chart data
  const chartData = getSampleChartData();

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchCallStats(),
        refetchCustomerStats()
      ]);
      setLastUpdated(new Date());
      toast({
        title: "Succès",
        description: "Les statistiques ont été mises à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les statistiques.",
        variant: "destructive",
      });
    }
  };

  // Skeleton loader for main stats
  const StatsOverviewSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="pt-2">
            <Skeleton className="h-8 w-[60px] mb-2" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Statistiques</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Dernière mise à jour: {formatLastUpdated()}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </div>

        {hasError && (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement des statistiques. Veuillez réessayer ultérieurement.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="ml-2"
              >
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <StatsOverviewSkeleton />
        ) : (
          <StatsOverview
            totalCalls={callStats?.totalCalls || 0}
            avgDuration={callStats?.avgDuration || 0}
            avgSatisfaction={callStats?.avgSatisfaction || 0}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid sm:inline-grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="customers">Clients</TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 h-[300px]">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="w-full h-full rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="overview">
                <OverviewTab chartData={chartData} customerStats={customerStats || []} />
              </TabsContent>
              
              <TabsContent value="satisfaction">
                <SatisfactionTab />
              </TabsContent>
              
              <TabsContent value="agents">
                <AgentsTab />
              </TabsContent>
              
              <TabsContent value="customers">
                <CustomersTab data={customerStats || []} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
