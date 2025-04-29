
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthCard } from '@/components/auth/AuthCard';
import { useInvitationParams } from '@/hooks/auth/useInvitationParams';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('signin');
  
  const { user } = useAuth();
  const navigate = useNavigate();
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
      />
    </div>
  );
};

export default AuthPage;
