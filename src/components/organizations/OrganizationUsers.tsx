
import { useState, useEffect } from 'react';
import { Organization, OrganizationInvitation, OrganizationUser } from '@/types/organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { User, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OrganizationUsersProps {
  currentOrganization: Organization | null;
  users: OrganizationUser[];
  fetchOrganizationUsers: (organizationId: string) => Promise<void>;
  addUserToOrganization: (email: string, organizationId: string) => Promise<void>;
  removeUserFromOrganization: (userId: string, organizationId: string) => Promise<void>;
}

export const OrganizationUsers = ({
  currentOrganization,
  users,
  fetchOrganizationUsers,
  addUserToOrganization,
  removeUserFromOrganization
}: OrganizationUsersProps) => {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [pendingInvitations, setPendingInvitations] = useState<OrganizationInvitation[]>([]);

  const fetchPendingInvitations = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending');
        
      if (error) throw error;
      
      const formattedInvitations: OrganizationInvitation[] = (data || []).map(invite => ({
        id: invite.id,
        email: invite.email,
        organizationId: invite.organization_id,
        status: invite.status as 'pending' | 'accepted' | 'rejected',
        createdAt: invite.created_at
      }));
      
      setPendingInvitations(formattedInvitations);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleAddUser = async () => {
    if (currentOrganization && newUserEmail) {
      await addUserToOrganization(newUserEmail, currentOrganization.id);
      setNewUserEmail('');
      setIsAddUserDialogOpen(false);
      if (currentOrganization) {
        await fetchOrganizationUsers(currentOrganization.id);
        await fetchPendingInvitations(currentOrganization.id);
      }
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (currentOrganization) {
      await removeUserFromOrganization(userId, currentOrganization.id);
      await fetchOrganizationUsers(currentOrganization.id);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      
      if (currentOrganization) {
        await fetchPendingInvitations(currentOrganization.id);
      }
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
    }
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchPendingInvitations(currentOrganization.id);
    }
  }, [currentOrganization]);

  if (!currentOrganization) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">Utilisateurs - {currentOrganization.name}</CardTitle>
          <CardDescription>Gérer les utilisateurs de cette organisation</CardDescription>
        </div>
        
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <User className="h-4 w-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un utilisateur à l'organisation</DialogTitle>
              <DialogDescription>
                Entrez l'email de l'utilisateur à ajouter à cette organisation.
                Si l'utilisateur n'est pas encore inscrit, une invitation sera créée.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-4">
                <Label htmlFor="userEmail">Email de l'utilisateur</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="email@exemple.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button onClick={handleAddUser}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
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
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.displayName || '-'}</TableCell>
                <TableCell>
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    Actif
                  </span>
                </TableCell>
                <TableCell>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemoveUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Retirer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {pendingInvitations.map(invitation => (
              <TableRow key={`invitation-${invitation.id}`}>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>{invitation.email.split('@')[0] || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    Invitation en attente
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Utilisateur
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {users.length === 0 && pendingInvitations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Aucun utilisateur dans cette organisation
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
