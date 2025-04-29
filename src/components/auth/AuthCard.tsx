
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { InvitationForm } from './InvitationForm';

interface AuthCardProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  email: string;
  setEmail: (email: string) => void;
  invitationToken: string | null;
  invitationEmail: string | null;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  activeTab,
  setActiveTab,
  email,
  setEmail,
  invitationToken,
  invitationEmail
}) => {
  const currentYear = new Date().getFullYear();

  return (
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
          </Tabs>
        ) : (
          <InvitationForm 
            email={email}
            invitationEmail={invitationEmail}
            invitationToken={invitationToken}
          />
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          © {currentYear} Votre application
        </p>
      </CardFooter>
    </Card>
  );
};
