
import { DashboardLayout } from "@/components/dashboard/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Call, CustomerStats } from "@/types";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart2, Clock, Phone, Star, Loader2, AlertTriangle, Calendar as CalendarIcon, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"; // Added pagination/sorting icons
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useOrg } from "@/context/OrgContext";
import { useOrgDashboardStats } from "@/hooks/useOrgDashboardStats";
import { useCallsPerDay } from "@/hooks/useCallsPerDay";
import { useOrgCallsList } from "@/hooks/useOrgCallsList";
import { useCustomerStats } from "@/hooks/useCustomerStats";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input"; // Added Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select

const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Helper component for loading/error states
const DataWrapper = ({ isLoading, error, children, refetch }: { isLoading: boolean; error: Error | null; children: React.ReactNode; refetch?: () => void }) => {
  if (isLoading) {
    return <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-destructive">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>Erreur lors du chargement des données.</p>
        {refetch && <Button variant="outline" size="sm" onClick={refetch} className="mt-2">Réessayer</Button>}
      </div>
    );
  }
  return <>{children}</>;
};

const CALLS_PER_PAGE = 5;

export default function Index() {
  const [activeTab, setActiveTab] = useState("overview");
  const { currentOrg } = useOrg();
  const orgSlug = currentOrg?.slug;

  // State for date range picker
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  // State for calls list filters, sorting, pagination
  const [callsPage, setCallsPage] = useState(1);
  const [callsSortBy, setCallsSortBy] = useState("date");
  const [callsSortOrder, setCallsSortOrder] = useState<"asc" | "desc">("desc");
  // Add state for filters if needed, e.g., const [agentFilter, setAgentFilter] = useState("");

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  // Fetch real data using hooks with date range and list params
  const { data: statsData, isLoading: isLoadingStats, error: errorStats, refetch: refetchStats } = useOrgDashboardStats({ orgSlug, startDate, endDate, enabled: !!orgSlug });
  const { data: callsPerDayData, isLoading: isLoadingCallsPerDay, error: errorCallsPerDay, refetch: refetchCallsPerDay } = useCallsPerDay({ orgSlug, startDate, endDate, enabled: !!orgSlug });
  const { data: callsListData, isLoading: isLoadingCallsList, error: errorCallsList, refetch: refetchCallsList } = useOrgCallsList({
    orgSlug,
    limit: CALLS_PER_PAGE,
    page: callsPage,
    sortBy: callsSortBy,
    sortOrder: callsSortOrder,
    startDate,
    endDate,
    // Pass other filters here: agentId: agentFilter, ...
    enabled: !!orgSlug && activeTab === "calls",
  });
  const { data: customerStatsData, isLoading: isLoadingCustomerStats, error: errorCustomerStats, refetch: refetchCustomerStats } = useCustomerStats({ orgSlug, startDate, endDate, enabled: !!orgSlug && activeTab === "customers" });

  // Function to refetch all overview data
  const handleRefreshOverview = () => {
    refetchStats();
    refetchCallsPerDay();
  };

  // Prepare chart data for calls per day using real data
  const chartData = useMemo(() => {
    if (!callsPerDayData) return [];
    return Object.entries(callsPerDayData)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        appels: count,
      }));
  }, [callsPerDayData]);

  // Get calls list data
  const callsList: Call[] = callsListData?.calls || [];
  const callsTotalCount = callsListData?.totalCount || 0;
  const callsTotalPages = callsListData?.totalPages || 0;

  // Get customer stats using real data
  const customerStats: CustomerStats[] = customerStatsData || [];

  // Reset page to 1 when filters/sorting change
  useEffect(() => {
    setCallsPage(1);
  }, [callsSortBy, callsSortOrder, dateRange]); // Add other filters if implemented

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord {currentOrg ? `- ${currentOrg.name}` : ""}</h1>
          <div className="flex items-center space-x-2">
             {/* Date Range Picker */}
             <Popover>
               <PopoverTrigger asChild>
                 <Button
                   id="date"
                   variant={"outline"}
                   className={cn(
                     "w-[260px] justify-start text-left font-normal",
                     !dateRange && "text-muted-foreground"
                   )}
                 >
                   <CalendarIcon className="mr-2 h-4 w-4" />
                   {dateRange?.from ? (
                     dateRange.to ? (
                       <>
                         {format(dateRange.from, "LLL dd, y", { locale: fr })} -{" "}
                         {format(dateRange.to, "LLL dd, y", { locale: fr })}
                       </>
                     ) : (
                       format(dateRange.from, "LLL dd, y", { locale: fr })
                     )
                   ) : (
                     <span>Choisir une plage de dates</span>
                   )}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-0" align="end">
                 <Calendar
                   initialFocus
                   mode="range"
                   defaultMonth={dateRange?.from}
                   selected={dateRange}
                   onSelect={setDateRange}
                   numberOfMonths={2}
                   locale={fr}
                   className="pointer-events-auto"
                 />
               </PopoverContent>
             </Popover>
             {/* Refresh Button */}
             <Button variant="outline" size="icon" onClick={handleRefreshOverview} disabled={isLoadingStats || isLoadingCallsPerDay}>
               <RefreshCw className={cn("h-4 w-4", (isLoadingStats || isLoadingCallsPerDay) && "animate-spin")} />
             </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            <TabsTrigger value="overview">Vue d\u0027ensemble</TabsTrigger>
            <TabsTrigger value="calls">Appels</TabsTrigger> {/* Updated Label */}
            <TabsTrigger value="customers">Clients</TabsTrigger>
          </TabsList>

          {/* Overview Tab Content (remains mostly the same) */}
          <TabsContent value="overview" className="space-y-4">
             <DataWrapper isLoading={isLoadingStats} error={errorStats} refetch={refetchStats}>
               {statsData && (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Stat Cards */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total des appels</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statsData.totalCalls ?? 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Durée moyenne</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(statsData.avgDuration ?? 0)}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Satisfaction moyenne</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{(statsData.avgSatisfaction ?? 0).toFixed(1)}/5</div>
                      </CardContent>
                    </Card>
                     <Card>
                       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <CardTitle className="text-sm font-medium">Appels / jour (moy)</CardTitle>
                         <BarChart2 className="h-4 w-4 text-muted-foreground" />
                       </CardHeader>
                       <CardContent>
                         <div className="text-2xl font-bold">
                           {statsData.avgCallsPerDay ? statsData.avgCallsPerDay.toFixed(1) : "N/A"}
                         </div>
                       </CardContent>
                     </Card>
                 </div>
               )}
             </DataWrapper>

            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Appels par jour</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                 <DataWrapper isLoading={isLoadingCallsPerDay} error={errorCallsPerDay} refetch={refetchCallsPerDay}>
                   {chartData.length > 0 ? (
                     <div className="h-[200px] sm:h-[300px]">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={chartData}>
                           <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                           <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} allowDecimals={false} />
                           <Tooltip />
                           <Bar dataKey="appels" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} className="cursor-pointer hover:opacity-80" />
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                   ) : (
                     <p className="text-center text-muted-foreground h-[200px] sm:h-[300px] flex items-center justify-center">Aucune donnée d\u0027appel pour cette période.</p>
                   )}
                 </DataWrapper>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calls Tab Content with Filters, Sorting, Pagination */}
          <TabsContent value="calls" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                <CardTitle>Liste des appels</CardTitle>
                <div className="flex items-center space-x-2">
                  {/* Add Filter Inputs Here if needed (e.g., Agent, Customer) */}
                  {/* <Input placeholder="Filtrer par agent..." className="h-8 w-[150px] lg:w-[250px]" /> */}
                  <Select value={`${callsSortBy}-${callsSortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split("-");
                    setCallsSortBy(field);
                    setCallsSortOrder(order as "asc" | "desc");
                  }}>
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder="Trier par..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Date (Plus récent)</SelectItem>
                      <SelectItem value="date-asc">Date (Plus ancien)</SelectItem>
                      <SelectItem value="duration-desc">Durée (Plus longue)</SelectItem>
                      <SelectItem value="duration-asc">Durée (Plus courte)</SelectItem>
                      <SelectItem value="satisfaction_score-desc">Satisfaction (Haute)</SelectItem>
                      <SelectItem value="satisfaction_score-asc">Satisfaction (Basse)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => refetchCallsList()} disabled={isLoadingCallsList} className="h-8 w-8">
                     <RefreshCw className={cn("h-4 w-4", isLoadingCallsList && "animate-spin")} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                 <DataWrapper isLoading={isLoadingCallsList} error={errorCallsList} refetch={refetchCallsList}>
                   {callsList.length > 0 ? (
                     <div className="space-y-4">
                       {callsList.map(call => (
                         <div key={call.id} className="flex items-center justify-between p-4 border rounded-md hover:bg-accent">
                           <div className="space-y-1">
                             <div className="font-medium">{call.customerName || "Client inconnu"}</div>
                             <div className="flex items-center text-sm text-muted-foreground">
                               <span>{formatDistanceToNow(new Date(call.date), { addSuffix: true, locale: fr })}</span>
                               <span className="mx-2">•</span>
                               <span>{formatDuration(call.duration)}</span>
                               {call.agentName && <><span className="mx-2">•</span><span>{call.agentName}</span></>}
                             </div>
                           </div>
                           <div className="flex items-center space-x-2">
                             <div className="flex">
                               {Array(5).fill(0).map((_, i) => (
                                 <Star key={i} size={16} className={i < (call.satisfactionScore ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                               ))}
                             </div>
                             <Link to={`/${orgSlug}/calls/${call.id}`} className="text-primary hover:underline text-sm">Voir détails</Link>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-center text-muted-foreground py-10">Aucun appel trouvé pour cette période/filtres.</p>
                   )}
                   {/* Pagination Controls */}
                   {callsTotalPages > 1 && (
                     <div className="flex items-center justify-end space-x-2 pt-4">
                       <div className="text-xs text-muted-foreground">
                         Page {callsPage} sur {callsTotalPages}
                       </div>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setCallsPage(prev => Math.max(prev - 1, 1))}
                         disabled={callsPage === 1 || isLoadingCallsList}
                       >
                         <ChevronLeft className="h-4 w-4" />
                         Précédent
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setCallsPage(prev => Math.min(prev + 1, callsTotalPages))}
                         disabled={callsPage === callsTotalPages || isLoadingCallsList}
                       >
                         Suivant
                         <ChevronRight className="h-4 w-4" />
                       </Button>
                     </div>
                   )}
                 </DataWrapper>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab Content (remains mostly the same) */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques clients</CardTitle>
                 {/* TODO: Add filtering/sorting controls here if needed */}
              </CardHeader>
              <CardContent>
                 <DataWrapper isLoading={isLoadingCustomerStats} error={errorCustomerStats} refetch={refetchCustomerStats}>
                   {customerStats.length > 0 ? (
                     <div className="space-y-4">
                       {customerStats.map(stats => (
                         <div key={stats.customerId} className="flex items-center justify-between p-4 border rounded-md hover:bg-accent">
                           <div className="space-y-1">
                             <div className="font-medium">{stats.customerName || "Client inconnu"}</div>
                             <div className="flex items-center text-sm text-muted-foreground">
                               <span>{stats.totalCalls} appels</span>
                               <span className="mx-2">•</span>
                               <span>Durée moy. {formatDuration(stats.avgDuration ?? 0)}</span>
                             </div>
                           </div>
                           <div className="flex items-center space-x-2">
                             <div className="flex">
                               {Array(5).fill(0).map((_, i) => (
                                 <Star key={i} size={16} className={i < Math.round(stats.avgSatisfaction ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
                               ))}
                             </div>
                             <Link to={`/${orgSlug}/customers/${stats.customerId}`} className="text-primary hover:underline text-sm">Voir détails</Link>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-center text-muted-foreground py-10">Aucune statistique client trouvée pour cette période.</p>
                   )}
                   {/* TODO: Add pagination if needed */}
                 </DataWrapper>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
