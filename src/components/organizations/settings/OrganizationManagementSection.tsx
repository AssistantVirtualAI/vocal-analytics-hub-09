
import { useState } from 'react';
import { Organization } from '@/types/organization';
import { AddOrganizationDialog } from '@/components/organizations/AddOrganizationDialog';
import { EditOrganizationDialog } from '@/components/organizations/EditOrganizationDialog';
import { OrganizationsList } from '@/components/organizations/OrganizationsList';

interface OrganizationManagementSectionProps {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isAdmin: boolean;
  onAddOrganization: (newOrg: {name: string, agentId: string, description: string}) => Promise<void>;
  onUpdateOrganization: (organization: Organization) => Promise<void>;
  onDeleteOrganization: (orgId: string) => Promise<void>;
  onSelectOrganization: (orgId: string) => void;
}

export const OrganizationManagementSection = ({
  organizations,
  currentOrganization,
  isAdmin,
  onAddOrganization,
  onUpdateOrganization,
  onDeleteOrganization,
  onSelectOrganization
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

      {organizations && organizations.length > 0 ? (
        <OrganizationsList 
          organizations={organizations}
          currentOrganization={currentOrganization}
          onEdit={handleEditOrganization}
          onDelete={onDeleteOrganization}
          onSelect={onSelectOrganization}
        />
      ) : (
        <div className="py-8 text-center text-gray-500">
          Aucune organisation disponible.
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
