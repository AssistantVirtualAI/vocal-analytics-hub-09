
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Call } from '@/types';

interface CallInformationCardProps {
  call: Call;
}

export const CallInformationCard = ({ call }: CallInformationCardProps) => {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations de l'appel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">
              {format(new Date(call.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client</span>
            <span className="font-medium">{call.customerName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Agent</span>
            <span className="font-medium">{call.agentName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Durée</span>
            <span className="font-medium">{formatDuration(call.duration)}</span>
          </div>
          
          {call.satisfactionScore > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Satisfaction</span>
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} className={`text-lg ${i < call.satisfactionScore ? 'text-yellow-500' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {call.tags && call.tags.length > 0 && (
            <div className="pt-2">
              <span className="text-muted-foreground block mb-2">Tags</span>
              <div className="flex flex-wrap gap-1">
                {call.tags.map(tag => (
                  <span key={tag} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
