
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export function NotificationsSettings() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Préférences de notification</CardTitle>
          <CardDescription>
            Configurez comment et quand vous souhaitez être notifié
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Notifications par email</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Appels nouveaux</p>
                <p className="text-sm text-muted-foreground">
                  Recevez un email lorsqu'un nouvel appel est enregistré
                </p>
              </div>
              <Switch id="new-calls" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Rapports hebdomadaires</p>
                <p className="text-sm text-muted-foreground">
                  Recevoir un résumé hebdomadaire des appels et statistiques
                </p>
              </div>
              <Switch id="weekly-reports" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mises à jour système</p>
                <p className="text-sm text-muted-foreground">
                  Recevez des notifications sur les mises à jour et les nouvelles fonctionnalités
                </p>
              </div>
              <Switch id="system-updates" defaultChecked />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Notifications dans l'application</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Activité utilisateur</p>
                <p className="text-sm text-muted-foreground">
                  Notifications lorsque d'autres utilisateurs interagissent avec vos données
                </p>
              </div>
              <Switch id="user-activity" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertes système</p>
                <p className="text-sm text-muted-foreground">
                  Soyez alerté des événements système importants
                </p>
              </div>
              <Switch id="system-alerts" defaultChecked />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Enregistrer les préférences</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
