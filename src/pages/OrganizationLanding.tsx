
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function OrganizationLanding() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch organization name based on slug
  useEffect(() => {
    async function fetchOrgInfo() {
      if (!orgSlug) return;

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('name')
          .eq('slug', orgSlug)
          .single();

        if (error) throw error;
        setOrgName(data?.name || null);
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast.error('Organisation introuvable');
      } finally {
        setOrgLoading(false);
      }
    }

    fetchOrgInfo();
  }, [orgSlug]);

  // If user is already logged in, check if they have access to this org
  useEffect(() => {
    async function checkAccess() {
      if (!user || !orgSlug) return;

      try {
        // First get the org ID
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', orgSlug)
          .single();

        if (orgError || !orgData) {
          toast.error('Organisation introuvable');
          return;
        }

        // Check if user belongs to this org
        const { data, error } = await supabase
          .from('user_organizations')
          .select('*')
          .eq('organization_id', orgData.id)
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          // User has access to this org, redirect to dashboard
          navigate(`/${orgSlug}/dashboard`);
        }
      } catch (error) {
        console.error('Error checking organization access:', error);
      }
    }

    checkAccess();
  }, [user, orgSlug, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // After login, we'll be redirected by the useEffect above if the user has access
    } catch (error: any) {
      toast.error('Erreur de connexion: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div>Chargement de l'organisation...</div>
      </div>
    );
  }

  if (!orgName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div>Organisation introuvable</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {orgName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Veuillez vous connecter pour accéder au tableau de bord
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nom@exemple.com"
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
