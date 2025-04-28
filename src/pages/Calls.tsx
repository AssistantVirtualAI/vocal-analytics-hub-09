
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCallsList } from '@/hooks/useCallsList';
import { useToast } from '@/hooks/use-toast';
import { SearchBar } from '@/components/calls/SearchBar';
import { FilterButton } from '@/components/calls/FilterButton';
import { CallsList } from '@/components/calls/CallsList';
import type { Call } from '@/types';

export default function Calls() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { data, isLoading, error } = useCallsList({
    limit: 50,
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  const calls = data?.calls || [];
  
  const filteredCalls = calls.filter(
    (call) => 
      call.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePlayback = (call: Call) => {
    const audioElement = document.getElementById(`audio-${call.id}`) as HTMLAudioElement;
    
    if (currentlyPlaying === call.id) {
      audioElement.pause();
      setCurrentlyPlaying(null);
    } else {
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
            <Button>Nouvel appel</Button>
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
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <FilterButton />
            </div>

            {isLoading ? (
              <div className="py-8 text-center">Chargement des appels...</div>
            ) : error ? (
              <div className="py-8 text-center text-red-500">
                Erreur lors du chargement des appels. Veuillez réessayer.
              </div>
            ) : (
              <CallsList 
                calls={filteredCalls}
                currentlyPlaying={currentlyPlaying}
                onPlayToggle={togglePlayback}
                formatDuration={formatDuration}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
