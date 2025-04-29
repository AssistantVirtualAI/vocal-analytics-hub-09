
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoginFormProps {
  onEmailChange: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onEmailChange 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Successfully signed in - navigation is handled by the parent component
    } catch (error: any) {
      // Special case for "Email not confirmed" error
      if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
        toast("Veuillez vérifier votre email pour confirmer votre inscription. Consultez votre boîte de réception et vos spams.");
        
        // Send another confirmation email
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        
        if (!resendError) {
          toast("Un nouvel email de confirmation vous a été envoyé.");
        }
      } else {
        // Handle other errors
        toast("Erreur de connexion: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    onEmailChange(newEmail);
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <Input 
          id="signin-email" 
          type="email" 
          placeholder="name@example.com"
          value={email}
          onChange={handleEmailChange} 
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">Mot de passe</Label>
        <Input 
          id="signin-password" 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
};
