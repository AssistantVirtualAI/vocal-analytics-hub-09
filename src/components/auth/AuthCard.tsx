
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { InvitationForm } from './InvitationForm';
import { ResetPasswordForm } from './ResetPasswordForm';

interface AuthCardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  email: string;
  setEmail: (email: string) => void;
  invitationToken: string | null;
  invitationEmail: string | null;
  resetError?: string | null;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  activeTab,
  setActiveTab,
  email,
  setEmail,
  invitationToken,
  invitationEmail,
  resetError
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl text-center">
          {invitationToken ? "Accepter l'invitation" : 
           activeTab === 'reset-password' ? "Réinitialisation du mot de passe" : 
           "Authentification"}
        </CardTitle>
        <CardDescription className="text-center">
          {invitationToken 
            ? "Créez votre compte pour rejoindre l'organisation" 
            : activeTab === 'reset-password'
            ? "Entrez votre email pour réinitialiser votre mot de passe"
            : "Connectez-vous à votre compte ou créez-en un nouveau"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!invitationToken ? (
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Se connecter</TabsTrigger>
              <TabsTrigger value="signup">S'inscrire</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <LoginForm onEmailChange={setEmail} />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignupForm 
                email={email}
                invitationEmail={invitationEmail}
                invitationToken={invitationToken}
                onEmailChange={setEmail}
              />
            </TabsContent>

            <TabsContent value="reset-password">
              <ResetPasswordForm 
                email={email} 
                onEmailChange={setEmail} 
                error={resetError} 
              />
            </TabsContent>
          </Tabs>
        ) : (
          <InvitationForm 
            email={email}
            invitationEmail={invitationEmail}
            invitationToken={invitationToken}
          />
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center">
        {activeTab === 'signin' && (
          <button 
            onClick={() => setActiveTab('reset-password')}
            className="text-sm text-blue-500 hover:underline mb-2"
          >
            Mot de passe oublié ?
          </button>
        )}
        {activeTab === 'reset-password' && (
          <button 
            onClick={() => setActiveTab('signin')}
            className="text-sm text-blue-500 hover:underline mb-2"
          >
            Retour à la connexion
          </button>
        )}
        <p className="text-sm text-gray-500">
          © {currentYear} Votre application
        </p>
      </CardFooter>
    </Card>
  );
};
