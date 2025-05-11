
import React from 'react';
import { Brain, CircuitBoard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIHeaderProps {
  title: string;
  description?: string;
  className?: string;
  showDecorations?: boolean;
}

export function AIHeader({ title, description, className, showDecorations = true }: AIHeaderProps) {
  return (
    <div className={cn("relative flex flex-col space-y-1.5", className)}>
      {showDecorations && (
        <div className="absolute -left-2 -top-2">
          <CircuitBoard className="h-5 w-5 text-primary/30" />
        </div>
      )}
      
      <div className="flex items-center">
        <Brain className="mr-2 h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
          {title}
        </h2>
        {showDecorations && (
          <Sparkles className="ml-2 h-4 w-4 text-amber-400 animate-pulse" />
        )}
      </div>
      
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
      
      {showDecorations && (
        <div 
          className="absolute -bottom-1 right-12 w-20 h-1 bg-gradient-to-r from-primary/40 to-transparent rounded-full"
          style={{ filter: 'blur(1px)' }}
        />
      )}
    </div>
  );
}
