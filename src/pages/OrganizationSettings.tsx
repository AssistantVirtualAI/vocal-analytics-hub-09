
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { Organization } from '@/types/organization';
import { OrganizationsList } from '@/components/organizations/OrganizationsList';
import { AddOrganizationDialog } from '@/components/organizations/AddOrganizationDialog';
import { EditOrganizationDialog } from '@/components/organizations/EditOrganizationDialog';
import { OrganizationUsers } from '@/components/organizations/OrganizationUsers';

export default function OrganizationSettings() {
  const { organizations, currentOrganization, changeOrganization, createOrganization, updateOrganization, 
    deleteOrganization, users, fetchOrganizationUsers, addUserToOrganization, removeUserFromOrganization } = useOrganization();
  const { isAdmin } = useAuth();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [orgToEdit, setOrgToEdit] = useState<Organization | null>(null);
  
  const handleEditOrganization = (org: Organization) => {
    setOrgToEdit(org);
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrganization = async (organization: Organization) => {
    await updateOrganization(organization);
    setIsEditDialogOpen(false);
    setOrgToEdit(null);
  };

  const handleAddOrganization = async (newOrg: {name: string, agentId: string, description: string}) => {
    await createOrganization(newOrg);
  };

  const handleDeleteOrganization = async (orgId: string) => {
    await deleteOrganization(orgId);
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des organisations</h1>
          
          {isAdmin && (
            <AddOrganizationDialog onAddOrganization={handleAddOrganization} />
          )}
        </div>

        <OrganizationsList 
          organizations={organizations}
          currentOrganization={currentOrganization}
          onEdit={handleEditOrganization}
          onDelete={handleDeleteOrganization}
          onSelect={changeOrganization}
        />

        <OrganizationUsers
          currentOrganization={currentOrganization}
          users={users}
          fetchOrganizationUsers={fetchOrganizationUsers}
          addUserToOrganization={addUserToOrganization}
          removeUserFromOrganization={removeUserFromOrganization}
        />

        <EditOrganizationDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          organization={orgToEdit}
          onUpdate={handleUpdateOrganization}
        />
      </div>
    </DashboardLayout>
  );
}
