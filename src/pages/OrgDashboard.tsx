
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowDownIcon, ArrowUpIcon, FilterIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StatsError } from '@/components/stats/StatsError';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CallsLast30DaysChart } from '@/components/stats/CallsLast30DaysChart';
import { Badge } from '@/components/ui/badge';
import { useOrgDashboardStats } from '@/hooks/useOrgDashboardStats';
import { DateRange } from '@/types/calendar';
import { CallsAdvancedFilter } from '@/components/calls/CallsAdvancedFilter';
import { Star } from 'lucide-react';
import { Call } from '@/types';
import { Link } from 'react-router-dom';

type SortDirection = 'asc' | 'desc';

interface SortState {
  column: string;
  direction: SortDirection;
}

export default function OrgDashboard() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [satisfactionScore, setSatisfactionScore] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [sortState, setSortState] = useState<SortState>({
    column: 'date',
    direction: 'desc'
  });

  const {
    callStats,
    calls,
    chartData,
    lastUpdated,
    isLoading,
    hasError,
    handleRefresh,
    formatDuration,
    applyFilters
  } = useOrgDashboardStats(orgSlug, {
    dateRange,
    agentId: selectedAgent,
    customerId: selectedCustomer,
    satisfactionScore: satisfactionScore ? parseInt(satisfactionScore, 10) : undefined
  });

  const handleSortChange = (column: string) => {
    setSortState(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortCalls = (callsToSort: Call[]): Call[] => {
    return [...callsToSort].sort((a, b) => {
      const direction = sortState.direction === 'asc' ? 1 : -1;
      
      switch (sortState.column) {
        case 'date':
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction;
        case 'customerName':
          return a.customerName.localeCompare(b.customerName) * direction;
        case 'agentName':
          return a.agentName.localeCompare(b.agentName) * direction;
        case 'duration':
          return (a.duration - b.duration) * direction;
        case 'satisfactionScore':
          return ((a.satisfactionScore || 0) - (b.satisfactionScore || 0)) * direction;
        default:
          return 0;
      }
    });
  };

  const sortedCalls = calls ? sortCalls(calls) : [];

  const handleApplyFilters = () => {
    applyFilters({
      dateRange,
      agentId: selectedAgent,
      customerId: selectedCustomer,
      satisfactionScore: satisfactionScore ? parseInt(satisfactionScore, 10) : undefined
    });
  };

  const handleResetFilters = () => {
    setDateRange({
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date()
    });
    setSelectedAgent('');
    setSelectedCustomer('');
    setSatisfactionScore('');
    
    applyFilters({
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date()
      },
      agentId: '',
      customerId: '',
      satisfactionScore: undefined
    });
  };

  const renderSortIcon = (column: string) => {
    if (sortState.column !== column) {
      return null;
    }
    
    return sortState.direction === 'asc' ? (
      <ArrowUpIcon className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDownIcon className="ml-1 h-4 w-4" />
    );
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <DashboardHeader
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Tableau de bord de l'organisation: {orgSlug}
          </h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="mr-2 h-4 w-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium mb-3">Filtres avancés</h3>
            <CallsAdvancedFilter
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedAgent={selectedAgent}
              onAgentChange={setSelectedAgent}
              selectedCustomer={selectedCustomer}
              onCustomerChange={setSelectedCustomer}
              satisfactionScore={satisfactionScore}
              onSatisfactionChange={setSatisfactionScore}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              isLoading={isLoading}
            />
          </div>
        )}

        {hasError ? (
          <StatsError onRetry={handleRefresh} />
        ) : (
          <>
            <DashboardStats
              callStats={callStats}
              isLoading={isLoading}
              formatDuration={formatDuration}
            />

            <CallsLast30DaysChart 
              data={chartData} 
              isLoading={isLoading} 
              error={null}
              onRetry={handleRefresh}
            />

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Derniers appels</h2>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSortChange('date')}
                      >
                        <div className="flex items-center">
                          Date {renderSortIcon('date')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSortChange('customerName')}
                      >
                        <div className="flex items-center">
                          Client {renderSortIcon('customerName')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSortChange('agentName')}
                      >
                        <div className="flex items-center">
                          Agent {renderSortIcon('agentName')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSortChange('duration')}
                      >
                        <div className="flex items-center">
                          Durée {renderSortIcon('duration')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSortChange('satisfactionScore')}
                      >
                        <div className="flex items-center">
                          Satisfaction {renderSortIcon('satisfactionScore')}
                        </div>
                      </TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="animate-pulse bg-muted/20 h-10"></TableCell>
                          <TableCell className="animate-pulse bg-muted/20 h-10"></TableCell>
                          <TableCell className="animate-pulse bg-muted/20 h-10"></TableCell>
                          <TableCell className="animate-pulse bg-muted/20 h-10"></TableCell>
                          <TableCell className="animate-pulse bg-muted/20 h-10"></TableCell>
                          <TableCell className="animate-pulse bg-muted/20 h-10"></TableCell>
                          <TableCell className="animate-pulse bg-muted/20 h-10"></TableCell>
                        </TableRow>
                      ))
                    ) : sortedCalls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Aucun appel trouvé pour les filtres sélectionnés.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedCalls.map((call) => (
                        <TableRow key={call.id} className="hover:bg-muted/50">
                          <TableCell>
                            {format(new Date(call.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
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
                                    className={i < (call.satisfactionScore || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
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
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
