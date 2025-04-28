import { CallItem } from './CallItem';
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
  view?: 'table' | 'grid';
  currentlyPlaying: string | null;
  onPlayToggle: (call: Call) => void;
  formatDuration: (seconds: number) => string;
}

export const CallsList = ({ calls, view = 'table', currentlyPlaying, onPlayToggle, formatDuration }: CallsListProps) => {
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-4">
        {calls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun appel trouvé.
          </div>
        ) : (
          calls.map((call) => (
            <CallItem key={call.id} call={call} />
          ))
        )}
      </div>
    );
  }

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
