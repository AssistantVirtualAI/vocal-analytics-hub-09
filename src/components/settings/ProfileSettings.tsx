
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProfileSettings() {
  const { user } = useAuth();
  
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations de profil</CardTitle>
          <CardDescription>
            Gérez les informations de votre profil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="h-24 w-24 border-4 border-primary/10">
              <AvatarFallback className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white text-2xl">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <h3 className="font-medium">Photo de profil</h3>
              <p className="text-sm text-muted-foreground">
                Cette photo sera affichée sur votre profil et dans vos commentaires.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  Changer
                </Button>
                <Button variant="outline" size="sm">
                  Supprimer
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="display-name">Nom d'affichage</Label>
              <Input id="display-name" placeholder="Votre nom d'affichage" defaultValue={user?.email?.split('@')[0]} />
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" disabled defaultValue={user?.email} />
              <p className="text-sm text-muted-foreground">
                Votre adresse email est utilisée pour vous connecter et ne peut pas être modifiée.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="bio">Biographie</Label>
              <textarea 
                id="bio" 
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Parlez-nous un peu de vous..."
              ></textarea>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Enregistrer les modifications</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
