
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';

interface SyncElevenLabsButtonProps {
  onSuccess?: () => void;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SyncElevenLabsButton({
  onSuccess,
  variant = "outline",
  size = "sm"
}: SyncElevenLabsButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      console.log("Starting ElevenLabs sync...");
      
      const { data, error } = await supabase.functions.invoke('sync-elevenlabs-periodic', {
        body: { 
          debug: true // Enable verbose logging in the edge function
        }
      });
      
      console.log("Sync response:", { data, error });
      
      if (error) {
        console.error("Sync error:", error);
        toast({
          title: "Erreur de synchronisation",
          description: error.message || "Une erreur est survenue lors de la synchronisation",
          variant: "destructive"
        });
        return;
      }
      
      if (data?.success) {
        const summary = data.summary || { total: 0, success: 0, error: 0 };
        toast({
          title: "Synchronisation réussie",
          description: `${summary.success} appel(s) importés sur un total de ${summary.total}`
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Synchronisation incomplète",
          description: data?.error || "La synchronisation n'a pas pu être complétée",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error triggering sync:", error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la synchronisation",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant={variant}
      size={size}
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Synchronisation...
        </>
      ) : (
        <>
          <RotateCcw className="h-4 w-4 mr-2" />
          Synchroniser
        </>
      )}
    </Button>
  );
}
