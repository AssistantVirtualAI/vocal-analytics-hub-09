
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { OrganizationSelector } from '@/components/users/OrganizationSelector';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { OrganizationUsersList } from '@/components/users/OrganizationUsersList';
import { Organization, OrganizationUser } from '@/types/organization';
import { Brain, Users } from 'lucide-react';
import { AIHeader } from '@/components/dashboard/AIHeader';
import { GlassCard } from '@/components/ui/glass-card';

interface OrganizationUsersSectionProps {
  organizations: Organization[];
  selectedOrg: string | null;
  onSelectOrg: (orgId: string) => void;
  users: OrganizationUser[];
  fetchUsers: () => Promise<void>;
  onAddUser: (email: string) => Promise<void>;
  loading: boolean;
  usersLoading?: boolean;
  currentUserIsOrgAdmin?: boolean;
  currentUserIsSuperAdmin?: boolean;
}

export const OrganizationUsersSection: React.FC<OrganizationUsersSectionProps> = ({
  organizations,
  selectedOrg,
  onSelectOrg,
  users,
  fetchUsers,
  onAddUser,
  loading,
  usersLoading = false,
  currentUserIsOrgAdmin = false,
  currentUserIsSuperAdmin = false
}) => {
  // Check permissions when component mounts
  useEffect(() => {
    console.log("OrganizationUsersSection - Current user permissions:", { 
      isOrgAdmin: currentUserIsOrgAdmin, 
      isSuperAdmin: currentUserIsSuperAdmin 
    });
  }, [currentUserIsOrgAdmin, currentUserIsSuperAdmin]);
  
  return (
    <GlassCard 
      variant="default"
      glowEffect={true}
      className="overflow-hidden"
    >
      <CardHeader className="flex flex-col sm:flex-row items-start justify-between relative">
        <div className="relative z-10">
          <AIHeader 
            title="Utilisateurs par organisation" 
            description="Gérez les utilisateurs pour chaque organisation" 
            showDecorations={false}
          />
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0 z-10">
          <OrganizationSelector 
            organizations={organizations}
            selectedOrg={selectedOrg}
            onSelectOrg={onSelectOrg}
          />
          
          {(currentUserIsOrgAdmin || currentUserIsSuperAdmin) && (
            <AddUserDialog onAddUser={onAddUser} loading={loading} />
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-xl" />
        <div className="absolute -left-4 -bottom-12 w-24 h-24 bg-blue-500/5 rounded-full blur-lg" />
      </CardHeader>
      <CardContent>
        <OrganizationUsersList
          users={users}
          fetchUsers={fetchUsers}
          organizationId={selectedOrg || ''}
          loading={usersLoading}
          currentUserIsOrgAdmin={currentUserIsOrgAdmin}
          currentUserIsSuperAdmin={currentUserIsSuperAdmin}
        />
      </CardContent>
    </GlassCard>
  );
};
