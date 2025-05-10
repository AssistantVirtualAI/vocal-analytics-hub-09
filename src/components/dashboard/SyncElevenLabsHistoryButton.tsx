
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncElevenLabsHistory } from '@/hooks/useSyncElevenLabsHistory';

interface SyncElevenLabsHistoryButtonProps {
  agentId?: string;
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
}

export function SyncElevenLabsHistoryButton({
  agentId, 
  onSuccess,
  className,
  variant = "outline"
}: SyncElevenLabsHistoryButtonProps) {
  const { syncHistory, isSyncing } = useSyncElevenLabsHistory();

  const handleSync = async () => {
    const result = await syncHistory(agentId);
    
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isSyncing}
      variant={variant}
      className={cn("gap-2", className)}
    >
      {isSyncing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : null}
      Sync ElevenLabs History
    </Button>
  );
}
