
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useCallsList } from '@/hooks/useCallsList';
import { CallsHeader } from '@/components/calls/CallsHeader';
import { CallsStats } from '@/components/calls/CallsStats';
import { CallsToolbar } from '@/components/calls/CallsToolbar';
import { CallsContent } from '@/components/calls/CallsContent';
import { formatDuration } from '@/utils/formatters';
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

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6 relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        
        <CallsHeader 
          view={view} 
          onViewChange={setView} 
        />

        <CallsStats />

        <CallsToolbar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={showFilters}
          onToggleFilters={handleToggleFilters}
          onFilterChange={handleFilterChange}
        />

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
        />
      </div>
    </DashboardLayout>
  );
}
