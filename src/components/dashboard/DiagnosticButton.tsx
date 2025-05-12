
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useElevenLabsDiagnostics } from '@/hooks/useElevenLabsDiagnostics';

interface DiagnosticButtonProps {
  className?: string;
}

export function DiagnosticButton({ className }: DiagnosticButtonProps) {
  const [results, setResults] = useState<any>(null);
  const { runBasicDiagnostic, runApiTest, isRunningBasicTest, isRunningApiTest } = useElevenLabsDiagnostics();

  const handleRunDiagnostics = async () => {
    try {
      // First run basic diagnostic
      const basicResults = await runBasicDiagnostic();
      console.log("Diagnostic results:", basicResults);
      setResults(basicResults);
      
      // Then try API test
      const apiResults = await runApiTest();
      console.log("API test results:", apiResults);
      setResults(prev => ({ ...prev, ...apiResults }));

      toast.success("Diagnostics completed", {
        description: "ElevenLabs API connection verified successfully"
      });
    } catch (error) {
      console.error("Diagnostic error:", error);
      toast.error("Diagnostic failed", {
        description: error.message || "Failed to run diagnostics"
      });
    }
  };

  const isLoading = isRunningBasicTest || isRunningApiTest;

  return (
    <div className={className}>
      <Button 
        onClick={handleRunDiagnostics}
        disabled={isLoading}
        variant="outline"
        className="gap-2 text-xs"
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : results?.status === "OK" ? (
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        ) : (
          <AlertCircle className="h-3 w-3" />
        )}
        {isLoading ? "Vérification..." : "Diagnostiquer API"}
      </Button>
      
      {results && (
        <div className="mt-2 text-xs">
          <p className={results.status === "OK" ? "text-green-500" : "text-red-500"}>
            Status: {results.status || "Unknown"}
          </p>
          {results.apiKeyStatus && (
            <p>API Key: {results.apiKeyStatus}</p>
          )}
          {results.subscriptionTier && (
            <p>ElevenLabs Plan: {results.subscriptionTier}</p>
          )}
        </div>
      )}
    </div>
  );
}
