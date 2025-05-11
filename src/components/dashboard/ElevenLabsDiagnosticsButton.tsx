
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { CircuitBoard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ElevenLabsDiagnosticsButtonProps extends ButtonProps {
  onlyIcon?: boolean;
}

export function ElevenLabsDiagnosticsButton({ 
  className, 
  onlyIcon = false,
  children,
  ...props 
}: ElevenLabsDiagnosticsButtonProps) {
  return (
    <Button
      variant="outline"
      size={onlyIcon ? "icon" : "sm"}
      className={cn(
        "bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/30", 
        className
      )}
      {...props}
    >
      <CircuitBoard className={cn("text-blue-500 dark:text-blue-400", onlyIcon ? "h-4 w-4" : "h-4 w-4 mr-1.5")} />
      {!onlyIcon && (children || "Diagnostics")}
    </Button>
  );
}
