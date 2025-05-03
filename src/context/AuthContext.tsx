
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean; // Changed from isLoading to loading for consistency
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true, // Changed from isLoading to loading
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Changed from isLoading to loading
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
        
      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Special case for "Email not confirmed" error
        if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
          toast("Veuillez vérifier votre email pour confirmer votre inscription. Consultez votre boîte de réception et vos spams.");
          
          // Send another confirmation email
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email,
          });
          
          if (!resendError) {
            toast("Un nouvel email de confirmation vous a été envoyé.");
          }
        } else {
          // Handle other errors
          throw error;
        }
      } else {
        navigate('/');
        toast("Connexion réussie!");
      }
    } catch (error: any) {
      toast("Erreur de connexion: " + error.message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth' // Ensure redirect goes back to auth page
        }
      });
      if (error) throw error;
      toast("Inscription réussie. Veuillez vérifier votre email pour confirmer votre inscription.");
    } catch (error: any) {
      toast("Erreur d'inscription: " + error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      toast("Erreur de déconnexion: " + error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, // Changed from isLoading to loading
      signIn, 
      signUp, 
      signOut,
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
