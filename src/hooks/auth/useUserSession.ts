
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@supabase/supabase-js';

export interface UserSession {
  session: {
    user: User | null;
  } | null;
  userDetails: User | null;
  isLoading: boolean;
}

export const useUserSession = (): UserSession => {
  const { user, loading } = useAuth();
  
  return {
    session: user ? { user } : null,
    userDetails: user,
    isLoading: loading
  };
};
