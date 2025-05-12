
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeRangeButtonGroup, TimeRange } from "@/components/dashboard/TimeRangeSelector";
import { ElevenLabsDiagnosticsButton } from "@/components/dashboard/ElevenLabsDiagnosticsButton";

interface TimeRangeControlProps {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  isLoading: boolean;
  onRefresh: () => void;
  showDiagnostics: boolean;
  setShowDiagnostics: (show: boolean) => void;
}

export function TimeRangeControl({
  timeRange,
  setTimeRange,
  isLoading,
  onRefresh,
  showDiagnostics,
  setShowDiagnostics
}: TimeRangeControlProps) {
  return (
    <div className="flex items-center space-x-2">
      <ElevenLabsDiagnosticsButton 
        variant="outline" 
        size="sm" 
        className="mr-2" 
        onClick={() => setShowDiagnostics(!showDiagnostics)} 
      />
      <TimeRangeButtonGroup
        value={timeRange}
        onChange={setTimeRange}
        className="mr-2"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw
          className={cn("h-4 w-4", isLoading && "animate-spin")}
        />
      </Button>
    </div>
  );
}
