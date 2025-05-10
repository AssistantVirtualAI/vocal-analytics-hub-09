
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncCalls } from '@/hooks/useSyncCalls';
import { DataWrapper } from '@/components/dashboard/DataWrapper';

interface SyncCallsButtonProps {
  agentId: string;
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
}

export function SyncCallsButton({
  agentId, 
  onSuccess,
  className,
  variant = "outline"
}: SyncCallsButtonProps) {
  const { syncCalls, isSyncing } = useSyncCalls();

  const handleSync = async () => {
    if (!agentId) return;
    
    const result = await syncCalls(agentId);
    
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
      Sync ElevenLabs Calls
    </Button>
  );
}
