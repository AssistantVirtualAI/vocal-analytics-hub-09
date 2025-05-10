
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Call } from '@/types';

type SortDirection = 'asc' | 'desc';

interface SortState {
  column: string;
  direction: SortDirection;
}

interface OrgCallsTableProps {
  calls: Call[];
  isLoading: boolean;
  sortState: SortState;
  onSortChange: (column: string) => void;
  formatDuration: (seconds: number) => string;
}

export function OrgCallsTable({ calls, isLoading, sortState, onSortChange, formatDuration }: OrgCallsTableProps) {
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSortChange('date')}
            >
              <div className="flex items-center">
                Date {renderSortIcon('date')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSortChange('customerName')}
            >
              <div className="flex items-center">
                Client {renderSortIcon('customerName')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSortChange('agentName')}
            >
              <div className="flex items-center">
                Agent {renderSortIcon('agentName')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSortChange('duration')}
            >
              <div className="flex items-center">
                Durée {renderSortIcon('duration')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSortChange('satisfactionScore')}
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
          ) : calls.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Aucun appel trouvé pour les filtres sélectionnés.
              </TableCell>
            </TableRow>
          ) : (
            calls.map((call) => (
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
  );
}
