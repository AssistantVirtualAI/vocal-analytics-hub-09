
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DiagnosticResponse {
  status?: string;
  message?: string;
  availableEnvVars?: string[];
  apiStatus?: number;
  subscriptionTier?: string;
  error?: string;
  stack?: string;
  timestamp?: string;
}

export function useElevenLabsDiagnostics() {
  const [isRunningBasicTest, setIsRunningBasicTest] = useState(false);
  const [isRunningApiTest, setIsRunningApiTest] = useState(false);
  
  const runBasicDiagnostic = async (): Promise<DiagnosticResponse> => {
    try {
      setIsRunningBasicTest(true);
      console.log("Running basic ElevenLabs diagnostics");
      
      const { data, error } = await supabase.functions.invoke<DiagnosticResponse>(
        'elevenlabs-diagnostic',
        {}
      );
      
      if (error) {
        console.error("Error in basic diagnostic:", error);
        toast({
          title: "Diagnostic Error",
          description: error.message || "An error occurred during diagnostics",
          variant: "destructive"
        });
        throw error;
      }
      
      console.log("Basic diagnostic result:", data);
      
      toast({
        title: "Basic Diagnostic Complete",
        description: data?.message || "Basic diagnostics completed successfully"
      });
      
      return data || {};
    } catch (error) {
      console.error("Failed to run basic diagnostic:", error);
      toast({
        title: "Diagnostic Failed",
        description: error.message || "Failed to run basic diagnostics",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsRunningBasicTest(false);
    }
  };
  
  const runApiTest = async (): Promise<DiagnosticResponse> => {
    try {
      setIsRunningApiTest(true);
      console.log("Testing ElevenLabs API connection");
      
      const { data, error } = await supabase.functions.invoke<DiagnosticResponse>(
        'elevenlabs-api-test',
        {}
      );
      
      if (error) {
        console.error("Error in API test:", error);
        toast({
          title: "API Test Error",
          description: error.message || "An error occurred during API testing",
          variant: "destructive"
        });
        throw error;
      }
      
      console.log("API test result:", data);
      
      toast({
        title: "API Test Complete",
        description: data?.message || "API test completed successfully"
      });
      
      return data || {};
    } catch (error) {
      console.error("Failed to run API test:", error);
      toast({
        title: "API Test Failed",
        description: error.message || "Failed to test API connection",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsRunningApiTest(false);
    }
  };
  
  return {
    runBasicDiagnostic,
    runApiTest,
    isRunningBasicTest,
    isRunningApiTest
  };
}
