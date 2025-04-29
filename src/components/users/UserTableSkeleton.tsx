
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export const UserTableSkeleton = () => {
  return (
    <TableBody>
      {[...Array(3)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
          <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
          <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-[120px] ml-auto" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};
