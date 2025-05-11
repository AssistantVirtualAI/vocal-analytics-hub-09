
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Check, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function DiagnosticPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const { toast } = useToast();
  
  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      // Run comprehensive system diagnostic
      const { data: systemResult, error: systemError } = await supabase.functions.invoke(
        'system-diagnostic',
        {}
      );
      
      if (systemError) {
        console.error("System diagnostic error:", systemError);
        setSystemStatus({ error: systemError.message });
      } else {
        setSystemStatus(systemResult);
        
        // Extract API status from system diagnostic
        setApiStatus({
          status: systemResult.api.elevenlabsConnected ? "OK" : "ERROR",
          subscriptionTier: systemResult.api.userInfo?.tier,
          error: systemResult.api.error
        });
        
        // Extract DB status from system diagnostic
        setDbStatus({
          callCount: systemResult.database.callsCount || 0,
          agents: systemResult.agents?.length || 0,
          success: systemResult.database.callsTableExists !== false,
          error: systemResult.database.countError || systemResult.database.tableCheckError
        });
      }

      // Fetch sync status from database
      const { data: latestSync, error: syncError } = await supabase
        .from('sync_status')
        .select('*')
        .eq('provider', 'elevenlabs')
        .maybeSingle();

      if (syncError) {
        console.error("Sync status fetch error:", syncError);
      } else {
        setSyncStatus(latestSync);
      }
    } catch (error) {
      console.error("Diagnostic error:", error);
      setApiStatus({ status: "ERROR", error: "Failed to run API diagnostic" });
      setDbStatus({ success: false, error: "Failed to run database diagnostic" });
      setSystemStatus({ error: "Failed to run system diagnostic" });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    runDiagnostic();
  }, []);
  
  const handleSyncElevenLabs = async () => {
    setIsLoading(true);
    try {
      // Force synchronization with default agent ID
      const { data, error } = await supabase.functions.invoke(
        'sync-elevenlabs-conversations', 
        { 
          body: { 
            agentId: "QNdB45Jpgh06Hr67TzFO", // Default agent ID from code
            usePagination: true 
          }
        }
      );
      
      if (error) {
        toast({
          title: "Erreur de synchronisation",
          description: error.message || "Une erreur s'est produite lors de la synchronisation",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Synchronisation lancée",
          description: data?.success 
            ? `${data.summary.success} conversations importées sur ${data.summary.total}`
            : "Vérifiez les journaux pour plus de détails"
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la synchronisation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // Refresh diagnostic
      setTimeout(runDiagnostic, 2000);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Jamais";
    
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy à HH:mm", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Jamais";
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Système de Diagnostic</CardTitle>
        <CardDescription>Vérifiez et réparez les problèmes de connexion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Connexion API ElevenLabs:</h3>
              {apiStatus ? (
                apiStatus.status === "OK" ? 
                  <span className="flex items-center text-green-500"><Check className="h-4 w-4 mr-1" /> OK</span> : 
                  <span className="flex items-center text-red-500"><AlertCircle className="h-4 w-4 mr-1" /> Erreur</span>
              ) : <span className="text-gray-400">Vérification...</span>}
            </div>
            {apiStatus?.subscriptionTier && (
              <p className="text-sm text-gray-600">Abonnement: {apiStatus.subscriptionTier}</p>
            )}
            {apiStatus?.error && (
              <p className="text-sm text-red-500 mt-1">{apiStatus.error}</p>
            )}
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Base de données:</h3>
              {dbStatus ? 
                <span className={dbStatus.success ? "flex items-center text-green-500" : "flex items-center text-red-500"}>
                  {dbStatus.success ? <Check className="h-4 w-4 mr-1" /> : <AlertCircle className="h-4 w-4 mr-1" />}
                  {dbStatus.callCount} appels
                </span> : 
                <span className="text-gray-400">Vérification...</span>
              }
            </div>
            {dbStatus?.agents !== undefined && (
              <p className="text-sm text-gray-600">{dbStatus.agents} agents configurés</p>
            )}
            {dbStatus?.error && (
              <p className="text-sm text-red-500 mt-1">{dbStatus.error}</p>
            )}
          </div>
        </div>
        
        {/* Synchronization Status Panel */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">Statut de la synchronisation automatique:</h3>
          <div className="space-y-2">
            {syncStatus ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    syncStatus.status === 'success' ? 'bg-green-100 text-green-800' :
                    syncStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                    syncStatus.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    syncStatus.status === 'partial_success' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {syncStatus.status === 'success' ? 'Réussite' :
                     syncStatus.status === 'error' ? 'Erreur' :
                     syncStatus.status === 'in_progress' ? 'En cours' :
                     syncStatus.status === 'partial_success' ? 'Succès partiel' :
                     syncStatus.status || 'Inconnu'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dernière synchronisation:</span>
                  <span className="text-sm font-medium flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimeAgo(syncStatus.last_sync_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Date précise:</span>
                  <span className="text-sm">{formatDate(syncStatus.last_sync_date)}</span>
                </div>
                {syncStatus.error_message && (
                  <div className="mt-2">
                    <span className="text-sm text-red-500">Erreur: {syncStatus.error_message}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  La synchronisation automatique est programmée pour s'exécuter chaque heure.
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Aucune information de synchronisation disponible.</p>
            )}
          </div>
        </div>
        
        {systemStatus && systemStatus.environment && (
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Variables d'environnement:</h3>
            <div className="text-sm space-y-1">
              <p>
                Clé ElevenLabs: {' '}
                {systemStatus.environment.elevenLabsApiKeyConfigured ? 
                  <span className="text-green-500">Configurée ({systemStatus.environment.activeElevenLabsKeyName})</span> : 
                  <span className="text-red-500">Non configurée</span>
                }
              </p>
              <p>
                Supabase URL: {' '}
                {systemStatus.environment.supabaseUrlConfigured ? 
                  <span className="text-green-500">Configurée</span> : 
                  <span className="text-red-500">Non configurée</span>
                }
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-2 pt-2">
          <Button 
            onClick={() => runDiagnostic()} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Exécuter le diagnostic
          </Button>
          
          <Button 
            onClick={handleSyncElevenLabs}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            Forcer la synchronisation avec ElevenLabs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
