
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignupFormProps {
  email: string;
  invitationEmail: string | null;
  invitationToken: string | null;
  onEmailChange: (email: string) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ 
  email, 
  invitationEmail, 
  invitationToken,
  onEmailChange
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Sign up the user
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) throw error;
      
      // If there's an invitation token, accept it
      if (invitationToken && email) {
        try {
          // Check if token is valid - explicitly type the response data
          const { data: invitationData, error: invitationError } = await supabase
            .from('organization_invitations')
            .select('id')
            .eq('token', invitationToken)
            .eq('email', email)
            .eq('status', 'pending')
            .single();

          if (invitationError) {
            console.error('Error validating invitation:', invitationError);
          } else if (invitationData) {
            // Valid invitation, mark it as accepted
            const { error: updateError } = await supabase
              .from('organization_invitations')
              .update({ status: 'accepted' })
              .eq('id', invitationData.id);

            if (updateError) {
              console.error('Error accepting invitation:', updateError);
            }
          }
        } catch (inviteError) {
          console.error('Error processing invitation:', inviteError);
        }
      }
      
      toast("Votre compte a été créé avec succès. Veuillez vérifier votre email pour confirmer votre inscription.");
    } catch (error: any) {
      toast("Erreur d'inscription: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEmailChange(e.target.value);
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input 
          id="signup-email" 
          type="email" 
          placeholder="name@example.com"
          value={email}
          onChange={handleEmailChange}
          required
          disabled={!!invitationEmail}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Mot de passe</Label>
        <Input 
          id="signup-password" 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Création..." : "Créer un compte"}
      </Button>
    </form>
  );
};
