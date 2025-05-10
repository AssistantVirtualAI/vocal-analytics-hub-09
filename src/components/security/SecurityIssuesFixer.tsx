
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function SecurityIssuesFixer() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const handleFixSecurityIssues = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke("fix-security-issues");
      
      if (error) throw error;
      
      toast.success("Security issues fixed successfully!");
      setIsFixed(true);
    } catch (error) {
      console.error("Error fixing security issues:", error);
      toast.error("Failed to fix security issues: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 mb-6 border rounded-lg bg-gradient-to-br from-red-50/30 to-pink-50/30 dark:from-red-950/30 dark:to-pink-950/30 backdrop-blur-sm">
      <div className="flex items-start mb-4">
        <AlertCircle className="mr-2 h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-700 dark:text-red-400">Security Issues Detected</h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
            We detected security configuration issues that need to be fixed:
          </p>
          <ul className="list-disc list-inside text-sm text-red-600/80 dark:text-red-400/80 mt-2">
            <li>Security Definer View (calls_view) - Using SECURITY DEFINER can bypass RLS</li>
            <li>Auth OTP long expiry - Email OTP expiry exceeds recommended threshold</li>
          </ul>
        </div>
      </div>
      
      {isFixed ? (
        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="mr-2 h-4 w-4" />
          Security issues have been fixed successfully!
        </div>
      ) : (
        <Button 
          onClick={handleFixSecurityIssues}
          variant="destructive"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? "Fixing Issues..." : "Fix Security Issues"}
        </Button>
      )}
    </div>
  );
}
