
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Settings } from 'lucide-react';
import { ElevenLabsCallsSection } from '@/components/dashboard/ElevenLabsCallsSection';
import { SyncElevenLabsButton } from '@/components/dashboard/SyncElevenLabsButton';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { subDays } from 'date-fns';

export default function ElevenLabsConfig() {
  const [activeTab, setActiveTab] = useState('configuration');
  const [agentId, setAgentId] = useState('QNdB45Jpgh06Hr67TzFO');
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const handleSaveAgentId = async () => {
    setIsLoading(true);
    
    try {
      // Update organization's agent ID in database
      const { error } = await supabase
        .from('organizations')
        .update({ agent_id: agentId })
        .eq('agent_id', 'QNdB45Jpgh06Hr67TzFO'); // Update the default one as an example
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Configuration sauvegardée",
        description: "L'ID de l'agent ElevenLabs a été mis à jour avec succès."
      });
    } catch (error) {
      console.error("Error saving agent ID:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de la configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    // This will be triggered after a successful sync
    toast({
      title: "Données actualisées",
      description: "Les données d'appels ont été actualisées avec succès."
    });
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
            Configuration ElevenLabs
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="appels">Appels</TabsTrigger>
          </TabsList>

          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration de l'agent</CardTitle>
                <CardDescription>
                  Configurez votre agent ElevenLabs pour la synchronisation des appels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-id">ID de l'agent ElevenLabs</Label>
                  <Input 
                    id="agent-id" 
                    value={agentId} 
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="Exemple: QNdB45Jpgh06Hr67TzFO" 
                  />
                </div>
                <Button 
                  onClick={handleSaveAgentId} 
                  disabled={isLoading || !agentId}
                  className="mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> 
                      Sauvegarder
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Synchronisation</CardTitle>
                <CardDescription>
                  Synchronisez manuellement ou configurez la synchronisation automatique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Synchronisation manuelle</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Lancez une synchronisation immédiate des appels
                    </p>
                  </div>
                  <SyncElevenLabsButton 
                    onSuccess={handleRefresh}
                    variant="default"
                    size="default"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appels" className="space-y-4">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Filtre par dates</CardTitle>
                <CardDescription>
                  Sélectionnez une période pour afficher les appels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DateRangePicker 
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </CardContent>
            </Card>
            
            <ElevenLabsCallsSection 
              agentId={agentId}
              fromDate={dateRange.from}
              toDate={dateRange.to}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
