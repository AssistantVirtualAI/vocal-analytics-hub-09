
import { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from "@/integrations/supabase/client";
import { SyncElevenLabsHistoryButton } from './SyncElevenLabsHistoryButton';
import { SyncCallsButton } from './SyncCallsButton';
import { AGENT_ID } from '@/config/agent';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function DiagnosticPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('api');
  
  const runDiagnostic = async () => {
    if (!AGENT_ID) {
      console.error("No agent ID configured");
      return;
    }
    
    setIsRunning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke(
        'elevenlabs-diagnostic', 
        {
          body: { agentId: AGENT_ID }
        }
      );
      
      if (error) {
        console.error("Diagnostic error:", error);
        return;
      }
      
      console.log("Diagnostic results:", data);
      setResults(data?.results || null);
      
    } catch (error) {
      console.error("Error running diagnostic:", error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);
  
  const StatusBadge = ({ success }: { success: boolean }) => (
    <Badge variant={success ? "outline" : "destructive"} className="ml-2">
      {success ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3" />
      )}
    </Badge>
  );
  
  if (isRunning) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Diagnostic ElevenLabs</CardTitle>
          <CardDescription>Vérification de la configuration et de l'API</CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Diagnostic en cours...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!results) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Diagnostic ElevenLabs</CardTitle>
          <CardDescription>Vérification de la configuration et de l'API</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible d'exécuter le diagnostic. Vérifiez la console pour plus de détails.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={runDiagnostic}>Réessayer</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Diagnostic ElevenLabs</CardTitle>
            <CardDescription>Vérification de la configuration et de l'API</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={runDiagnostic} disabled={isRunning}>
            {isRunning ? 'Diagnostic...' : 'Actualiser'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api">Connexion API</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
            <TabsTrigger value="data">Données</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Connexion à l'API ElevenLabs</span>
                <StatusBadge success={results.apiConnection.success} />
              </div>
              
              {results.apiConnection.success ? (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Utilisateur: {results.apiConnection.data?.username}</p>
                  <p>Abonnement: {results.apiConnection.data?.subscription}</p>
                </div>
              ) : (
                <Alert variant="destructive" className="mt-2">
                  <AlertTitle>Erreur de connexion</AlertTitle>
                  <AlertDescription>
                    {results.apiConnection.error || "Impossible de se connecter à l'API ElevenLabs"}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <span className="font-medium">API Conversations</span>
                <StatusBadge success={results.conversationsApi.success} />
              </div>
              
              {results.conversationsApi.success ? (
                <div className="text-sm text-muted-foreground">
                  <p>{results.conversationsApi.count} conversations trouvées</p>
                </div>
              ) : (
                <Alert variant="destructive" className="mt-2">
                  <AlertTitle>Erreur API Conversations</AlertTitle>
                  <AlertDescription>
                    {results.conversationsApi.error || "Erreur lors de l'appel à l'API Conversations"}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <span className="font-medium">API Dashboard Settings</span>
                <StatusBadge success={results.dashboardSettings.success} />
              </div>
              
              {!results.dashboardSettings.success && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTitle>Erreur Dashboard Settings</AlertTitle>
                  <AlertDescription>
                    {results.dashboardSettings.error || "Erreur lors de l'appel à l'API Dashboard Settings"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="agent" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Configuration de l'agent</span>
              </div>
              
              <div className="text-sm">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">ID fourni:</span>
                  <code className="bg-muted px-1 rounded text-xs">{results.agentDetails.providedId}</code>
                </p>
                <p className="flex justify-between mt-1">
                  <span className="text-muted-foreground">ID résolu:</span>
                  <code className="bg-muted px-1 rounded text-xs">{results.agentDetails.resolvedId || "Non résolu"}</code>
                </p>
                <p className="flex justify-between mt-1">
                  <span className="text-muted-foreground">ID effectif:</span>
                  <code className="bg-muted px-1 rounded text-xs">{results.agentDetails.effectiveId}</code>
                </p>
              </div>
              
              {!results.agentDetails.resolvedId && (
                <Alert variant="default" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Attention</AlertTitle>
                  <AlertDescription>
                    L'agent n'a pas été trouvé dans la base de données. Si vous utilisez un ID externe pour la première fois, un nouvel agent sera créé automatiquement.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Base de données</span>
                <StatusBadge success={results.database?.success || false} />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>{results.database?.callsFound || 0} appels trouvés pour cet agent</p>
              </div>
              
              {results.database?.callsFound === 0 && (
                <Alert variant="default" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Aucun appel trouvé</AlertTitle>
                  <AlertDescription>
                    Aucun appel n'est présent dans la base de données pour cet agent. Essayez de synchroniser les appels.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-4 space-y-2">
                <p className="font-medium">Actions de synchronisation</p>
                <div className="flex space-x-2 mt-2">
                  <SyncElevenLabsHistoryButton agentId={AGENT_ID} variant="secondary" />
                  <SyncCallsButton agentId={AGENT_ID} variant="secondary" />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
