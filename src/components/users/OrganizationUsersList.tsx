
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserX, RefreshCw, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OrganizationUser } from '@/types/organization';
import { useAuth } from '@/context/AuthContext';
import { 
  removeUserFromOrganization, 
  cancelInvitation, 
  resendInvitation, 
  resetUserPassword 
} from '@/services/organization/userManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface OrganizationUsersListProps {
  users: OrganizationUser[];
  fetchUsers: () => Promise<void>;
  organizationId: string;
  loading?: boolean;
}

export const OrganizationUsersList = ({ users, fetchUsers, organizationId, loading = false }: OrganizationUsersListProps) => {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);
  
  // Log for debugging
  console.log("OrganizationUsersList - Current users:", users);
  console.log("OrganizationUsersList - Organization ID:", organizationId);
  console.log("OrganizationUsersList - Current auth user:", user);

  const handleRemoveUserFromOrg = async (userId: string) => {
    if (!organizationId) {
      toast("ID d'organisation non spécifié");
      return;
    }
    
    setActionLoading(true);
    try {
      console.log(`Attempting to remove user ${userId} from org ${organizationId}`);
      await removeUserFromOrganization(userId, organizationId);
      await fetchUsers();
    } catch (error) {
      // Error is already handled in the service function
      console.error("Error removing user from org:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(true);
    try {
      console.log(`Attempting to cancel invitation ${invitationId}`);
      await cancelInvitation(invitationId);
      await fetchUsers();
    } catch (error) {
      // Error is already handled in the service function
      console.error("Error cancelling invitation:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendInvitation = async (email: string) => {
    if (!organizationId) {
      toast("ID d'organisation non spécifié");
      return;
    }
    
    setActionLoading(true);
    try {
      console.log(`Attempting to resend invitation to ${email} for org ${organizationId}`);
      await resendInvitation(email, organizationId);
      await fetchUsers();
    } catch (error) {
      // Error is already handled in the service function
      console.error("Error resending invitation:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    setActionLoading(true);
    try {
      console.log(`Attempting to reset password for ${email}`);
      await resetUserPassword(email);
    } catch (error) {
      // Error is already handled in the service function
      console.error("Error resetting password:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
              <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-[120px] ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user_item) => (
          <TableRow key={user_item.id}>
            <TableCell>{user_item.email}</TableCell>
            <TableCell>{user_item.displayName || user_item.email?.split('@')[0] || ''}</TableCell>
            <TableCell>
              {user_item.isPending ? (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  Invitation en attente
                </Badge>
              ) : null}
            </TableCell>
            <TableCell>
              {!user_item.isPending && (
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user_item.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user_item.role === 'admin' ? 'Admin' : 'Utilisateur'}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right">
              {user_item.isPending ? (
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleResendInvitation(user_item.email)}
                    disabled={actionLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Renvoyer
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleCancelInvitation(user_item.id)}
                    disabled={actionLoading}
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={actionLoading || user_item.id === user?.id}>
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => handleResetPassword(user_item.email)}
                      disabled={actionLoading}
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Réinitialiser mot de passe
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleRemoveUserFromOrg(user_item.id)}
                      disabled={actionLoading || user_item.id === user?.id}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Retirer de l'organisation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TableCell>
          </TableRow>
        ))}
        {users.length === 0 && !loading && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8">
              Aucun utilisateur dans cette organisation
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
