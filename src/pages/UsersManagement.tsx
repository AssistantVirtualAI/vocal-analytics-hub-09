import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useOrganization } from '@/context/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Trash2, UserX, Shield, ShieldAlert } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { OrganizationUser, OrganizationInvitation } from '@/types/organization';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function UsersManagement() {
  const { isAdmin, user } = useAuth();
  const { currentOrganization, organizations, addUserToOrganization } = useOrganization();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([]);
  const [allUsers, setAllUsers] = useState<OrganizationUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (organizations.length > 0) {
      setSelectedOrg(organizations[0].id);
    }
  }, [organizations]);

  useEffect(() => {
    if (selectedOrg) {
      fetchUsers();
      fetchAllUsers();
    }
  }, [selectedOrg]);

  const fetchUsers = async () => {
    if (!selectedOrg) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          profiles (
            id,
            email,
            display_name,
            avatar_url,
            created_at
          ),
          user_roles (
            role
          )
        `)
        .eq('organization_id', selectedOrg);

      if (error) throw error;

      // Get pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', selectedOrg)
        .eq('status', 'pending');

      if (invitationsError) throw invitationsError;

      // Format existing users
      const formattedUsers: OrganizationUser[] = (data || [])
        .filter(item => item && typeof item === 'object' && item.profiles)
        .map(item => {
          const profile = item.profiles as Record<string, any> | null;
          const roles = Array.isArray(item.user_roles) ? item.user_roles : [];
          const role = roles.length > 0 ? (roles[0] as Record<string, any>).role : 'user';
          
          if (!profile) return null;
          
          return {
            id: profile?.id || '',
            email: profile?.email || '',
            displayName: profile?.display_name || profile?.email?.split('@')[0] || '',
            avatarUrl: profile?.avatar_url,
            role: (role as 'admin' | 'user'),
            createdAt: profile?.created_at || new Date().toISOString(),
            isPending: false
          };
        })
        .filter((user): user is OrganizationUser => user !== null);

      // Add pending invitations to the list
      const pendingUsers: OrganizationUser[] = (invitationsData || []).map(invite => ({
        id: invite.id,
        email: invite.email,
        displayName: invite.email.split('@')[0] || '',
        role: 'user' as const,
        createdAt: invite.created_at,
        isPending: true
      }));

      setOrgUsers([...formattedUsers, ...pendingUsers]);
    } catch (error: any) {
      console.error('Error fetching organization users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          display_name,
          avatar_url,
          created_at,
          user_roles (
            role
          )
        `);

      if (error) throw error;

      const formattedUsers: OrganizationUser[] = (data || [])
        .filter(item => item && typeof item === 'object')
        .map(item => {
          const roles = Array.isArray(item.user_roles) ? item.user_roles : [];
          const role = roles.length > 0 ? (roles[0] as Record<string, any>).role : 'user';
          
          return {
            id: item.id || '',
            email: item.email || '',
            displayName: item.display_name || item.email?.split('@')[0] || '',
            avatarUrl: item.avatar_url,
            role: (role as 'admin' | 'user'),
            createdAt: item.created_at || new Date().toISOString(),
          };
        });

      setAllUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching all users:', error);
      toast("Erreur lors de la récupération des utilisateurs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addUserToOrg = async () => {
    if (!selectedOrg || !newUserEmail) return;
    
    setLoading(true);
    try {
      await addUserToOrganization(newUserEmail, selectedOrg);
      setNewUserEmail('');
      setAddDialogOpen(false);
      await fetchUsers(); // Refresh the user list
    } catch (error: any) {
      console.error('Error adding user to organization:', error);
      // Don't toast here, the function already does it
    } finally {
      setLoading(false);
    }
  };

  const removeUserFromOrg = async (userId: string) => {
    if (!selectedOrg) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', selectedOrg);

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
      await fetchAllUsers();
    } catch (error: any) {
      console.error('Error changing user role:', error);
      toast("Erreur lors de la mise à jour du rôle: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="container p-4 sm:p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-lg text-muted-foreground">
              Vous n'avez pas les droits pour accéder à cette page.
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des utilisateurs</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tous les utilisateurs</CardTitle>
            <CardDescription>Gérez les rôles des utilisateurs dans le système</CardDescription>
          </CardHeader>
          <CardContent>
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
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.displayName}</TableCell>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Utilisateurs par organisation</CardTitle>
              <CardDescription>Gérez les utilisateurs pour chaque organisation</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedOrg || undefined} onValueChange={setSelectedOrg}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sélectionner une organisation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un utilisateur à l'organisation</DialogTitle>
                    <DialogDescription>
                      Entrez l'email de l'utilisateur que vous souhaitez ajouter à cette organisation.
                      
                      Si l'utilisateur n'existe pas encore, une invitation sera envoyée.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
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
                    <Button onClick={addUserToOrg} disabled={loading}>
                      {loading ? 'Ajout en cours...' : 'Ajouter'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
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
                {orgUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>
                      {user.isPending ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          Invitation en attente
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {!user.isPending && (
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.isPending ? (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => cancelInvitation(user.id)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Annuler l'invitation
                        </Button>
                      ) : (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeUserFromOrg(user.id)}
                          disabled={user.id === user?.id}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Retirer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {orgUsers.length === 0 && (
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
      </div>
    </DashboardLayout>
  );
}
