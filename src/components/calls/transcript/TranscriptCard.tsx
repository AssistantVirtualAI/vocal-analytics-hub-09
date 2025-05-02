
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TranscriptCardProps {
  transcript?: string;
  isLoading?: boolean;
}

export const TranscriptCard = ({ transcript, isLoading = false }: TranscriptCardProps) => {
  if (!transcript && !isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcription</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <p className="whitespace-pre-line">{transcript}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
