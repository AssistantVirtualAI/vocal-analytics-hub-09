
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Filter, Star, Play, Pause } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useCallsList } from '@/hooks/useCallsList';
import { Call } from '@/types';
import { useToast } from '@/hooks/use-toast';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Calls() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch calls from API
  const { data, isLoading, error } = useCallsList({
    limit: 50, // Fetch up to 50 calls
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const calls = data?.calls || [];
  
  // Filter calls based on search query
  const filteredCalls = calls.filter(
    (call) => 
      call.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle audio playback
  const togglePlayback = (call: Call) => {
    const audioElement = document.getElementById(`audio-${call.id}`) as HTMLAudioElement;
    
    if (currentlyPlaying === call.id) {
      audioElement.pause();
      setCurrentlyPlaying(null);
    } else {
      // Pause any currently playing audio
      if (currentlyPlaying) {
        const currentAudio = document.getElementById(`audio-${currentlyPlaying}`) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
        }
      }
      
      audioElement.play().catch(error => {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire l'audio. Veuillez réessayer.",
          variant: "destructive"
        });
        console.error("Audio playback error:", error);
      });
      setCurrentlyPlaying(call.id);
    }
  };

  // Handle audio playback end
  useEffect(() => {
    const handleAudioEnd = () => {
      setCurrentlyPlaying(null);
    };

    calls.forEach(call => {
      const audio = document.getElementById(`audio-${call.id}`) as HTMLAudioElement;
      if (audio) {
        audio.addEventListener('ended', handleAudioEnd);
      }
    });

    return () => {
      calls.forEach(call => {
        const audio = document.getElementById(`audio-${call.id}`) as HTMLAudioElement;
        if (audio) {
          audio.removeEventListener('ended', handleAudioEnd);
        }
      });
    };
  }, [calls]);

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Liste des appels</h1>
          <Link to="/calls/new">
            <Button>
              Nouvel appel
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appels ({filteredCalls.length})</CardTitle>
            <CardDescription>
              Liste de tous les appels enregistrés avec ElevenLabs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrer
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Tous les appels</DropdownMenuItem>
                  <DropdownMenuItem>Appels récents</DropdownMenuItem>
                  <DropdownMenuItem>Haute satisfaction</DropdownMenuItem>
                  <DropdownMenuItem>Basse satisfaction</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isLoading ? (
              <div className="py-8 text-center">Chargement des appels...</div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">
                Erreur lors du chargement des appels. Veuillez réessayer.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Satisfaction</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Audio</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCalls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Aucun appel trouvé.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCalls.map((call) => (
                        <TableRow key={call.id} className="group">
                          <TableCell>
                            {format(new Date(call.date), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{call.customerName}</div>
                          </TableCell>
                          <TableCell>{call.agentName}</TableCell>
                          <TableCell>{formatDuration(call.duration)}</TableCell>
                          <TableCell>
                            <div className="flex">
                              {Array(5)
                                .fill(0)
                                .map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={i < call.satisfactionScore ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                  />
                                ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {call.tags?.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <audio
                              id={`audio-${call.id}`}
                              src={call.audioUrl}
                              className="hidden"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePlayback(call)}
                            >
                              {currentlyPlaying === call.id ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/calls/${call.id}`}>
                              <Button variant="link" size="sm">
                                Voir détails
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
