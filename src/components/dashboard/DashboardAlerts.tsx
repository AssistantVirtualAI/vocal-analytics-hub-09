
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Organization } from "@/types/organization";

interface DashboardAlertsProps {
  currentOrganization: Organization | null;
  onRenderError: (message: string) => JSX.Element;
}

export function DashboardAlerts({ currentOrganization, onRenderError }: DashboardAlertsProps) {
  return (
    <>
      {!currentOrganization && onRenderError("Aucune organisation sélectionnée. Veuillez sélectionner une organisation dans les paramètres.")}
      
      {currentOrganization && !currentOrganization.agentId && (
        <Alert variant="default" className="my-4 border-yellow-400 bg-yellow-50 text-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            Aucun ID d'agent ElevenLabs configuré pour cette organisation. Veuillez configurer un ID d'agent dans les paramètres de l'organisation.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
