
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TranscriptCardProps {
  transcript?: string;
}

export const TranscriptCard = ({ transcript }: TranscriptCardProps) => {
  if (!transcript) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <p className="whitespace-pre-line">{transcript}</p>
        </div>
      </CardContent>
    </Card>
  );
};
