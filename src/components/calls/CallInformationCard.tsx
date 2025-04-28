
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, Share2, Star } from 'lucide-react';
import { Call } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
        <CardTitle>Informations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Date et heure</h3>
          <p>{format(new Date(call.date), 'PPPp', { locale: fr })}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
          <p className="font-medium">{call.customerName}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Agent</h3>
          <p>{call.agentName}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Durée</h3>
          <p>{formatDuration(call.duration)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Satisfaction</h3>
          <div className="flex mt-1">
            {Array(5).fill(0).map((_, i) => (
              <Star
                key={i}
                size={18}
                className={i < call.satisfactionScore ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {call.tags?.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Télécharger
        </Button>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Partager
        </Button>
      </CardFooter>
    </Card>
  );
};
