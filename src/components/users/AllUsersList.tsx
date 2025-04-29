
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { OrganizationUser } from '@/types/organization';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AllUsersListProps {
  users: OrganizationUser[];
  fetchUsers: () => Promise<void>;
}

export const AllUsersList = ({ users, fetchUsers }: AllUsersListProps) => {
  const [loading, setLoading] = useState(false);

  const changeUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: addError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole
        });

      if (addError) throw addError;

      toast("Le rôle de l'utilisateur a été mis à jour avec succès.");

      await fetchUsers();
    } catch (error: any) {
      console.error('Error changing user role:', error);
      toast("Erreur lors de la mise à jour du rôle: " + error.message);
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
          <TableHead>Rôle</TableHead>
          <TableHead>Date de création</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.displayName || user.email?.split('@')[0] || ''}</TableCell>
            <TableCell>
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
              </span>
            </TableCell>
            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {user.role === 'admin' ? <ShieldAlert className="h-4 w-4 mr-1" /> : <Shield className="h-4 w-4 mr-1" />}
                    Changer de rôle
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={() => changeUserRole(user.id, 'admin')}
                    disabled={user.role === 'admin'}
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" /> Définir comme admin
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => changeUserRole(user.id, 'user')}
                    disabled={user.role === 'user'}
                  >
                    <Shield className="h-4 w-4 mr-2" /> Définir comme utilisateur
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
