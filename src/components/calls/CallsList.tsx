
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Star, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Call } from '@/types';

interface CallsListProps {
  calls: Call[];
  currentlyPlaying: string | null;
  onPlayToggle: (call: Call) => void;
  formatDuration: (seconds: number) => string;
}

export const CallsList = ({ 
  calls, 
  currentlyPlaying, 
  onPlayToggle,
  formatDuration 
}: CallsListProps) => {
  return (
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
          {calls.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                Aucun appel trouvé.
              </TableCell>
            </TableRow>
          ) : (
            calls.map((call) => (
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
                    onClick={() => onPlayToggle(call)}
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
  );
};
