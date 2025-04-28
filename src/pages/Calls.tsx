
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Button } from '@/components/ui/button';
import { LayoutGrid, LayoutList } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCallsList } from '@/hooks/useCallsList';
import { SearchBar } from '@/components/calls/SearchBar';
import { FilterButton } from '@/components/calls/FilterButton';
import { CallsList } from '@/components/calls/CallsList';
import { CallsPagination } from '@/components/calls/CallsPagination';
import type { Call } from '@/types';

export default function Calls() {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { data, isLoading, error } = useCallsList({
    limit: itemsPerPage,
    page: currentPage,
    sortBy: 'date',
    sortOrder: 'desc',
    search: searchQuery
  });
  
  const calls = data?.calls || [];
  const totalPages = data?.totalPages || 1;
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePlayToggle = (call: Call) => {
    const audioElement = document.getElementById(`audio-${call.id}`) as HTMLAudioElement;
    
    if (currentlyPlaying === call.id) {
      audioElement.pause();
      setCurrentlyPlaying(null);
    } else {
      // Pause currently playing audio if exists
      if (currentlyPlaying) {
        const currentAudio = document.getElementById(`audio-${currentlyPlaying}`) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
        }
      }
      
      audioElement.play();
      setCurrentlyPlaying(call.id);
      
      // Add event listener to reset currentlyPlaying when audio ends
      audioElement.onended = () => {
        setCurrentlyPlaying(null);
      };
    }
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Liste des appels</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setView('table')}
              className={view === 'table' ? 'bg-secondary' : ''}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setView('grid')}
              className={view === 'grid' ? 'bg-secondary' : ''}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Link to="/calls/new">
              <Button>Nouvel appel</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appels ({data?.totalCount || 0})</CardTitle>
            <CardDescription>
              Liste de tous les appels enregistrés
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
              <>
                <CallsList 
                  calls={calls}
                  view={view}
                  currentlyPlaying={currentlyPlaying}
                  onPlayToggle={handlePlayToggle}
                  formatDuration={formatDuration}
                />
                
                {totalPages > 1 && (
                  <div className="mt-6">
                    <CallsPagination 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
