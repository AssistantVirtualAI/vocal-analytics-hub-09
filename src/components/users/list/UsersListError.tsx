
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface UsersListErrorProps {
  error: Error;
  onRetry: () => void;
}

export const UsersListError = ({ error, onRetry }: UsersListErrorProps) => {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Erreur lors du chargement des utilisateurs: {error.message}
        <button 
          onClick={onRetry} 
          className="ml-2 underline"
        >
          Réessayer
        </button>
      </AlertDescription>
    </Alert>
  );
};
