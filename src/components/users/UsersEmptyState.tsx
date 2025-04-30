
import { TableCell, TableRow } from '@/components/ui/table';

interface UsersEmptyStateProps {
  loading: boolean;
  colSpan: number;
}

export const UsersEmptyState = ({ loading, colSpan }: UsersEmptyStateProps) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-8">
        {loading ? (
          "Chargement des utilisateurs..."
        ) : (
          "Aucun utilisateur dans cette organisation"
        )}
      </TableCell>
    </TableRow>
  );
};
