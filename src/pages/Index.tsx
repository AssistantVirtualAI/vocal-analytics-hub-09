
import { DashboardLayout } from "@/components/dashboard/Layout";
import { useState } from "react";
import { useOrg } from "@/context/OrgContext";
import { DiagnosticPanel } from "@/components/dashboard/DiagnosticPanel";
import { CallsList } from "@/components/dashboard/CallsList";
import { CustomerStatsList } from "@/components/dashboard/CustomerStatsList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { OverviewTabContent } from "@/components/dashboard/OverviewTabContent";

// Import our specialized hooks
import { 
  useStats, 
  useCallsData, 
  useCustomerData, 
  useChartData,
  useTimeRange
} from "@/hooks/dashboard";

const CALLS_PER_PAGE = 5;

export default function Index() {
  const [activeTab, setActiveTab] = useState("overview");
  const { currentOrg } = useOrg();
  const orgSlug = currentOrg?.slug;
  
  // Use our time range hook
  const { timeRange, setTimeRange, dateRange } = useTimeRange();

  // State for calls list filters, sorting, pagination
  const [callsPage, setCallsPage] = useState(1);
  const [callsSortBy, setCallsSortBy] = useState("date");
  const [callsSortOrder, setCallsSortOrder] = useState<"asc" | "desc">("desc");
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Use our specialized hooks with the time range
  const { 
    statsData, 
    isLoading: isLoadingStats, 
    error: errorStats, 
    refetch: refetchStats 
  } = useStats({
    orgSlug,
    dateRange,
    enabled: !!orgSlug
  });

  const { 
    chartData, 
    isLoading: isLoadingChartData, 
    error: errorChartData, 
    refetch: refetchChartData 
  } = useChartData({
    orgSlug,
    dateRange,
    enabled: !!orgSlug
  });

  const { 
    callsList, 
    totalCount: callsTotalCount, 
    totalPages: callsTotalPages, 
    isLoading: isLoadingCallsList, 
    error: errorCallsList, 
    refetch: refetchCallsList 
  } = useCallsData({
    orgSlug,
    dateRange,
    page: callsPage,
    limit: CALLS_PER_PAGE,
    sortBy: callsSortBy,
    sortOrder: callsSortOrder,
    enabled: !!orgSlug && activeTab === "calls"
  });

  const { 
    customerStats, 
    isLoading: isLoadingCustomerStats, 
    error: errorCustomerStats, 
    refetch: refetchCustomerStats 
  } = useCustomerData({
    orgSlug,
    dateRange,
    enabled: !!orgSlug && activeTab === "customers"
  });

  // Function to refetch all overview data
  const handleRefreshOverview = () => {
    refetchStats();
    refetchChartData();
  };

  // Handle sort change
  const handleSortChange = (sort: string, order: "asc" | "desc") => {
    setCallsSortBy(sort);
    setCallsSortOrder(order);
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <DashboardHeader
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          isLoading={isLoadingStats || isLoadingChartData}
          onRefresh={handleRefreshOverview}
          showDiagnostics={showDiagnostics}
          setShowDiagnostics={setShowDiagnostics}
        />

        {/* Diagnostic Panel - conditionally shown */}
        {showDiagnostics && (
          <div className="mb-6">
            <DiagnosticPanel />
          </div>
        )}

        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          overviewContent={
            <OverviewTabContent
              statsData={statsData}
              isLoadingStats={isLoadingStats}
              errorStats={errorStats}
              refetchStats={refetchStats}
              callsPerDayData={statsData?.callsPerDay || {}}
              isLoadingChartData={isLoadingChartData}
              errorChartData={errorChartData}
              refetchChartData={refetchChartData}
              timeRange={timeRange}
            />
          }
          callsContent={
            <CallsList 
              calls={callsList}
              totalCount={callsTotalCount}
              totalPages={callsTotalPages}
              currentPage={callsPage}
              sortBy={callsSortBy}
              sortOrder={callsSortOrder}
              isLoading={isLoadingCallsList}
              error={errorCallsList as Error}
              orgSlug={orgSlug || ""}
              onPageChange={setCallsPage}
              onSortChange={handleSortChange}
              refetch={refetchCallsList}
              timeRange={timeRange}
            />
          }
          customersContent={
            <CustomerStatsList 
              customerStats={customerStats}
              isLoading={isLoadingCustomerStats}
              error={errorCustomerStats}
              orgSlug={orgSlug}
              refetch={refetchCustomerStats}
              timeRange={timeRange}
            />
          }
        />
      </div>
    </DashboardLayout>
  );
}
