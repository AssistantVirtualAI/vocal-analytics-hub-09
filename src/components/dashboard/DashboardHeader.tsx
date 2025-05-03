
import { RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/context/OrganizationContext";
import { useToast } from "@/hooks/use-toast";

interface DashboardHeaderProps {
  onRefresh: () => Promise<void>;
}

export function DashboardHeader({ onRefresh }: DashboardHeaderProps) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  const handleRefresh = async () => {
    toast({
      title: "Actualisation",
      description: "Mise à jour des données en cours...",
    });
    
    try {
      await onRefresh();
      
      toast({
        title: "Succès",
        description: "Données actualisées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les données",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord d'analyse d'appels</h1>
      <div className="flex items-center gap-4">
        {currentOrganization && (
          <div className="text-sm text-muted-foreground">
            Organisation: {currentOrganization.name}
          </div>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </Button>
      </div>
    </div>
  );
}
