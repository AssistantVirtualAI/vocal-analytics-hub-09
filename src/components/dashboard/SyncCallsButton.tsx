
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSyncElevenLabsConversations } from '@/hooks/useSyncElevenLabsConversations';
import { cn } from '@/lib/utils';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

interface SyncCallsButtonProps {
  agentId?: string;
  onSuccess?: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function SyncCallsButton({
  agentId,
  onSuccess,
  className,
  variant = 'outline'
}: SyncCallsButtonProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const { syncConversations, isSyncing } = useSyncElevenLabsConversations();
  
  const handleSync = async () => {
    const result = await syncConversations(agentId, {
      fromDate: dateRange?.from,
      toDate: dateRange?.to,
      limit: 100 // Limite par défaut
    });
    
    if (result.success && onSuccess) {
      onSuccess();
    }
    
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          onClick={() => setIsPopoverOpen(true)}
          className={cn(className)}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
          Synchroniser avec ElevenLabs
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Sélectionnez la période à synchroniser</h4>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={1}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsPopoverOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              size="sm" 
              onClick={handleSync}
              disabled={isSyncing || !dateRange?.from}
            >
              {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
