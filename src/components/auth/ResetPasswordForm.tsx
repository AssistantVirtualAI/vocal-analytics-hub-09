
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from "lucide-react";
import { usePasswordReset } from '@/hooks/users/usePasswordReset';

interface ResetPasswordFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  error?: string | null;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ 
  email, 
  onEmailChange,
  error 
}) => {
  const [resetSent, setResetSent] = useState(false);
  const { loading, resetPassword } = usePasswordReset();

  useEffect(() => {
    // Reset the sent state when there's an error
    if (error) {
      setResetSent(false);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      console.error("Error sending reset email:", err);
      // Error handling is done in the hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {resetSent ? (
        <div className="p-4 bg-green-50 text-green-700 rounded-md">
          <p className="mb-2 font-medium">Email de réinitialisation envoyé !</p>
          <p className="text-sm">
            Si un compte existe avec cette adresse email, vous recevrez un lien pour réinitialiser votre mot de passe.
            Vérifiez votre boîte de réception et vos spams.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input 
              id="reset-email" 
              type="email" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)} 
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer un lien de réinitialisation"}
          </Button>
        </>
      )}
    </form>
  );
};
