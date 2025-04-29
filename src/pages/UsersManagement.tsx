
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

export default function UsersManagement() {
  const { organizations } = useOrganization();
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

  // Debug logging
  console.log('UsersManagement - Selected org:', selectedOrg);
  console.log('UsersManagement - Organizations:', organizations);
  console.log('UsersManagement - Org users:', orgUsers);
  console.log('UsersManagement - Loading states:', { loading, orgUsersLoading, allUsersLoading });

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
      toast.success("Données utilisateurs actualisées");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Erreur lors de l'actualisation des données");
    }
  };

  return (
    <AdminProtectedRoute>
      <DashboardLayout>
        <div className="container p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestion des utilisateurs</h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh} 
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
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
          />
        </div>
      </DashboardLayout>
    </AdminProtectedRoute>
  );
}
