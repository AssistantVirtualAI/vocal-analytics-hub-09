
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useElevenLabsCalls } from '@/hooks/useElevenLabsCalls';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SyncElevenLabsButton } from './SyncElevenLabsButton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Download, Info, Play } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AGENT_ID } from '@/config/agent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useElevenLabsCallDetails } from '@/hooks/useElevenLabsCallDetails';

interface ElevenLabsCallsSectionProps {
  agentId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export function ElevenLabsCallsSection({ agentId = AGENT_ID, fromDate, toDate }: ElevenLabsCallsSectionProps) {
  const { calls, isLoading, error, refetch } = useElevenLabsCalls({
    agentId,
    fromDate,
    toDate,
    enabled: true
  });
  
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { callDetails, isLoading: isLoadingDetails } = useElevenLabsCallDetails(selectedCallId || undefined);
  
  const handleSyncSuccess = () => {
    refetch();
  };
  
  const handleViewDetails = (callId: string) => {
    setSelectedCallId(callId);
    setIsDialogOpen(true);
  };
  
  const handlePlayAudio = (audioUrl: string | null) => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audio.play();
  };
  
  return (
    <>
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
          <SyncElevenLabsButton onSuccess={handleSyncSuccess} />
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Une erreur est survenue lors de la récupération des appels.
                <div className="mt-2 text-xs overflow-auto max-h-20 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {error.toString()}
                </div>
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : calls.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Aucun appel trouvé pour cette période. Assurez-vous que votre clé API ElevenLabs est valide et que vous avez des appels disponibles.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>{format(new Date(call.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>{call.customer_name}</TableCell>
                      <TableCell>{call.duration} min</TableCell>
                      <TableCell>
                        <Badge variant={call.status === 'completed' ? 'success' : 'warning'}>
                          {call.status === 'completed' ? 'Terminé' : call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(call.id)}
                          >
                            Détails
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'appel</DialogTitle>
            <DialogDescription>
              Information détaillée sur l'appel sélectionné
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-8" />
              ))}
            </div>
          ) : callDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Client:</p>
                  <p>{callDetails.caller_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date:</p>
                  <p>{callDetails.start_time_unix ? format(new Date(callDetails.start_time_unix * 1000), 'dd/MM/yyyy HH:mm:ss') : 'Non disponible'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Durée:</p>
                  <p>{callDetails.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status:</p>
                  <Badge variant={callDetails.status === 'completed' ? 'success' : 'warning'}>
                    {callDetails.status}
                  </Badge>
                </div>
              </div>
              
              {callDetails.audio_url && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Audio:</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handlePlayAudio(callDetails.audio_url)}
                    >
                      <Play className="h-4 w-4 mr-2" /> Écouter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(callDetails.audio_url || '', '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" /> Télécharger
                    </Button>
                  </div>
                </div>
              )}
              
              {callDetails.transcript && callDetails.transcript.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Transcription:</p>
                  <div className="max-h-60 overflow-y-auto rounded-md border p-3">
                    {callDetails.transcript.map((item, index) => (
                      <div key={index} className={`mb-2 ${item.role === 'assistant' ? 'pl-4 border-l-2 border-blue-500' : ''}`}>
                        <p className="text-xs font-medium">
                          {item.role === 'assistant' ? 'Agent' : 'Client'}:
                        </p>
                        <p className="text-sm">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                Aucun détail disponible pour cet appel.
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
