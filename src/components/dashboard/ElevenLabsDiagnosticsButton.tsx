
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useElevenLabsDiagnostics } from '@/hooks/useElevenLabsDiagnostics';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ElevenLabsDiagnosticsButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ElevenLabsDiagnosticsButton({
  variant = "outline",
  size = "sm",
  className
}: ElevenLabsDiagnosticsButtonProps) {
  const { runBasicDiagnostic, runApiTest, isRunningBasicTest, isRunningApiTest } = useElevenLabsDiagnostics();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  
  const isRunning = isRunningBasicTest || isRunningApiTest;
  
  const handleRunDiagnostics = async () => {
    setIsDialogOpen(true);
    setDiagnosticResults(null);
    
    try {
      // First run basic test
      const basicResult = await runBasicDiagnostic();
      
      // Then run API test
      let apiResult;
      try {
        apiResult = await runApiTest();
      } catch (apiError) {
        apiResult = { 
          error: apiError.message || "API test failed", 
          timestamp: new Date().toISOString() 
        };
      }
      
      // Combine results
      setDiagnosticResults({
        basicTest: basicResult,
        apiTest: apiResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDiagnosticResults({
        error: error.message || "Failed to run diagnostics",
        timestamp: new Date().toISOString()
      });
    }
  };
  
  return (
    <>
      <Button
        onClick={handleRunDiagnostics}
        variant={variant}
        size={size}
        className={className}
        disabled={isRunning}
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Running Diagnostics...
          </>
        ) : (
          "Diagnose ElevenLabs"
        )}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ElevenLabs Diagnostics Results</DialogTitle>
            <DialogDescription>
              Results of diagnostics tests for ElevenLabs integration
            </DialogDescription>
          </DialogHeader>
          
          {isRunning ? (
            <div className="flex flex-col items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Running diagnostics tests...</p>
            </div>
          ) : diagnosticResults ? (
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(diagnosticResults, null, 2)}
              </pre>
            </ScrollArea>
          ) : (
            <div className="p-6 text-center">No results yet</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
