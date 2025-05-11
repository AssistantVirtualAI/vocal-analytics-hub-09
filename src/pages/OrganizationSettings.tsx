
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function OrganizationSettings() {
  const navigate = useNavigate();
  
  // Use effect to prevent multiple navigations
  useEffect(() => {
    console.log("[OrganizationSettings] Component mounted, redirecting to Settings tab");
    // Navigate to the settings page with organization tab open
    navigate('/settings?tab=organization', { replace: true });
    
    // Add toast to inform the user
    toast.info("Redirection vers la page des paramètres");
  }, []); // Remove navigate dependency to avoid redirection loop
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-slate-900 to-blue-950">
      <img 
        src="/lovable-uploads/3afe405e-fa0b-4618-a5a5-433ff1339c5c.png" 
        alt="Logo" 
        className="h-24 w-auto mb-6" 
      />
      <div className="text-lg text-center">
        <div className="animate-pulse text-blue-400 font-semibold">Redirection vers les paramètres...</div>
        <p className="text-gray-300 mt-2">Si vous n'êtes pas redirigé, <button onClick={() => navigate('/settings?tab=organization')} className="text-blue-400 underline">cliquez ici</button></p>
      </div>
    </div>
  );
}
