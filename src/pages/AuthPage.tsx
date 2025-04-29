
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters
  useEffect(() => {
    if (user) {
      navigate('/');
      return;
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('invitation');
    const emailFromUrl = params.get('email');

    if (token) {
      setInvitationToken(token);
      setActiveTab('signup');
      
      if (emailFromUrl) {
        setInvitationEmail(emailFromUrl);
        setEmail(emailFromUrl);
      }
    }
  }, [user, navigate, location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Successfully signed in, navigate to home page
      navigate('/');
    } catch (error: any) {
      toast("Erreur de connexion: " + error.message);
    } finally {
      setLoading(false);
    }
  };

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
          // Check if token is valid
          const { data: invitationData, error: invitationError } = await supabase
            .from('organization_invitations')
            .select('*')
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            {invitationToken ? "Accepter l'invitation" : "Authentification"}
          </CardTitle>
          <CardDescription className="text-center">
            {invitationToken 
              ? "Créez votre compte pour rejoindre l'organisation" 
              : "Connectez-vous à votre compte ou créez-en un nouveau"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!invitationToken ? (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="signin">Se connecter</TabsTrigger>
                <TabsTrigger value="signup">S'inscrire</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input 
                      id="signin-email" 
                      type="email" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)} 
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
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)} 
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
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invitation-email">Email</Label>
                <Input 
                  id="invitation-email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  disabled={!!invitationEmail}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invitation-password">Mot de passe</Label>
                <Input 
                  id="invitation-password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Acceptation..." : "Accepter l'invitation"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Votre application
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthPage;
