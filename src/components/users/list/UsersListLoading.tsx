
import { Loader2 } from 'lucide-react';

export const UsersListLoading = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm text-muted-foreground">Chargement des utilisateurs...</span>
    </div>
  );
};
