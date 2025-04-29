
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useOrganization } from '@/context/OrganizationContext';
import { AllUsersSection } from '@/components/users/AllUsersSection';
import { OrganizationUsersSection } from '@/components/users/OrganizationUsersSection';
import { AdminProtectedRoute } from '@/components/users/AdminProtectedRoute';
import { useUsersManagement } from '@/hooks/useUsersManagement';

export default function UsersManagement() {
  const { organizations } = useOrganization();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  
  const {
    orgUsers,
    allUsers,
    loading,
    fetchUsers,
    fetchAllUsers,
    addUserToOrg
  } = useUsersManagement(selectedOrg);

  useEffect(() => {
    if (organizations.length > 0) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations]);

  return (
    <AdminProtectedRoute>
      <DashboardLayout>
        <div className="container p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Gestion des utilisateurs</h1>
          </div>

          <AllUsersSection users={allUsers} fetchUsers={fetchAllUsers} />

          <OrganizationUsersSection
            organizations={organizations}
            selectedOrg={selectedOrg}
            onSelectOrg={setSelectedOrg}
            users={orgUsers}
            fetchUsers={fetchUsers}
            onAddUser={addUserToOrg}
            loading={loading}
          />
        </div>
      </DashboardLayout>
    </AdminProtectedRoute>
  );
}
