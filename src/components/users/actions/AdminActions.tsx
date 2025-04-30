
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Shield, ShieldCheck } from 'lucide-react';

interface AdminActionsProps {
  userId: string;
  isOrgAdmin: boolean;
  isSuperAdmin: boolean;
  currentUserIsSameUser: boolean;
  currentUserIsOrgAdmin: boolean;
  currentUserIsSuperAdmin: boolean;
  actionLoading: boolean;
  onToggleOrgAdmin?: (userId: string, makeAdmin: boolean) => Promise<void>;
  onToggleSuperAdmin?: (userId: string, makeAdmin: boolean) => Promise<void>;
}

export const AdminActions = ({
  userId,
  isOrgAdmin,
  isSuperAdmin,
  currentUserIsSameUser,
  currentUserIsOrgAdmin,
  currentUserIsSuperAdmin,
  actionLoading,
  onToggleOrgAdmin,
  onToggleSuperAdmin
}: AdminActionsProps) => {
  return (
    <>
      {onToggleOrgAdmin && currentUserIsOrgAdmin && !currentUserIsSameUser && (
        <DropdownMenuItem 
          onClick={() => onToggleOrgAdmin(userId, !isOrgAdmin)}
          disabled={actionLoading}
        >
          {isOrgAdmin ? (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Révoquer admin d'organisation
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Nommer admin d'organisation
            </>
          )}
        </DropdownMenuItem>
      )}

      {onToggleSuperAdmin && currentUserIsSuperAdmin && !currentUserIsSameUser && (
        <DropdownMenuItem 
          onClick={() => onToggleSuperAdmin(userId, !isSuperAdmin)}
          disabled={actionLoading}
        >
          {isSuperAdmin ? (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Révoquer super admin
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Nommer super admin
            </>
          )}
        </DropdownMenuItem>
      )}
    </>
  );
};
