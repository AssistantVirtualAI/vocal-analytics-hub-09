
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OrganizationSettings() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the new settings page with organization tab open
    navigate('/settings?tab=organization', { replace: true });
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg animate-pulse">Redirection vers les paramètres...</div>
    </div>
  );
}
