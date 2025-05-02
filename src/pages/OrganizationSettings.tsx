
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { OrganizationManagementSection } from '@/components/organizations/settings/OrganizationManagementSection';
import { OrganizationUserManagementSection } from '@/components/organizations/settings/OrganizationUserManagementSection';

export default function OrganizationSettings() {
  const { 
    organizations, 
    currentOrganization, 
    changeOrganization, 
    createOrganization, 
    updateOrganization, 
    deleteOrganization, 
    users, 
    fetchOrganizationUsers, 
    addUserToOrganization, 
    removeUserFromOrganization 
  } = useOrganization();
  const { isAdmin, user } = useAuth();
  
  const handleAddOrganization = async (newOrg: {name: string, agentId: string, description: string}) => {
    await createOrganization(newOrg, isAdmin, user?.id);
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <OrganizationManagementSection
          organizations={organizations}
          currentOrganization={currentOrganization}
          isAdmin={isAdmin}
          onAddOrganization={handleAddOrganization}
          onUpdateOrganization={updateOrganization}
          onDeleteOrganization={deleteOrganization}
          onSelectOrganization={changeOrganization}
        />

        <OrganizationUserManagementSection
          currentOrganization={currentOrganization}
          users={users}
          fetchOrganizationUsers={fetchOrganizationUsers}
          addUserToOrganization={addUserToOrganization}
          removeUserFromOrganization={removeUserFromOrganization}
        />
      </div>
    </DashboardLayout>
  );
}
