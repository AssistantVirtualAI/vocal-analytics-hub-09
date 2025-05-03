
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCallStats } from "@/hooks/useCallStats";
import { useCallsList } from "@/hooks/useCallsList";
import { useCallsPerDay } from "@/hooks/useCallsPerDay";
import { useOrganization } from "@/context/OrganizationContext";
import { CallsLast30DaysChart } from "@/components/stats/CallsLast30DaysChart";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";
import { KeyStatsSection } from "@/components/dashboard/KeyStatsSection";
import { CallsListSection } from "@/components/dashboard/CallsListSection";
import { formatDurationMinutes } from "@/components/dashboard/utils/formatters";

export default function Dashboard() {
  const { currentOrganization } = useOrganization();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    customerId: "",
    agentId: "",
    startDate: "",
    endDate: "",
  });

  const { 
    data: statsData, 
    isLoading: isStatsLoading, 
    error: statsError,
    refetch: refetchStats
  } = useCallStats();
  
  const { 
    data: calls30DaysData, 
    isLoading: is30DaysLoading, 
    error: chartError,
    refetch: refetchChart
  } = useCallsPerDay(30);
  
  const { 
    data: callsData, 
    isLoading: isCallsLoading, 
    error: callsError,
    refetch: refetchCalls
  } = useCallsList({
    limit: 10,
    page: currentPage,
    search: searchQuery,
    customerId: filters.customerId,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchStats(),
      refetchChart(),
      refetchCalls()
    ]);
  };

  const renderError = (message: string) => (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {message}
        {!currentOrganization && (
          <div className="mt-2">
            <p>Aucune organisation sélectionnée. Veuillez sélectionner une organisation dans les paramètres.</p>
            <Button variant="outline" className="mt-2" asChild>
              <Link to="/organizations">Aller aux paramètres d'organisation</Link>
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <DashboardHeader onRefresh={handleRefresh} />
        <DashboardAlerts 
          currentOrganization={currentOrganization} 
          onRenderError={renderError} 
        />
        
        {/* Section Statistiques Clés */}
        <KeyStatsSection 
          statsData={statsData} 
          isStatsLoading={isStatsLoading} 
          formatDurationMinutes={formatDurationMinutes} 
        />

        {statsError && renderError("Échec du chargement des statistiques. " + (statsError as Error).message)}

        {/* Graphique d'appels sur 30 jours */}
        <div className="grid gap-4">
          {chartError && renderError("Échec du chargement des données du graphique. " + (chartError as Error).message)}
          
          {is30DaysLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-[300px]">
                  <div className="space-y-2 w-full">
                    <div className="h-[300px] w-full bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <CallsLast30DaysChart data={calls30DaysData || []} />
          )}
        </div>

        {/* Section Liste des Appels */}
        <CallsListSection 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onFilterChange={handleFilterChange}
          callsData={callsData}
          isCallsLoading={isCallsLoading}
          callsError={callsError}
          formatDurationMinutes={formatDurationMinutes}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onRenderError={renderError}
        />
      </div>
    </DashboardLayout>
  );
}
