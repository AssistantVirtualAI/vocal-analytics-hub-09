
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Stethoscope } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AGENT_ID } from '@/config/agent';

interface ElevenLabsDiagnosticsButtonProps {
  agentId?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  className?: string;
  onClick?: () => void;
}

export function ElevenLabsDiagnosticsButton({
  agentId = AGENT_ID,
  variant = "outline",
  size = "sm",
  className,
  onClick
}: ElevenLabsDiagnosticsButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  
  const runDiagnostic = async () => {
    if (!agentId) {
      toast({
        title: "Erreur",
        description: "Aucun ID d'agent ElevenLabs n'est configuré",
        variant: "destructive"
      });
      return;
    }
    
    setIsRunning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke(
        'elevenlabs-diagnostic', 
        {
          body: { agentId }
        }
      );
      
      if (error) {
        console.error("Diagnostic error:", error);
        toast({
          title: "Erreur de diagnostic",
          description: error.message || "Une erreur est survenue lors du diagnostic",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Diagnostic results:", data);
      
      if (onClick) {
        onClick();
      }
      
      toast({
        title: "Diagnostic terminé",
        description: "Les résultats du diagnostic sont disponibles dans la console"
      });
      
    } catch (error) {
      console.error("Error running diagnostic:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du diagnostic ElevenLabs",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <Button
      onClick={runDiagnostic}
      disabled={isRunning}
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
    >
      <Stethoscope className="h-4 w-4" />
      {isRunning ? 'Diagnostic...' : 'Diagnostiquer API'}
    </Button>
  );
}
