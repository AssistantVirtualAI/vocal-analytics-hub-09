
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const UserTableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Email</TableHead>
        <TableHead>Nom</TableHead>
        <TableHead>Statut</TableHead>
        <TableHead>Rôle</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
