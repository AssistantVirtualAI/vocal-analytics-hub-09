
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCallsChart } from '@/components/dashboard/DashboardCallsChart';
import { RecentCallsList } from '@/components/dashboard/RecentCallsList';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsError } from '@/components/stats/StatsError';
import { EmptyDataState } from '@/components/stats/EmptyDataState';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Star } from 'lucide-react';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    callStats,
    customerStats,
    recentCalls,
    chartData,
    lastUpdated,
    isLoading,
    hasError,
    handleRefresh
  } = useDashboardStats();

  // Check if we have no data after loading
  const hasNoData = !isLoading && !hasError && (
    (!callStats || Object.keys(callStats).length === 0) && 
    (!customerStats || customerStats.length === 0) &&
    (!recentCalls || recentCalls.length === 0)
  );
  
  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <DashboardHeader 
          lastUpdated={lastUpdated} 
          isLoading={isLoading} 
          onRefresh={handleRefresh} 
        />

        {hasError && (
          <StatsError onRetry={handleRefresh} />
        )}

        {hasNoData && (
          <EmptyDataState
            title="Aucune donnée disponible"
            description="Aucune donnée d'appel n'a été trouvée. Veuillez vérifier votre configuration ou ajouter des données d'appel."
            onAction={handleRefresh}
            actionLabel="Actualiser"
          />
        )}

        {!hasError && !hasNoData && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="calls">Appels récents</TabsTrigger>
              <TabsTrigger value="customers">Clients</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <DashboardStats 
                callStats={callStats} 
                isLoading={isLoading} 
                formatDuration={formatDuration} 
              />
              <DashboardCallsChart 
                data={chartData} 
                isLoading={isLoading} 
              />
            </TabsContent>
            
            <TabsContent value="calls" className="space-y-4">
              <RecentCallsList 
                calls={recentCalls} 
                isLoading={isLoading} 
                formatDuration={formatDuration} 
              />
            </TabsContent>
            
            <TabsContent value="customers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques clients</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                          <div className="space-y-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                          <div>
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !customerStats || customerStats.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Aucune statistique client trouvée.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerStats.map(stats => (
                        <div 
                          key={stats.customerId} 
                          className="flex items-center justify-between p-4 border rounded-md hover:bg-accent cursor-pointer transition-colors duration-200"
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{stats.customerName}</div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <span>{stats.totalCalls} appels</span>
                              <span className="mx-2">•</span>
                              <span>Durée moy. {formatDuration(Math.round(stats.avgDuration))}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {Array(5)
                                .fill(0)
                                .map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={i < Math.round(stats.avgSatisfaction) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                  />
                                ))}
                            </div>
                            <Link 
                              to={`/customers/${stats.customerId}`} 
                              className="text-primary hover:underline text-sm"
                            >
                              Voir détails
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
