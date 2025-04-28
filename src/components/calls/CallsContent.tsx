
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CallsList } from '@/components/calls/CallsList';
import { CallsPagination } from '@/components/calls/CallsPagination';
import type { Call } from '@/types';

interface CallsContentProps {
  calls: Call[];
  isLoading: boolean;
  error: Error | null;
  view: 'table' | 'grid';
  currentlyPlaying: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPlayToggle: (call: Call) => void;
  onPageChange: (page: number) => void;
  formatDuration: (seconds: number) => string;
}

export function CallsContent({
  calls,
  isLoading,
  error,
  view,
  currentlyPlaying,
  currentPage,
  totalPages,
  totalCount,
  onPlayToggle,
  onPageChange,
  formatDuration,
}: CallsContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appels ({totalCount || 0})</CardTitle>
        <CardDescription>
          Liste de tous les appels enregistrés
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">Chargement des appels...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">
            Erreur lors du chargement des appels. Veuillez réessayer.
          </div>
        ) : (
          <>
            <CallsList 
              calls={calls}
              view={view}
              currentlyPlaying={currentlyPlaying}
              onPlayToggle={onPlayToggle}
              formatDuration={formatDuration}
            />
            
            {totalPages > 1 && (
              <div className="mt-6">
                <CallsPagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
