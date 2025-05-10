
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useElevenLabsCalls } from '@/hooks/useElevenLabsCalls';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SyncCallsButton } from './SyncCallsButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ElevenLabsCallsSectionProps {
  agentId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export function ElevenLabsCallsSection({ agentId, fromDate, toDate }: ElevenLabsCallsSectionProps) {
  const { calls, isLoading, error, refetch } = useElevenLabsCalls({
    agentId,
    fromDate,
    toDate,
    enabled: !!agentId
  });
  
  const handleSyncSuccess = () => {
    refetch();
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Appels ElevenLabs</CardTitle>
          <CardDescription>
            {fromDate && toDate ? (
              `Du ${format(fromDate, 'dd MMMM yyyy', { locale: fr })} au ${format(toDate, 'dd MMMM yyyy', { locale: fr })}`
            ) : (
              'Tous les appels'
            )}
          </CardDescription>
        </div>
        <SyncCallsButton agentId={agentId} onSuccess={handleSyncSuccess} />
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Une erreur est survenue lors de la récupération des appels.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : calls.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun appel trouvé pour cette période.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>{format(new Date(call.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{call.customer_name}</TableCell>
                    <TableCell>{call.duration} min</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        call.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {call.status === 'completed' ? 'Terminé' : call.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
