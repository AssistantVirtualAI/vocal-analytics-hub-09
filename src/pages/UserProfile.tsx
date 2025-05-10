
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/Layout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function UserProfile() {
  const { user } = useAuth();
  
  return (
    <DashboardLayout>
      <div className="container p-4 sm:p-6 space-y-6 relative z-10">
        {/* Decorative elements */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-400/5 dark:bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-indigo-400/5 dark:bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/5 dark:bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
        
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
          Profil utilisateur
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Gérez vos informations personnelles</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="flex items-center">
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <Avatar className="h-20 w-20 border-4 border-primary/10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white text-xl">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-medium text-lg">{user?.email?.split('@')[0]}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="font-medium">Adresse email</div>
                  <div className="text-muted-foreground">{user?.email}</div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="font-medium">Identifiant</div>
                  <div className="text-muted-foreground">{user?.id || 'Non disponible'}</div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="font-medium">Date de création</div>
                  <div className="text-muted-foreground">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Non disponible'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>Gérez les paramètres de sécurité de votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Changer le mot de passe
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Activer l'authentification à deux facteurs
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive">
                Supprimer le compte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
