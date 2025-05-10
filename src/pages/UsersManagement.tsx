import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useOrganization } from '@/context/OrganizationContext';
import { AllUsersSection } from '@/components/users/AllUsersSection';
import { OrganizationUsersSection } from '@/components/users/OrganizationUsersSection';
import { AdminProtectedRoute } from '@/components/users/AdminProtectedRoute';
import { useUsersManagement } from '@/hooks/users/useUsersManagement';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminRoles } from '@/hooks/users/useAdminRoles';

export default function UsersManagement() {
  const { organizations } = useOrganization();
  const { user } = useAuth();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  
  // Initialize organization selection
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg) {
      console.log('Setting initial organization:', organizations[0].id);
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations, selectedOrg]);

  const {
    orgUsers,
    allUsers,
    loading,
    orgUsersLoading,
    allUsersLoading,
    fetchUsers,
    loadAllUsers,
    addUserToOrg,
    refreshAllData
  } = useUsersManagement(selectedOrg);
  
  // Get admin roles status
  const {
    checkCurrentUserPermissions,
    currentUserIsOrgAdmin,
    currentUserIsSuperAdmin
  } = useAdminRoles(selectedOrg, user?.id, fetchUsers);

  // Check admin permissions on mount and when organization changes
  useEffect(() => {
    if (user?.id && selectedOrg) {
      console.log("Checking admin permissions for user:", user.id);
      checkCurrentUserPermissions();
    }
  }, [user?.id, selectedOrg, checkCurrentUserPermissions]);

  // Debug logging
  console.log('UsersManagement - Selected org:', selectedOrg);
  console.log('UsersManagement - Organizations:', organizations);
  console.log('UsersManagement - Org users:', orgUsers);
  console.log('UsersManagement - Loading states:', { loading, orgUsersLoading, allUsersLoading });
  console.log('UsersManagement - Admin states:', { currentUserIsOrgAdmin, currentUserIsSuperAdmin });

  // Add a more visible log for troubleshooting
  useEffect(() => {
    if (!orgUsersLoading && orgUsers.length === 0 && selectedOrg) {
      console.log('⚠️ No users found for organization:', selectedOrg);
    } else if (!orgUsersLoading && orgUsers.length > 0) {
      console.log('✅ Found', orgUsers.length, 'users for organization:', selectedOrg);
    }
  }, [orgUsers, orgUsersLoading, selectedOrg]);

  const handleRefresh = async () => {
    try {
      toast.info("Actualisation des données utilisateurs...");
      await refreshAllData();
      await checkCurrentUserPermissions();
      toast.success("Données utilisateurs actualisées");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Erreur lors de l'actualisation des données");
    }
  };

  return (
    <AdminProtectedRoute>
      <DashboardLayout>
        <div className="container p-4 sm:p-6 space-y-6 relative z-10">
          {/* Decorative elements */}
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-400/5 dark:bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-purple-400/5 dark:bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Gestion des utilisateurs</h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh} 
              className="ml-auto border-blue-200/50 dark:border-blue-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
              Actualiser
            </Button>
          </div>

          <AllUsersSection 
            users={allUsers} 
            fetchUsers={fetchUsers}  
            loading={allUsersLoading}
            loadAllUsers={loadAllUsers}
          />

          <OrganizationUsersSection
            organizations={organizations}
            selectedOrg={selectedOrg}
            onSelectOrg={(orgId) => {
              console.log('Selecting organization:', orgId);
              setSelectedOrg(orgId);
            }}
            users={orgUsers}
            fetchUsers={fetchUsers}
            onAddUser={addUserToOrg}
            loading={loading}
            usersLoading={orgUsersLoading}
            currentUserIsOrgAdmin={currentUserIsOrgAdmin}
            currentUserIsSuperAdmin={currentUserIsSuperAdmin}
          />
        </div>
      </DashboardLayout>
    </AdminProtectedRoute>
  );
}
