
import { Badge } from '@/components/ui/badge';
import { OrganizationUser } from '@/types/organization';

interface UserStatusProps {
  user: OrganizationUser;
}

export const UserStatus = ({ user }: UserStatusProps) => {
  if (user.isPending) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
        Invitation en attente
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
      Actif
    </Badge>
  );
};

export const UserRole = ({ user }: UserStatusProps) => {
  if (user.isPending) {
    return (
      <span className="text-xs text-gray-500">
        (En attente)
      </span>
    );
  }
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
    </span>
  );
};
