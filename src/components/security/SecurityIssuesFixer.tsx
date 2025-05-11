
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function SecurityIssuesFixer() {
  const [loading, setLoading] = useState(false);
  const [fixed, setFixed] = useState(false);

  const handleFixSecurityIssues = async () => {
    setLoading(true);
    setFixed(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-security-issues');
      
      if (error) {
        console.error('Error fixing security issues:', error);
        toast.error('Erreur lors de la correction des problèmes de sécurité');
      } else {
        console.log('Security issues fixed:', data);
        toast.success('Problèmes de sécurité corrigés avec succès');
        setFixed(true);
      }
    } catch (err) {
      console.error('Exception while fixing security issues:', err);
      toast.error('Une erreur est survenue lors de la correction des problèmes de sécurité');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-amber-100/50 dark:border-amber-900/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          {fixed ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
          <CardTitle>Problèmes de sécurité détectés</CardTitle>
        </div>
        <CardDescription>
          Nous avons détecté des problèmes de sécurité dans votre configuration qui devraient être corrigés
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-medium">Problèmes détectés :</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>La sécurité au niveau des lignes (RLS) n'est pas activée sur la table <code>sync_status</code></li>
            <li>L'extension <code>pg_net</code> est installée dans le schéma public</li>
            <li>L'expiration OTP d'authentification est trop longue</li>
          </ul>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md text-sm border border-amber-200 dark:border-amber-800">
          <p>Il est recommandé de corriger ces problèmes pour améliorer la sécurité de votre application.</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleFixSecurityIssues}
          disabled={loading || fixed}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Correction en cours...
            </>
          ) : fixed ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Problèmes corrigés
            </>
          ) : (
            'Corriger les problèmes de sécurité'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
