
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { CustomerStats } from "@/types";

type SortDirection = "asc" | "desc";
type SortField = "totalCalls" | "avgSatisfaction" | "avgDuration";

export type CustomerFiltersProps = {
  onSort: (field: SortField, direction: SortDirection) => void;
  onLimitChange: (limit: number) => void;
  currentLimit: number;
  sortField: SortField;
  sortDirection: SortDirection;
};

export const CustomerFilters = ({
  onSort,
  onLimitChange,
  currentLimit,
  sortField,
  sortDirection,
}: CustomerFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4 items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Trier par:</span>
        <Select
          value={sortField}
          onValueChange={(value) => onSort(value as SortField, sortDirection)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="totalCalls">Nombre d'appels</SelectItem>
            <SelectItem value="avgSatisfaction">Satisfaction moyenne</SelectItem>
            <SelectItem value="avgDuration">Durée moyenne</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onSort(sortField, sortDirection === "asc" ? "desc" : "asc")}
        >
          {sortDirection === "asc" ? <ArrowUp /> : <ArrowDown />}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Afficher:</span>
        <Select
          value={currentLimit.toString()}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">Top 5</SelectItem>
            <SelectItem value="10">Top 10</SelectItem>
            <SelectItem value="15">Top 15</SelectItem>
            <SelectItem value="20">Top 20</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
