
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OrganizationInvitation, OrganizationUser } from '@/types/organization';

interface OrganizationUsersTableProps {
  users: OrganizationUser[];
  pendingInvitations: OrganizationInvitation[];
  onRemoveUser: (userId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onUpdateRole?: (userId: string, role: string) => Promise<void>;
}

export const OrganizationUsersTable = ({
  users,
  pendingInvitations,
  onRemoveUser,
  onCancelInvitation,
  onUpdateRole
}: OrganizationUsersTableProps) => {
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
                onClick={() => onRemoveUser(user.id)}
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
                onClick={() => onCancelInvitation(invitation.id)}
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
  );
};
