
import { useState } from 'react';
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
import { mockCalls } from '@/mockData';
import { Call } from '@/types';

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function Calls() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  // Filter calls based on search query
  const filteredCalls = mockCalls.filter(
    (call) => 
      call.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort calls by date (most recent first)
  const sortedCalls = [...filteredCalls].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
        currentAudio.pause();
      }
      
      audioElement.play();
      setCurrentlyPlaying(call.id);
    }
  };

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
            <CardTitle>Appels ({sortedCalls.length})</CardTitle>
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
                  {sortedCalls.map((call) => (
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
                          onEnded={() => setCurrentlyPlaying(null)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
