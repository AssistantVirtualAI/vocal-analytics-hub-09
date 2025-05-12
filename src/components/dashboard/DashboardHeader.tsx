
import { useOrg } from "@/context/OrgContext";
import { TimeRangeControl } from "./TimeRangeControl";
import { TimeRange } from "./TimeRangeSelector";

interface DashboardHeaderProps {
  timeRange?: TimeRange;
  setTimeRange?: (range: TimeRange) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  showDiagnostics?: boolean;
  setShowDiagnostics?: (show: boolean) => void;
  lastUpdated?: string; // Added the lastUpdated prop
}

export function DashboardHeader({
  timeRange,
  setTimeRange,
  isLoading = false,
  onRefresh = () => {},
  showDiagnostics = false,
  setShowDiagnostics = () => {},
  lastUpdated
}: DashboardHeaderProps) {
  const { currentOrg } = useOrg();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Tableau de bord {currentOrg ? `- ${currentOrg.name}` : ""}
        </h1>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : {lastUpdated}
          </p>
        )}
      </div>
      {timeRange && setTimeRange && (
        <TimeRangeControl
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          isLoading={isLoading}
          onRefresh={onRefresh}
          showDiagnostics={showDiagnostics}
          setShowDiagnostics={setShowDiagnostics}
        />
      )}
    </div>
  );
}
