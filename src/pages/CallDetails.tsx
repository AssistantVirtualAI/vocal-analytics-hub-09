
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Play, Pause, Star, Download, Share2 } from 'lucide-react';
import { mockCalls } from '@/mockData';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect, useRef } from 'react';
import { useCallDetails } from '@/hooks/useCallDetails';
import { useCallAudio } from '@/hooks/useCallAudio';
import { useToast } from '@/hooks/use-toast';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function CallDetails() {
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  
  // Fetch call details from the API
  const { data: call, isLoading: isLoadingCallDetails, error: callDetailsError } = useCallDetails(id);
  
  // Fetch the audio URL from ElevenLabs
  const { data: audioData, isLoading: isLoadingAudio, error: audioError } = useCallAudio(id);
  
  // Set up audio controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('durationchange', handleDuration);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('durationchange', handleDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire l'audio. Veuillez réessayer.",
          variant: "destructive"
        });
        console.error("Audio playback error:", error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };

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

  // Use ElevenLabs data for transcript and summary if available
  const transcript = audioData?.transcript || call.transcript;
  const summary = audioData?.summary || call.summary;
  // Use ElevenLabs audio URL if available, otherwise fall back to the call's audioUrl
  const audioUrl = audioData?.audioUrl || call.audioUrl;

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
          <h1 className="text-2xl sm:text-3xl font-bold">Détails de l'appel</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Date et heure</h3>
                <p>{format(new Date(call.date), 'PPPp', { locale: fr })}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                <p className="font-medium">{call.customerName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Agent</h3>
                <p>{call.agentName}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Durée</h3>
                <p>{formatDuration(call.duration)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Satisfaction</h3>
                <div className="flex mt-1">
                  {Array(5).fill(0).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < call.satisfactionScore ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {call.tags?.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
              <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Partager
              </Button>
            </CardFooter>
          </Card>

          <div className="col-span-1 lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enregistrement audio</CardTitle>
                {isLoadingAudio && (
                  <CardDescription>Chargement de l'audio depuis ElevenLabs...</CardDescription>
                )}
                {audioError && (
                  <CardDescription className="text-red-500">
                    Erreur lors du chargement de l'audio. Utilisation de l'audio par défaut.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="bg-secondary rounded-md p-4">
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
                      onClick={togglePlayback}
                      disabled={isLoadingAudio}
                    >
                      {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <div className="flex-1">
                      <div className="h-2 bg-secondary-foreground/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs">
                        <span>{formatDuration(Math.floor(currentTime))}</span>
                        <span>{formatDuration(Math.floor(duration))}</span>
                      </div>
                    </div>
                  </div>
                  <audio ref={audioRef} src={audioUrl} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Contenu de l'appel</CardTitle>
                <CardDescription>
                  Résumé et transcription de l'appel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary">Résumé</TabsTrigger>
                    <TabsTrigger value="transcript">Transcription</TabsTrigger>
                  </TabsList>
                  <TabsContent value="summary" className="pt-4">
                    <p className="text-sm">{summary}</p>
                  </TabsContent>
                  <TabsContent value="transcript" className="pt-4">
                    {transcript ? (
                      <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        La transcription complète n'est pas disponible pour cet appel.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
