
import { useState } from 'react';
import { Organization } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AddOrganizationDialog } from '@/components/organizations/AddOrganizationDialog';
import { OrganizationsList } from '@/components/organizations/OrganizationsList';
import { AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OrganizationManagementSectionProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isAdmin: boolean;
  onAddOrganization: (organization: { name: string; agentId: string; description: string }) => Promise<void>;
  onUpdateOrganization: (organization: Organization) => Promise<void>;
  onDeleteOrganization: (organizationId: string) => Promise<void>;
  onSelectOrganization: (organizationId: string) => void;
  error: Error | null;
}

export const OrganizationManagementSection = ({
  organizations,
  currentOrganization,
  isAdmin,
  onAddOrganization,
  onUpdateOrganization,
  onDeleteOrganization,
  onSelectOrganization,
  error
}: OrganizationManagementSectionProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleOpenAddDialog = () => {
    setShowAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setShowAddDialog(false);
  };

  const handleAddOrganization = async (organization: { name: string; agentId: string; description: string }) => {
    await onAddOrganization(organization);
    handleCloseAddDialog();
  };

  return (
    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-blue-100/50 dark:border-blue-900/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Organisations</CardTitle>
          <CardDescription>
            {organizations.length > 0 
              ? "Gérer vos organisations" 
              : "Vous n'avez pas encore d'organisation"}
          </CardDescription>
        </div>
        
        {isAdmin && (
          <Button 
            variant="outline" 
            onClick={handleOpenAddDialog}
            className="border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-slate-900/80"
          >
            <Plus className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
            Créer une organisation
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              {error.message || "Une erreur est survenue lors du chargement des organisations"}
            </AlertDescription>
          </Alert>
        )}
        
        {organizations.length === 0 ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-md p-4 text-center">
            {isAdmin ? (
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas encore d'organisation. Créez-en une pour commencer.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas encore accès à une organisation. Veuillez contacter un administrateur pour être ajouté à une organisation existante.
              </p>
            )}
          </div>
        ) : (
          <OrganizationsList 
            organizations={organizations}
            currentOrganization={currentOrganization}
            onEdit={onUpdateOrganization}
            onDelete={onDeleteOrganization}
            onSelect={onSelectOrganization}
          />
        )}
      </CardContent>
      
      {showAddDialog && (
        <AddOrganizationDialog
          isOpen={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAddOrganization={handleAddOrganization}
        />
      )}
    </Card>
  );
};
