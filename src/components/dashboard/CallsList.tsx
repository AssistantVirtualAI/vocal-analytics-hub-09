
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataWrapper } from "./DataWrapper";
import { Call } from "@/types";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { formatDuration } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface CallsListProps {
  calls: Call[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  isLoading: boolean;
  error: Error | null;
  orgSlug?: string;
  onPageChange: (page: number) => void;
  onSortChange: (sort: string, order: "asc" | "desc") => void;
  refetch: () => void;
}

export function CallsList({
  calls,
  totalCount,
  totalPages,
  currentPage,
  sortBy,
  sortOrder,
  isLoading,
  error,
  orgSlug,
  onPageChange,
  onSortChange,
  refetch,
}: CallsListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
        <CardTitle>Liste des appels</CardTitle>
        <div className="flex items-center space-x-2">
          <Select 
            value={`${sortBy}-${sortOrder}`} 
            onValueChange={(value) => {
              const [field, order] = value.split("-");
              onSortChange(field, order as "asc" | "desc");
            }}
          >
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataWrapper isLoading={isLoading} error={error} refetch={refetch}>
          {calls.length > 0 ? (
            <div className="space-y-4">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-accent"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{call.customerName || "Client inconnu"}</div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(call.date), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{formatDuration(call.duration)}</span>
                      {call.agentName && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{call.agentName}</span>
                        </>
                      )}
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
                            className={
                              i < (call.satisfactionScore ?? 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                    </div>
                    <Link
                      to={`/${orgSlug}/calls/${call.id}`}
                      className="text-primary hover:underline text-sm"
                    >
                      Voir détails
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">
              Aucun appel trouvé pour cette période/filtres.
            </p>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4">
              <div className="text-xs text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages || isLoading}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DataWrapper>
      </CardContent>
    </Card>
  );
}
