
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface UserTableHeaderProps {
  showAdminColumns?: boolean;
}

export const UserTableHeader = ({ showAdminColumns = false }: UserTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Email</TableHead>
        <TableHead>Nom</TableHead>
        <TableHead>Statut</TableHead>
        <TableHead>Rôle</TableHead>
        {showAdminColumns && (
          <TableHead>Permissions</TableHead>
        )}
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
