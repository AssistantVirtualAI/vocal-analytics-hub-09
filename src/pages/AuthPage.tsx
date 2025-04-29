
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();

  // If already logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setIsLogin(true);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-4">
        <div className="flex justify-center mb-6">
          <img 
            src="/lovable-uploads/3afe405e-fa0b-4618-a5a5-433ff1339c5c.png" 
            alt="Logo" 
            className="h-12 w-auto" 
          />
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">
              {isLogin ? 'Connexion' : 'Inscription'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Connectez-vous à votre compte pour accéder à votre tableau de bord.' 
                : 'Créez un compte pour commencer à utiliser notre plateforme.'}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="votre@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading 
                  ? 'Chargement...' 
                  : isLogin ? 'Se connecter' : 'S\'inscrire'}
              </Button>
              
              <Button 
                type="button" 
                variant="link" 
                className="w-full" 
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin 
                  ? "Vous n'avez pas de compte ? S'inscrire" 
                  : 'Déjà un compte ? Se connecter'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
