
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

export default function Calls() {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'table' | 'grid'>('table');
  
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
            <CardTitle>Appels ({filteredCalls.length})</CardTitle>
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
              <CallsList 
                calls={filteredCalls}
                view={view}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
