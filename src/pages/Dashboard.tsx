
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Phone, Clock, Star } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { useCallsStats } from "@/hooks/useCallsStats";
import { useCallsList } from "@/hooks/useCallsList";
import { CallsToolbar } from "@/components/calls/CallsToolbar";
import { StatCard } from "@/components/stats/StatCard";
import { DateRange } from "@/types/calendar";
import type { Call } from "@/types";
import { useCallsPerDay } from "@/hooks/useCallsPerDay";
import { CallsLast30DaysChart } from "@/components/stats/CallsLast30DaysChart";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    customerId: "",
    agentId: "",
    startDate: "",
    endDate: "",
  });

  const { data: statsData, isLoading: isStatsLoading } = useCallsStats();
  const { data: calls30DaysData, isLoading: is30DaysLoading } = useCallsPerDay(30);
  
  const { data: callsData, isLoading: isCallsLoading } = useCallsList({
    limit: 10,
    page: currentPage,
    search: searchQuery,
    customerId: filters.customerId,
    agentId: filters.agentId,
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

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord d'analyse d'appels</h1>

        {/* Section Statistiques Clés */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total des appels"
            value={isStatsLoading ? "..." : statsData?.totalCalls || 0}
            icon={Phone}
          />
          <StatCard
            title="Durée moyenne"
            value={isStatsLoading ? "..." : formatDurationMinutes(statsData?.avgDuration || 0)}
            icon={Clock}
          />
          <StatCard
            title="Satisfaction moyenne"
            value={isStatsLoading ? "..." : `${statsData?.avgSatisfaction.toFixed(1) || 0}/5`}
            icon={Star}
          />
        </div>

        {/* Graphique d'appels sur 30 jours */}
        <div className="grid gap-4">
          {is30DaysLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-[300px]">
                  Chargement des données du graphique...
                </div>
              </CardContent>
            </Card>
          ) : (
            <CallsLast30DaysChart data={calls30DaysData || []} />
          )}
        </div>

        {/* Section Liste des Appels */}
        <Card>
          <CardContent className="p-6">
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
                    <tr>
                      <td colSpan={6} className="py-6 text-center">
                        Chargement des données...
                      </td>
                    </tr>
                  ) : callsData?.calls.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center">
                        Aucun appel trouvé.
                      </td>
                    </tr>
                  ) : (
                    callsData?.calls.map((call) => (
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
