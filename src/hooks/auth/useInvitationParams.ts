
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useInvitationParams = () => {
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('invitation');
    const emailFromUrl = params.get('email');

    if (token) {
      setInvitationToken(token);
      
      if (emailFromUrl) {
        setInvitationEmail(emailFromUrl);
      }
    }
  }, [location]);

  return {
    invitationToken,
    invitationEmail
  };
};
