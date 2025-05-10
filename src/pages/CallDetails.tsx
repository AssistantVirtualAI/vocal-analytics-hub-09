import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Button } from '@/components/ui/button';
import { useCallDetails } from '@/hooks/useCallDetails';
import { useCallAudio } from '@/hooks/useCallAudio';
import { CallInformationCard } from '@/components/calls/CallInformationCard';
import { AudioPlayer } from '@/components/calls/AudioPlayer';
import { ElevenLabsAudioPlayer } from '@/components/calls/ElevenLabsAudioPlayer';
import { CallContent } from '@/components/calls/CallContent';
import { ElevenLabsStatsCard } from '@/components/calls/ElevenLabsStatsCard';
import { useToast } from '@/hooks/use-toast';

export default function CallDetails() {
  const { id } = useParams<{ id: string }>();
  // Using the useToast hook
  const { toast } = useToast();
  
  // Fetch call details from the API
  const { data: call, isLoading: isLoadingCallDetails, error: callDetailsError } = useCallDetails(id);
  
  // Fetch the audio URL from ElevenLabs
  const { 
    data: audioData, 
    isLoading: isLoadingAudio, 
    isFetching: isFetchingAudio,
    error: audioError,
    refetchCallAudio 
  } = useCallAudio(id);

  const handleRefresh = () => {
    // Using the toast method from the useToast hook
    toast({
      title: "Refreshing",
      description: "Updating ElevenLabs data...",
    });
    refetchCallAudio();
  };

  // Show loading state
  if (isLoadingCallDetails) {
    return (
      <DashboardLayout>
        <div className="container p-6 space-y-6 text-center">
          <h1 className="text-3xl font-bold">Loading call details...</h1>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (callDetailsError || !call) {
    return (
      <DashboardLayout>
        <div className="container p-6 space-y-6 text-center">
          <h1 className="text-3xl font-bold">Error</h1>
          <p>Unable to load call details: {callDetailsError?.message || 'Call not found.'}</p>
          <Link to="/calls">
            <Button>Back to calls list</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Format the date for display in the title
  const formattedDate = format(new Date(call.date), 'dd/MM/yyyy at HH:mm', { locale: fr });

  // Use ElevenLabs data for transcript and summary if available
  const transcript = audioData?.transcript ?? call.transcript ?? '';
  const summary = audioData?.summary ?? call.summary ?? '';
  const audioUrl = audioData?.audioUrl ?? call.audioUrl;
  const statistics = audioData?.statistics ?? null;

  // Determine specific error message for audio/stats loading
  let audioErrorMessage = '';
  if (audioError) {
    const errorCode = (audioError as any)?.code;
    switch (errorCode) {
      case 'ELEVENLABS_AUTH_ERROR':
        audioErrorMessage = "Authentication with ElevenLabs failed. Check your API key.";
        break;
      case 'ELEVENLABS_NOT_FOUND':
        audioErrorMessage = "Call not found on ElevenLabs.";
        break;
      case 'ELEVENLABS_QUOTA_EXCEEDED':
        audioErrorMessage = "ElevenLabs API quota exceeded.";
        break;
      default:
        audioErrorMessage = `Error loading ElevenLabs data: ${audioError.message || 'Unknown error'}`;
    }
  }

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Link to="/calls">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">Call details for {formattedDate}</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isFetchingAudio}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingAudio ? 'animate-spin' : ''}`} />
            {isFetchingAudio ? 'Updating...' : 'Refresh ElevenLabs Data'}
          </Button>
        </div>

        {audioErrorMessage && !isFetchingAudio && (
          <div className="p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md">
            <p className="font-medium">Error loading ElevenLabs data</p>
            <p className="text-sm">{audioErrorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CallInformationCard call={call} />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
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
              onRetry={handleRefresh}
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
