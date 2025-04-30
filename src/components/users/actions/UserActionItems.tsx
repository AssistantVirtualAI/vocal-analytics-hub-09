
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { KeyRound, UserX } from 'lucide-react';

interface UserActionItemsProps {
  userId: string;
  email: string;
  currentUserIsSameUser: boolean;
  actionLoading: boolean;
  onResetPassword: (email: string) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
}

export const UserActionItems = ({
  userId,
  email,
  currentUserIsSameUser,
  actionLoading,
  onResetPassword,
  onRemoveUser
}: UserActionItemsProps) => {
  return (
    <>
      <DropdownMenuItem 
        onClick={() => onResetPassword(email)}
        disabled={actionLoading}
      >
        <KeyRound className="h-4 w-4 mr-2" />
        Réinitialiser mot de passe
      </DropdownMenuItem>
      
      <DropdownMenuSeparator />
      
      <DropdownMenuItem 
        className="text-destructive"
        onClick={() => onRemoveUser(userId)}
        disabled={actionLoading || currentUserIsSameUser}
      >
        <UserX className="h-4 w-4 mr-2" />
        Retirer de l'organisation
      </DropdownMenuItem>
    </>
  );
};
