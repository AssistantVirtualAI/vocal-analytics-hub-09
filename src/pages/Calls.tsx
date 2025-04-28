
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useCallsList } from '@/hooks/useCallsList';
import { CallsHeader } from '@/components/calls/CallsHeader';
import { CallsStats } from '@/components/calls/CallsStats';
import { CallsToolbar } from '@/components/calls/CallsToolbar';
import { CallsContent } from '@/components/calls/CallsContent';
import type { Call } from '@/types';

export default function Calls() {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    customerId: '',
    agentId: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const { data, isLoading, error } = useCallsList({
    limit: itemsPerPage,
    page: currentPage,
    sortBy: 'date',
    sortOrder: 'desc',
    search: searchQuery,
    customerId: filters.customerId,
    agentId: filters.agentId,
    startDate: filters.startDate,
    endDate: filters.endDate
  });

  const calls = data?.calls || [];
  const totalPages = data?.totalPages || 1;
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
      if (currentlyPlaying) {
        const currentAudio = document.getElementById(`audio-${currentlyPlaying}`) as HTMLAudioElement;
        if (currentAudio) {
          currentAudio.pause();
        }
      }
      
      audioElement.play();
      setCurrentlyPlaying(call.id);
      
      audioElement.onended = () => {
        setCurrentlyPlaying(null);
      };
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <CallsHeader 
          view={view} 
          onViewChange={setView} 
        />

        <CallsStats />

        <CallsContent
          calls={calls}
          isLoading={isLoading}
          error={error}
          view={view}
          currentlyPlaying={currentlyPlaying}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={data?.totalCount || 0}
          onPlayToggle={handlePlayToggle}
          onPageChange={handlePageChange}
          formatDuration={formatDuration}
        />
      </div>
    </DashboardLayout>
  );
}
