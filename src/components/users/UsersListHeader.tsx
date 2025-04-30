
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface UsersListHeaderProps {
  onRefresh: () => Promise<void>;
  loading: boolean;
}

export const UsersListHeader = ({ onRefresh, loading }: UsersListHeaderProps) => {
  return (
    <div className="mb-4 flex justify-between items-center">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={loading}
        className="ml-auto"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Actualiser
      </Button>
    </div>
  );
};
