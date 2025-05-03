
import { useState, useCallback } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
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
import { KeyStatsSection } from "@/components/dashboard/KeyStatsSection";
import { CallsListSection } from "@/components/dashboard/CallsListSection";
import { formatDurationMinutes } from "@/components/dashboard/utils/formatters";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
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
    toast({
      title: "Actualisation",
      description: "Mise à jour des données en cours...",
    });

    try {
      await Promise.all([
        refetchStats(),
        refetchChart(),
        refetchCalls()
      ]);
      
      toast({
        title: "Succès",
        description: "Données actualisées avec succès",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'actualiser les données"
      });
    }
  };

  const renderNoOrganizationWarning = () => {
    if (currentOrganization) return null;
    
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p>Aucune organisation sélectionnée. Veuillez sélectionner une organisation et configurer un ID d'agent pour accéder aux données.</p>
          <Button variant="outline" className="mt-2" asChild>
            <Link to="/organizations">Aller aux paramètres d'organisation</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord d'analyse d'appels</h1>
          <div className="flex items-center gap-4">
            {currentOrganization && (
              <div className="text-sm text-muted-foreground">
                Organisation: {currentOrganization.name}
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Actualiser
            </Button>
          </div>
        </div>
        
        {renderNoOrganizationWarning()}
        
        {/* Section Statistiques Clés */}
        <KeyStatsSection 
          statsData={statsData} 
          isStatsLoading={isStatsLoading} 
          statsError={statsError as Error | null}
          formatDurationMinutes={formatDurationMinutes} 
        />

        {/* Graphique d'appels sur 30 jours */}
        <div className="grid gap-4">
          <CallsLast30DaysChart 
            data={calls30DaysData || []} 
            isLoading={is30DaysLoading}
            error={chartError as Error | null}
            onRetry={() => refetchChart()}
          />
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
          onRetry={() => refetchCalls()}
        />
      </div>
    </DashboardLayout>
  );
}
