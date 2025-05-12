
export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Sécurité</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Gérez vos paramètres de sécurité et vos préférences
        </p>
      </div>
      
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium">Paramètres d'authentification</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Options de sécurité pour votre compte
        </p>
        {/* Authentication settings will be added here */}
      </div>
    </div>
  );
}
