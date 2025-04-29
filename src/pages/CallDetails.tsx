
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Button } from '@/components/ui/button';
import { useCallDetails } from '@/hooks/useCallDetails';
import { useCallAudio } from '@/hooks/useCallAudio';
import { CallInformationCard } from '@/components/calls/CallInformationCard';
import { AudioPlayer } from '@/components/calls/AudioPlayer';
import { ElevenLabsAudioPlayer } from '@/components/calls/ElevenLabsAudioPlayer';
import { CallContent } from '@/components/calls/CallContent';
import { ElevenLabsStatsCard } from '@/components/calls/ElevenLabsStatsCard';

export default function CallDetails() {
  const { id } = useParams();
  
  // Fetch call details from the API
  const { data: call, isLoading: isLoadingCallDetails, error: callDetailsError } = useCallDetails(id);
  
  // Fetch the audio URL from ElevenLabs
  const { 
    data: audioData, 
    isLoading: isLoadingAudio, 
    error: audioError,
    refetch: refetchAudio 
  } = useCallAudio(id);

  // Show loading state
  if (isLoadingCallDetails) {
    return (
      <DashboardLayout>
        <div className="container p-6 space-y-6 text-center">
          <h1 className="text-3xl font-bold">Chargement des détails de l'appel...</h1>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (callDetailsError || !call) {
    return (
      <DashboardLayout>
        <div className="container p-6 space-y-6 text-center">
          <h1 className="text-3xl font-bold">Erreur</h1>
          <p>Impossible de charger les détails de l'appel.</p>
          <Link to="/calls">
            <Button>Retour à la liste des appels</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Format the date for display in the title
  const formattedDate = format(new Date(call.date), 'dd/MM/yyyy à HH:mm', { locale: fr });

  // Use ElevenLabs data for transcript and summary if available
  const transcript = audioData?.transcript || call.transcript;
  const summary = audioData?.summary || call.summary;
  // Use ElevenLabs audio URL if available, otherwise fall back to the call's audioUrl
  const audioUrl = audioData?.audioUrl || call.audioUrl;
  // Get ElevenLabs statistics if available
  const statistics = audioData?.statistics || null;

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Link to="/calls">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">Détails de l'appel du {formattedDate}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CallInformationCard call={call} />
          
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Original audio player if URL is available */}
            {call.audioUrl && (
              <AudioPlayer 
                audioUrl={call.audioUrl}
                isLoading={isLoadingCallDetails}
                error={callDetailsError}
              />
            )}
            
            {/* ElevenLabs audio player */}
            <ElevenLabsAudioPlayer 
              callId={id}
              isLoading={isLoadingAudio}
              audioUrl={audioData?.audioUrl}
              error={audioError}
              transcript={audioData?.transcript}
              onRetry={refetchAudio}
            />
            
            {/* ElevenLabs statistics card */}
            <ElevenLabsStatsCard 
              statistics={statistics}
              isLoading={isLoadingAudio}
            />
            
            <CallContent 
              summary={summary}
              transcript={transcript}
              callId={call.id}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
