
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Phone, Clock, Star, AlertTriangle, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCallStats } from "@/hooks/useCallStats";
import { useCallsList } from "@/hooks/useCallsList";
import { CallsToolbar } from "@/components/calls/CallsToolbar";
import { StatCard } from "@/components/stats/StatCard";
import { useCallsPerDay } from "@/hooks/useCallsPerDay";
import { CallsLast30DaysChart } from "@/components/stats/CallsLast30DaysChart";
import { useOrganization } from "@/context/OrganizationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
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

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDurationMinutes = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const decimal = Math.round((seconds % 60) / 6) / 10; // Convert to decimal minutes
    return `${minutes + decimal} min`;
  };

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
        title: "Erreur",
        description: "Impossible de mettre à jour les données",
        variant: "destructive"
      });
    }
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

        {!currentOrganization && renderError("Aucune organisation sélectionnée. Veuillez sélectionner une organisation dans les paramètres.")}
        
        {/* Section Statistiques Clés */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total des appels"
            value={isStatsLoading ? <Skeleton className="h-8 w-16" /> : statsData?.totalCalls || 0}
            icon={Phone}
            isLoading={isStatsLoading}
          />
          <StatCard
            title="Durée moyenne"
            value={isStatsLoading ? <Skeleton className="h-8 w-16" /> : formatDurationMinutes(statsData?.avgDuration || 0)}
            icon={Clock}
            isLoading={isStatsLoading}
          />
          <StatCard
            title="Satisfaction moyenne"
            value={isStatsLoading ? <Skeleton className="h-8 w-16" /> : `${(statsData?.avgSatisfaction || 0).toFixed(1)}/5`}
            icon={Star}
            isLoading={isStatsLoading}
          />
        </div>

        {statsError && renderError("Échec du chargement des statistiques. " + (statsError as Error).message)}

        {/* Graphique d'appels sur 30 jours */}
        <div className="grid gap-4">
          {chartError && renderError("Échec du chargement des données du graphique. " + (chartError as Error).message)}
          
          {is30DaysLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-[300px]">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-[300px] w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <CallsLast30DaysChart data={calls30DaysData || []} />
          )}
        </div>

        {/* Section Liste des Appels */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Derniers appels</CardTitle>
            <div className="text-sm text-muted-foreground">
              {!isCallsLoading && `${callsData?.totalCount || 0} appel(s) au total`}
            </div>
          </CardHeader>
          <CardContent>
            {callsError && renderError("Échec du chargement des appels. " + (callsError as Error).message)}
            
            {/* Filtres et barre de recherche */}
            <CallsToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              onFilterChange={handleFilterChange}
            />

            {/* Tableau des appels */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-left font-medium">Date</th>
                    <th className="py-3 text-left font-medium">Client</th>
                    <th className="py-3 text-left font-medium">Agent</th>
                    <th className="py-3 text-left font-medium">Durée</th>
                    <th className="py-3 text-left font-medium">Satisfaction</th>
                    <th className="py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isCallsLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={`skeleton-${i}`}>
                        <td className="py-3"><Skeleton className="h-5 w-24" /></td>
                        <td className="py-3"><Skeleton className="h-5 w-32" /></td>
                        <td className="py-3"><Skeleton className="h-5 w-20" /></td>
                        <td className="py-3"><Skeleton className="h-5 w-16" /></td>
                        <td className="py-3"><Skeleton className="h-5 w-24" /></td>
                        <td className="py-3 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : !callsData || callsData.calls.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center">
                        Aucun appel trouvé. Vérifiez votre connexion à ElevenLabs et l'ID de l'agent.
                      </td>
                    </tr>
                  ) : (
                    callsData.calls.map((call) => (
                      <tr key={call.id} className="border-b hover:bg-muted/50">
                        <td className="py-3">
                          {format(new Date(call.date), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </td>
                        <td className="py-3">{call.customerName}</td>
                        <td className="py-3">{call.agentName}</td>
                        <td className="py-3">{formatDurationMinutes(call.duration)}</td>
                        <td className="py-3">
                          <div className="flex">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={
                                    i < call.satisfactionScore
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }
                                />
                              ))}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <Link to={`/calls/${call.id}`} className="text-primary hover:underline">
                            Voir détails
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {callsData && callsData.totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <nav>
                  <ul className="flex space-x-2">
                    {Array.from({ length: callsData.totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page}>
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded ${
                            page === currentPage
                              ? "bg-primary text-white"
                              : "bg-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
