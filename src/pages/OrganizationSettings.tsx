
import { useEffect } from 'react';
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
    removeUserFromOrganization,
    isLoading 
  } = useOrganization();
  const { isAdmin, user } = useAuth();
  
  // Add debug logging to check organization data
  useEffect(() => {
    console.log('OrganizationSettings - Organizations:', organizations);
    console.log('OrganizationSettings - Current Organization:', currentOrganization);
    console.log('OrganizationSettings - Is Loading:', isLoading);
    console.log('OrganizationSettings - User:', user);
    console.log('OrganizationSettings - Is Admin:', isAdmin);
  }, [organizations, currentOrganization, isLoading, user, isAdmin]);
  
  const handleAddOrganization = async (newOrg: {name: string, agentId: string, description: string}) => {
    console.log('Adding new organization:', newOrg);
    // Create a slug from the organization name (lowercase, replace spaces with hyphens)
    const slug = newOrg.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await createOrganization({...newOrg, slug}, isAdmin, user?.id);
  };

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6 relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-400/5 dark:bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-indigo-400/5 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/5 dark:bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
        
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
          Paramètres d'organisation
        </h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-lg text-blue-600 dark:text-blue-400 animate-pulse">Chargement des organisations...</div>
          </div>
        ) : organizations && organizations.length > 0 ? (
          <>
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 space-y-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/30 dark:to-indigo-900/20 backdrop-blur-sm p-8 rounded-xl border border-blue-200/30 dark:border-blue-800/30 shadow-lg">
            <div className="text-lg text-blue-800 dark:text-blue-200">Aucune organisation trouvée.</div>
            {isAdmin && (
              <button 
                onClick={() => {
                  // Open the organization dialog - simple approach for now
                  const addOrgButton = document.querySelector('[data-testid="add-organization-button"]');
                  if (addOrgButton instanceof HTMLElement) {
                    addOrgButton.click();
                  }
                }}
                className="px-4 py-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-md shadow-md shadow-blue-500/20 dark:shadow-blue-800/20 transition-all"
              >
                Créer votre première organisation
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
