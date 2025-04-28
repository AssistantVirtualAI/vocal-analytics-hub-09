
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CallContentProps {
  summary: string;
  transcript?: string;
}

export const CallContent = ({ summary, transcript }: CallContentProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Contenu de l'appel</CardTitle>
        <CardDescription>
          Résumé et transcription de l'appel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="transcript">Transcription</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="pt-4">
            <p className="text-sm">{summary}</p>
          </TabsContent>
          <TabsContent value="transcript" className="pt-4">
            {transcript ? (
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                La transcription complète n'est pas disponible pour cet appel.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
