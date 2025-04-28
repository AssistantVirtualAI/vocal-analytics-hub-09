
import { Link } from 'react-router-dom';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallsHeaderProps {
  view: 'table' | 'grid';
  onViewChange: (view: 'table' | 'grid') => void;
}

export function CallsHeader({ view, onViewChange }: CallsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
      <h1 className="text-2xl sm:text-3xl font-bold">Liste des appels</h1>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onViewChange('table')}
          className={view === 'table' ? 'bg-secondary' : ''}
        >
          <LayoutList className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onViewChange('grid')}
          className={view === 'grid' ? 'bg-secondary' : ''}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Link to="/calls/new">
          <Button>Nouvel appel</Button>
        </Link>
      </div>
    </div>
  );
}
