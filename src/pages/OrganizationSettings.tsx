import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useOrganization } from '@/context/OrganizationContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Check, PenLine, Plus, Trash2, User, Users } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { Organization } from '@/types/organization';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export default function OrganizationSettings() {
  const { organizations, currentOrganization, changeOrganization, createOrganization, updateOrganization, 
    deleteOrganization, users, fetchOrganizationUsers, addUserToOrganization, removeUserFromOrganization } = useOrganization();
  const { isAdmin } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [orgToEdit, setOrgToEdit] = useState<Organization | null>(null);
  const [newOrg, setNewOrg] = useState({
    name: '',
    agentId: '',
    description: ''
  });
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

  const handleAddOrganization = async () => {
    await createOrganization(newOrg);
    setIsAddDialogOpen(false);
    setNewOrg({ name: '', agentId: '', description: '' });
  };

  const handleEditOrganization = (org: Organization) => {
    setOrgToEdit(org);
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrganization = async () => {
    if (orgToEdit) {
      await updateOrganization(orgToEdit);
      setIsEditDialogOpen(false);
      setOrgToEdit(null);
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    await deleteOrganization(orgId);
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

  const fetchPendingInvitations = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending');
        
      if (error) throw error;
      setPendingInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
    }
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchPendingInvitations(currentOrganization.id);
    }
  }, [currentOrganization]);

  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des organisations</h1>
          
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une organisation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une nouvelle organisation</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle organisation avec son propre Agent ID ElevenLabs.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nom
                    </Label>
                    <Input
                      id="name"
                      className="col-span-3"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg({...newOrg, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="agentId" className="text-right">
                      Agent ID
                    </Label>
                    <Input
                      id="agentId"
                      className="col-span-3"
                      value={newOrg.agentId}
                      onChange={(e) => setNewOrg({...newOrg, agentId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      className="col-span-3"
                      value={newOrg.description}
                      onChange={(e) => setNewOrg({...newOrg, description: e.target.value})}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Annuler</Button>
                  </DialogClose>
                  <Button type="submit" onClick={handleAddOrganization} disabled={!newOrg.name || !newOrg.agentId}>
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className={currentOrganization?.id === org.id ? 'border-primary' : ''}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{org.name}</CardTitle>
                  <CardDescription className="text-sm">ID: {org.id}</CardDescription>
                </div>
                <Building className="h-5 w-5" />
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Agent ID:</span> {org.agentId}
                  </div>
                  {org.description && (
                    <div>
                      <span className="font-medium">Description:</span> {org.description}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Créé le:</span> {new Date(org.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {isAdmin && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditOrganization(org)}
                    >
                      <PenLine className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous certain ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action ne peut pas être annulée. L'organisation sera définitivement supprimée 
                            ainsi que toutes les données associées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteOrganization(org.id)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                
                {currentOrganization?.id !== org.id ? (
                  <Button 
                    size="sm" 
                    onClick={() => changeOrganization(org.id)}
                  >
                    Sélectionner
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" disabled>
                    <Check className="h-4 w-4 mr-2" />
                    Sélectionnée
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {currentOrganization && (
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
        )}

        {/* Edit Organization Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'organisation</DialogTitle>
              <DialogDescription>
                Modifiez les détails de l'organisation
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="edit-name"
                  className="col-span-3"
                  value={orgToEdit?.name || ''}
                  onChange={(e) => setOrgToEdit(orgToEdit ? {...orgToEdit, name: e.target.value} : null)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-agentId" className="text-right">
                  Agent ID
                </Label>
                <Input
                  id="edit-agentId"
                  className="col-span-3"
                  value={orgToEdit?.agentId || ''}
                  onChange={(e) => setOrgToEdit(orgToEdit ? {...orgToEdit, agentId: e.target.value} : null)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  className="col-span-3"
                  value={orgToEdit?.description || ''}
                  onChange={(e) => setOrgToEdit(orgToEdit ? {...orgToEdit, description: e.target.value} : null)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button onClick={handleUpdateOrganization}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
