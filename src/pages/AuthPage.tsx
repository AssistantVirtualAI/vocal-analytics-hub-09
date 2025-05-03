
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthCard } from '@/components/auth/AuthCard';
import { useInvitationParams } from '@/hooks/auth/useInvitationParams';
import { toast } from 'sonner';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  const [resetError, setResetError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { invitationToken, invitationEmail } = useInvitationParams();

  // Set initial state based on invitation
  useEffect(() => {
    if (invitationToken) {
      setActiveTab('signup');
      
      if (invitationEmail) {
        setEmail(invitationEmail);
      }
    }
  }, [invitationToken, invitationEmail]);
  
  // Check for reset password mode or errors
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace('#', ''));
    
    // Check for reset password mode
    const isReset = searchParams.get('reset') === 'true';
    if (isReset) {
      setActiveTab('reset-password');
    }
    
    // Check for reset errors in URL hash
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');
    
    if (errorCode) {
      const formattedError = errorDescription 
        ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) 
        : "Une erreur s'est produite lors de la réinitialisation de votre mot de passe.";
      
      setResetError(formattedError);
      setActiveTab('reset-password');
      toast.error(formattedError);
    }
  }, [location]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <AuthCard 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        email={email}
        setEmail={setEmail}
        invitationToken={invitationToken}
        invitationEmail={invitationEmail}
        resetError={resetError}
      />
    </div>
  );
};

export default AuthPage;
