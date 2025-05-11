
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function OrganizationSettings() {
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("[OrganizationSettings] Component mounted, redirecting to Settings tab");
    
    // Use a small timeout to prevent rapid redirects
    const redirectTimer = setTimeout(() => {
      // Navigate to the settings page with organization tab open
      navigate('/settings?tab=organization', { replace: true });
      
      // Add toast to inform the user
      toast.info("Redirection vers la page des paramètres");
    }, 100);
    
    return () => clearTimeout(redirectTimer);
  }, []); // No dependencies to avoid redirection loop
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-slate-900 to-blue-950">
      <img 
        src="/lovable-uploads/3afe405e-fa0b-4618-a5a5-433ff1339c5c.png" 
        alt="Logo" 
        className="h-24 w-auto mb-6" 
      />
      <div className="text-lg text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <span className="text-blue-400 font-semibold">Redirection vers les paramètres...</span>
        </div>
        <p className="text-gray-300 mt-2">
          Si vous n'êtes pas redirigé, <button 
            onClick={() => navigate('/settings?tab=organization')} 
            className="text-blue-400 underline hover:text-blue-300"
          >
            cliquez ici
          </button>
        </p>
      </div>
    </div>
  );
}
