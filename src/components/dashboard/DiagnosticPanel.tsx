
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Check, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function DiagnosticPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const { toast } = useToast();
  
  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      // Test API connection
      const { data: apiResult, error: apiError } = await supabase.functions.invoke(
        'elevenlabs-api-test',
        {}
      );
      
      setApiStatus(apiError ? { status: "ERROR", error: apiError.message } : apiResult);
      
      // Get call counts
      const { data: dbResult, error: dbError } = await supabase.functions.invoke(
        'get-calls',
        { body: { limit: 1 } }
      );
      
      setDbStatus({
        callCount: dbResult?.count || 0,
        success: !dbError,
        error: dbError?.message
      });
    } catch (error) {
      console.error("Diagnostic error:", error);
      setApiStatus({ status: "ERROR", error: "Failed to run API diagnostic" });
      setDbStatus({ success: false, error: "Failed to run database diagnostic" });
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
            {dbStatus?.error && (
              <p className="text-sm text-red-500 mt-1">{dbStatus.error}</p>
            )}
          </div>
        </div>
        
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
