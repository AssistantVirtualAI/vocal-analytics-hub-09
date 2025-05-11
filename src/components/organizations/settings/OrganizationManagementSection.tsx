
import { useState } from 'react';
import { Organization } from '@/types/organization';
import { AddOrganizationDialog } from '@/components/organizations/AddOrganizationDialog';
import { EditOrganizationDialog } from '@/components/organizations/EditOrganizationDialog';
import { OrganizationsList } from '@/components/organizations/OrganizationsList';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface OrganizationManagementSectionProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isAdmin: boolean;
  onAddOrganization: (newOrg: {name: string, agentId: string, description: string}) => Promise<void>;
  onUpdateOrganization: (organization: Organization) => Promise<void>;
  onDeleteOrganization: (orgId: string) => Promise<void>;
  onSelectOrganization: (orgId: string) => void;
  error?: Error | null;
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [orgToEdit, setOrgToEdit] = useState<Organization | null>(null);
  
  const handleEditOrganization = (org: Organization) => {
    setOrgToEdit(org);
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrganization = async (organization: Organization) => {
    await onUpdateOrganization(organization);
    setIsEditDialogOpen(false);
    setOrgToEdit(null);
  };

  console.log('[OrganizationManagementSection] Rendering with organizations:', organizations);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Gestion des organisations</h1>
        
        {isAdmin && (
          <AddOrganizationDialog onAddOrganization={onAddOrganization} data-testid="add-organization-button" />
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Une erreur est survenue lors de la récupération des organisations. 
            Détails: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {organizations && organizations.length > 0 ? (
        <OrganizationsList 
          organizations={organizations}
          currentOrganization={currentOrganization}
          onEdit={handleEditOrganization}
          onDelete={onDeleteOrganization}
          onSelect={onSelectOrganization}
        />
      ) : !error && (
        <div className="py-8 text-center text-gray-500">
          {isAdmin ? 
            "Aucune organisation disponible. Ajoutez une organisation pour commencer." :
            "Vous n'appartenez à aucune organisation. Contactez un administrateur pour être ajouté à une organisation."
          }
        </div>
      )}

      <EditOrganizationDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        organization={orgToEdit}
        onUpdate={handleUpdateOrganization}
      />
    </div>
  );
};
