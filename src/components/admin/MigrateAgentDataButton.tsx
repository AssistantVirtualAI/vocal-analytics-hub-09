
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMigrateAgentData } from '@/hooks/useMigrateAgentData';
import { toast } from 'sonner';

interface MigrateAgentDataButtonProps {
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined;
}

export function MigrateAgentDataButton({
  onSuccess,
  className,
  variant = "default"
}: MigrateAgentDataButtonProps) {
  const { migrateAgentData, isMigrating } = useMigrateAgentData();
  
  const handleMigration = async () => {
    try {
      const result = await migrateAgentData();
      console.log("Migration result:", result);
      
      if (result.success && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Migration operation failed with error:", error);
      toast.error(`Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <Button 
      onClick={handleMigration} 
      disabled={isMigrating}
      variant={variant}
      className={cn("gap-2", className)}
    >
      {isMigrating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {isMigrating ? 'Migrating...' : 'Migrate Agent Data'}
    </Button>
  );
}
