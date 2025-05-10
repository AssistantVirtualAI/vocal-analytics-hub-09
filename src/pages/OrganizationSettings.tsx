
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OrganizationSettings() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the new settings page with organization tab open
    navigate('/settings?tab=organization', { replace: true });
  }, [navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-slate-900 to-blue-950">
      <img 
        src="/lovable-uploads/64a312fc-c114-4026-9b9d-2ee5d608c95b.png" 
        alt="AVA Dashboard Logo" 
        className="h-24 w-auto mb-6" 
      />
      <div className="text-lg text-center">
        <div className="animate-pulse text-amber-400 font-semibold">Redirection vers les paramètres...</div>
      </div>
    </div>
  );
}
