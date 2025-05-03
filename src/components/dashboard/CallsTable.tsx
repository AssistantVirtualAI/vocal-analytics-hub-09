
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Call } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface CallsTableProps {
  calls: Call[] | undefined;
  isLoading: boolean;
  formatDurationMinutes: (seconds: number) => string;
  totalCount?: number;
  currentPage: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
}

export function CallsTable({
  calls,
  isLoading,
  formatDurationMinutes,
  totalCount = 0,
  currentPage,
  totalPages = 0,
  onPageChange,
}: CallsTableProps) {
  return (
    <>
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
            {isLoading ? (
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
            ) : !calls || calls.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center">
                  Aucun appel trouvé. Vérifiez votre connexion à ElevenLabs et l'ID de l'agent.
                </td>
              </tr>
            ) : (
              calls.map((call) => (
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

      {!isLoading && totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <nav>
            <ul className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li key={page}>
                  <button
                    onClick={() => onPageChange(page)}
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
    </>
  );
}
