
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { handleApiError } from '@/utils/api-metrics';

interface MigrationResponse {
  success: boolean;
  message: string;
  organizations_updated?: number;
  calls_updated?: number;
  errors?: string[];
}

export function useMigrateAgentData() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [results, setResults] = useState<MigrationResponse | null>(null);
  
  const migrateAgentData = async () => {
    setIsMigrating(true);
    
    try {
      console.log("Calling migrate-agent-data function");
      
      const { data, error } = await supabase.functions.invoke<MigrationResponse>(
        'migrate-agent-data',
        { body: {} } // No specific parameters needed
      );
      
      console.log("Migration response:", { data, error });
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        throw new Error("No response data received");
      }
      
      setResults(data);
      
      // Show toast based on results
      if (data.success) {
        toast.success(`Migration complete! Updated ${data.organizations_updated} organizations and ${data.calls_updated} calls.`);
      } else {
        toast.error(`Migration completed with ${data.errors?.length} errors`);
        
        // Log detailed errors to console
        if (data.errors?.length) {
          console.error("Migration errors:", data.errors);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Error in migrateAgentData:", error);
      
      handleApiError(error, (props) => {
        toast.error(props.description || "An error occurred during migration");
      });
      
      setResults({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        errors: [error instanceof Error ? error.message : "Unknown error"]
      });
      
      return {
        success: false,
        message: "Migration failed",
        errors: [error instanceof Error ? error.message : "Unknown error"]
      };
    } finally {
      setIsMigrating(false);
    }
  };
  
  return {
    migrateAgentData,
    isMigrating,
    results
  };
}
