
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OrganizationUser } from '@/types/organization';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface OrganizationUsersListProps {
  users: OrganizationUser[];
  fetchUsers: () => Promise<void>;
  organizationId: string;
}

export const OrganizationUsersList = ({ users, fetchUsers, organizationId }: OrganizationUsersListProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const removeUserFromOrg = async (userId: string) => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      toast("L'utilisateur a été retiré de l'organisation avec succès.");

      await fetchUsers();
    } catch (error: any) {
      console.error('Error removing user from organization:', error);
      toast("Erreur lors du retrait de l'utilisateur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast("L'invitation a été annulée avec succès.");
      await fetchUsers();
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      toast("Erreur lors de l'annulation de l'invitation: " + error.message);
    } finally {
      setLoading(false);
    }
  };

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
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => cancelInvitation(user_item.id)}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Annuler l'invitation
                </Button>
              ) : (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeUserFromOrg(user_item.id)}
                  disabled={user_item.id === user?.id}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Retirer
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
        {users.length === 0 && (
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
